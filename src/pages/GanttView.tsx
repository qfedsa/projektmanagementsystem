import React, { useEffect, useState, useRef } from 'react';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { BarChart2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

export function GanttView() {
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const [gantt, setGantt] = useState<any>(null);

  // Lade DHTMLX Gantt dynamisch
  useEffect(() => {
    const loadGantt = async () => {
      try {
        const ganttModule = await import('dhtmlx-gantt');
        setGantt(ganttModule.default);
      } catch (err) {
        console.error('Fehler beim Laden des Gantt-Moduls:', err);
        setError('Fehler beim Laden des Gantt-Diagramms');
      }
    };
    loadGantt();
  }, []);

  // Initialisiere Gantt-Diagramm wenn das Modul geladen ist
  useEffect(() => {
    if (!gantt || !ganttContainerRef.current || !projectId) return;

    try {
      // Konfiguriere das Gantt-Diagramm
      gantt.config.date_format = "%Y-%m-%d %H:%i";
      gantt.config.drag_links = false;
      gantt.config.drag_progress = false;
      gantt.config.drag_resize = false;
      gantt.config.drag_move = false;
      
      // Deutsche Lokalisierung
      gantt.i18n.setLocale('de');

      // Konfiguriere die Spalten
      gantt.config.columns = [
        { name: "text", label: "Aufgabe", tree: true, width: 200 },
        { name: "start_date", label: "Start", align: "center", width: 80 },
        { name: "duration", label: "Dauer (Tage)", align: "center", width: 80 },
        { name: "responsible_party", label: "Gewerkschaft", align: "left", width: 130 },
      ];

      // Markiere Wochenenden
      gantt.templates.scale_cell_class = function(date: Date) {
        if (date.getDay() === 0 || date.getDay() === 6) {
          return "weekend-scale";
        }
        return "";
      };

      gantt.templates.timeline_cell_class = function(item: any, date: Date) {
        if (date.getDay() === 0 || date.getDay() === 6) {
          return "weekend-cell";
        }
        return "";
      };

      // Angepasstes Tooltip-Template
      gantt.templates.tooltip_text = function(start: Date, end: Date, task: any) {
        return `<div class="tooltip-title">${task.text}</div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Start:</span>
                  <span class="tooltip-value">${gantt.templates.tooltip_date_format(start)}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Ende:</span>
                  <span class="tooltip-value">${gantt.templates.tooltip_date_format(end)}</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Dauer:</span>
                  <span class="tooltip-value">${task.duration} Tage</span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">Gewerkschaft:</span>
                  <span class="tooltip-value">${task.responsible_party}</span>
                </div>`;
      };

      // Task-Styling basierend auf Status
      gantt.templates.task_class = function(start: Date, end: Date, task: any) {
        if (task.delay > 0) {
          return 'delayed-task';
        }
        if (task.type === 'milestone') {
          return 'milestone';
        }
        return '';
      };

      // Initialisiere das Diagramm
      gantt.init(ganttContainerRef.current);

      // Lade die Daten
      loadGanttData();

      // Cleanup beim Unmount
      return () => {
        gantt.clearAll();
      };
    } catch (err) {
      console.error('Fehler bei der Gantt-Initialisierung:', err);
      setError('Fehler bei der Gantt-Initialisierung');
    }
  }, [gantt, projectId]);

  // Lade Projektdaten und richte Echtzeit-Listener ein
  const loadGanttData = async () => {
    if (!projectId || !gantt) return;

    try {
      setIsLoading(true);
      setError(null);

      // Lade Projektdaten und Tasks parallel
      const [projectResponse, tasksResponse, delaysResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('start_date')
          .eq('id', projectId)
          .single(),
        supabase
          .from('tasks')
          .select(`
            id,
            task_name,
            duration,
            position,
            responsible_party,
            dependencies (
              dependent_task_id
            )
          `)
          .eq('project_id', projectId)
          .order('position'),
        supabase
          .from('delays')
          .select('task_id, delay_days')
          .eq('project_id', projectId)
      ]);

      if (projectResponse.error) throw projectResponse.error;
      if (tasksResponse.error) throw tasksResponse.error;
      if (delaysResponse.error) throw delaysResponse.error;

      // Erstelle eine Map für Verzögerungen
      const delaysMap = new Map();
      if (delaysResponse.data) {
        delaysResponse.data.forEach(delay => {
          const currentDelay = delaysMap.get(delay.task_id) || 0;
          delaysMap.set(delay.task_id, currentDelay + delay.delay_days);
        });
      }

      // Konvertiere Tasks in Gantt-Format
      const ganttTasks = tasksResponse.data?.map(task => {
        const taskStartDate = new Date(projectResponse.data.start_date);
        taskStartDate.setDate(taskStartDate.getDate() + task.position);

        return {
          id: task.id,
          text: task.task_name,
          start_date: taskStartDate,
          duration: task.duration,
          responsible_party: task.responsible_party,
          delay: delaysMap.get(task.id) || 0,
          progress: 0,
          dependencies: task.dependencies
            ?.map(dep => dep.dependent_task_id)
            .filter(Boolean)
            .join(',')
        };
      }) || [];

      // Aktualisiere das Gantt-Diagramm
      gantt.clearAll();
      gantt.parse({ data: ganttTasks });

      // Passe die Zeitskala an
      const startDate = new Date(projectResponse.data.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + ganttTasks.reduce((acc, task) => acc + task.duration, 0) + 14);
      
      gantt.config.start_date = startDate;
      gantt.config.end_date = endDate;
      gantt.render();

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      setError('Fehler beim Laden der Projektdaten');
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId || !projectName) {
    return <NoProjectSelected />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gantt-Diagramm</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div 
            ref={ganttContainerRef}
            className="border border-gray-200 rounded-lg"
            style={{ height: '600px', width: '100%' }}
          />
        )}
      </div>
    </div>
  );
}

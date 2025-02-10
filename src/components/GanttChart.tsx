import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import type { Task } from '../types';

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
}

interface GanttChartProps {
  tasks: Task[];
  startDate: string;
}

export function GanttChart({ tasks, startDate }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    // Konvertiere Tasks in das Frappe Gantt Format
    const ganttTasks = tasks.map(task => {
      // Berechne das Enddatum basierend auf der Dauer
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + task.duration);

      return {
        id: task.id,
        name: task.task_name,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        progress: 0,
        dependencies: task.dependencies ? [task.dependencies] : []
      };
    });

    // Initialisiere das Gantt-Diagramm
    if (ganttRef.current) {
      ganttRef.current.refresh(ganttTasks);
    } else {
      ganttRef.current = new Gantt(containerRef.current, ganttTasks, {
        view_modes: ['Day', 'Week', 'Month'],
        view_mode: 'Week',
        language: 'de',
        custom_popup_html: (task: GanttTask) => {
          const startDate = new Date(task.start).toLocaleDateString('de-DE');
          const endDate = new Date(task.end).toLocaleDateString('de-DE');
          return `
            <div class="p-2 bg-white rounded shadow">
              <h4 class="font-bold">${task.name}</h4>
              <p>Start: ${startDate}</p>
              <p>Ende: ${endDate}</p>
            </div>
          `;
        }
      });
    }

    // Cleanup
    return () => {
      if (ganttRef.current) {
        ganttRef.current = null;
      }
    };
  }, [tasks, startDate]);

  return (
    <div className="gantt-container overflow-x-auto">
      <div ref={containerRef}></div>
    </div>
  );
}

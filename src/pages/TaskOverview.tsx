import React, { useState, useEffect } from 'react';
import { Plus, Play, XCircle, AlertTriangle, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { getTasks, saveTasks } from '../services/localStorageService';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { useAuth } from '../context/AuthContext';

// Make.com webhook URL
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/yiehybdy5eiea4a9c0guau42x7q7jpqx';

// Cache für Subunternehmer
const subcontractorCache = new Map<string, {name: string, timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialer Cache-Load aus localStorage
try {
  const cachedData = localStorage.getItem('subcontractorCache');
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    Object.entries(parsed).forEach(([id, data]: [string, any]) => {
      subcontractorCache.set(id, data);
    });
  }
} catch (err) {
  console.error('Error loading subcontractor cache:', err);
}

export function TaskOverview() {
  const { user } = useAuth();
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [startDate, setStartDate] = useState(() => localStorage.getItem('startDate') || '');
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());
  const [subcontractors, setSubcontractors] = useState<Record<string, string>>(() => {
    // Initialer State aus Cache
    const now = Date.now();
    const cachedData: Record<string, string> = {};
    subcontractorCache.forEach((value, key) => {
      if (now - value.timestamp < CACHE_TTL) {
        cachedData[key] = value.name;
      }
    });
    return cachedData;
  });
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('startDate', startDate);
  }, [startDate]);

  // Load subcontractors with caching
  useEffect(() => {
    if (!user) return;

    const loadSubcontractors = async () => {
      try {
        const now = Date.now();
        let needsUpdate = false;

        // Check if cache needs update
        subcontractorCache.forEach((value) => {
          if (now - value.timestamp >= CACHE_TTL) {
            needsUpdate = true;
          }
        });

        // Update cache if needed or empty
        if (needsUpdate || subcontractorCache.size === 0) {
          const { data, error } = await supabase
            .from('subcontractors')
            .select('id, name')
            .eq('user_id', user.id);

          if (error) throw error;

          const lookup: Record<string, string> = {};
          (data || []).forEach(({ id, name }) => {
            lookup[id] = name;
            subcontractorCache.set(id, { name, timestamp: now });
          });

          // Update localStorage cache
          localStorage.setItem('subcontractorCache', JSON.stringify(
            Object.fromEntries(subcontractorCache.entries())
          ));

          setSubcontractors(lookup);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Subunternehmer:', err);
      }
    };

    loadSubcontractors();
  }, [user]);

  if (!projectId || !projectName) {
    return <NoProjectSelected />;
  }

  const moveTask = (index: number, direction: 'up' | 'down') => {
    try {
      const newTasks = [...tasks];
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= tasks.length) {
        return;
      }

      [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];

      const updatedTasks = newTasks.map((task, i) => ({
        ...task,
        position: i
      }));

      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      
      setSuccessMessage('Aufgabenreihenfolge wurde aktualisiert');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Fehler beim Verschieben der Aufgabe:', err);
      setError('Fehler beim Verschieben der Aufgabe');
    }
  };

  const startProject = async () => {
    if (!startDate || !user) {
      setError('Bitte wählen Sie ein Startdatum aus.');
      return;
    }

    if (!tasks.length) {
      setError('Bitte fügen Sie zuerst Aufgaben hinzu.');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      // Validiere Tasks
      for (const task of tasks) {
        if (!task.task_name.trim()) {
          throw new Error('Alle Aufgaben müssen einen Namen haben');
        }
        if (task.duration <= 0) {
          throw new Error(`Ungültige Dauer für Aufgabe: ${task.task_name}`);
        }
        if (!task.responsible_party) {
          throw new Error(`Keine Gewerkschaft für Aufgabe: ${task.task_name}`);
        }
      }

      // Erstelle/Update Projekt in Supabase
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .upsert([{
          id: projectId,
          project_name: projectName,
          start_date: startDate,
          created_at: new Date().toISOString(),
          completed: false,
          started: true,
          user_id: user.id
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Speichere Tasks in Supabase
      const tasksToInsert = tasks.map(task => ({
        id: task.id,
        task_name: task.task_name,
        duration: task.duration,
        responsible_party: task.responsible_party,
        position: task.position,
        project_id: projectId,
        started: false,
        completed: false,
        user_id: user.id
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .upsert(tasksToInsert);

      if (tasksError) throw tasksError;

      // Speichere Abhängigkeiten
      const dependencies = tasks
        .filter(task => task.dependencies)
        .map(task => ({
          task_id: task.id,
          dependent_task_id: task.dependencies
        }));

      if (dependencies.length > 0) {
        const { error: deleteError } = await supabase
          .from('dependencies')
          .delete()
          .in('task_id', tasks.map(t => t.id));

        if (deleteError) throw deleteError;

        const { error: depsError } = await supabase
          .from('dependencies')
          .insert(dependencies);

        if (depsError) throw depsError;
      }

      // Sende Daten an Make.com Webhook
      const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          start_date: startDate,
          user_id: user.id,
          project_name: projectName,
          tasks: tasks.map(task => ({
            id: task.id,
            task_name: task.task_name,
            duration: task.duration,
            responsible_party: subcontractors[task.responsible_party] || task.responsible_party,
            position: task.position,
            dependency: task.dependencies || null
          }))
        })
      });

      if (!webhookResponse.ok) {
        throw new Error('Fehler beim Benachrichtigen des Workflow-Systems');
      }

      // Update lokalen Projektstatus
      const storageKey = `projects_${user.id}`;
      const localProjectsStr = localStorage.getItem(storageKey);
      if (localProjectsStr) {
        const localProjects = JSON.parse(localProjectsStr);
        const updatedProjects = localProjects.map((p: any) => 
          p.id === projectId ? { ...p, started: true } : p
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
      }
      
      setSuccessMessage('Projekt wurde erfolgreich gestartet!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Fehler beim Starten des Projekts:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Starten des Projekts');
    } finally {
      setIsStarting(false);
    }
  };

  const clearAllTasks = () => {
    if (window.confirm('Möchten Sie wirklich alle Aufgaben löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setTasks([]);
      saveTasks([]);
      setSuccessMessage('Alle Aufgaben wurden gelöscht');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aufgabenübersicht</h1>
          {successMessage && (
            <div className="bg-green-50 text-green-800 py-1 px-4 rounded-lg border-l-4 border-green-400">
              {successMessage}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">Projektstartdatum</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-24 px-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Position
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aufgabe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dauer (Tage)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gewerkschaft
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abhängigkeit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task, index) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveTask(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                        }`}
                        title="Nach oben verschieben"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveTask(index, 'down')}
                        disabled={index === tasks.length - 1}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          index === tasks.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                        }`}
                        title="Nach unten verschieben"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.task_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {subcontractors[task.responsible_party] || task.responsible_party}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.dependencies ? tasks.find(t => t.id === task.dependencies)?.task_name || '-' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        if (window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
                          const newTasks = tasks.filter(t => t.id !== task.id);
                          setTasks(newTasks);
                          saveTasks(newTasks);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 transition-colors duration-150"
                      title="Aufgabe löschen"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between">
          {tasks.length > 0 && (
            <>
              <button
                onClick={clearAllTasks}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-150"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Alle Aufgaben löschen
              </button>

              <button
                onClick={startProject}
                disabled={isStarting}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors duration-150"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Projekt wird gestartet...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Projekt starten
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';

interface KanbanViewProps {
  projectId: string;
}

export function KanbanView({ projectId }: KanbanViewProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Try loading from localStorage first for immediate display
    try {
      const cached = localStorage.getItem(`kanban_tasks_${projectId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKanbanData();

    const channel = supabase
      .channel(`tasks-kanban-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadKanbanData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  async function loadKanbanData() {
    try {
      const { data, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          task_name,
          duration,
          started,
          completed,
          subcontractors!tasks_responsible_party_fkey (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('position');

      if (tasksError) throw tasksError;
      
      // Cache the data in localStorage
      if (data) {
        localStorage.setItem(`kanban_tasks_${projectId}`, JSON.stringify(data));
        setTasks(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Kanban-Daten:', err);
      setError('Fehler beim Laden der Kanban-Daten');
    }
  }

  const columns = {
    todo: tasks.filter(task => !task.started && !task.completed),
    inProgress: tasks.filter(task => task.started && !task.completed),
    done: tasks.filter(task => task.completed)
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-gray-50 p-4 rounded-lg min-h-[300px]">
        <h3 className="font-medium text-gray-900 mb-4">Ausstehend</h3>
        <div className="space-y-3">
          {columns.todo.map(task => (
            <div
              key={task.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <h4 className="font-medium text-gray-900 break-words">{task.task_name}</h4>
              <p className="text-sm text-gray-500 mt-1 break-words">
                {task.subcontractors?.name}
              </p>
              <p className="text-sm text-gray-500">
                Dauer: {task.duration} Tage
              </p>
            </div>
          ))}
          {columns.todo.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              Keine ausstehenden Aufgaben
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg min-h-[300px]">
        <h3 className="font-medium text-gray-900 mb-4">In Bearbeitung</h3>
        <div className="space-y-3">
          {columns.inProgress.map(task => (
            <div
              key={task.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-blue-200"
            >
              <h4 className="font-medium text-gray-900 break-words">{task.task_name}</h4>
              <p className="text-sm text-gray-500 mt-1 break-words">
                {task.subcontractors?.name}
              </p>
              <p className="text-sm text-gray-500">
                Dauer: {task.duration} Tage
              </p>
            </div>
          ))}
          {columns.inProgress.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              Keine Aufgaben in Bearbeitung
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg min-h-[300px]">
        <h3 className="font-medium text-gray-900 mb-4">Abgeschlossen</h3>
        <div className="space-y-3">
          {columns.done.map(task => (
            <div
              key={task.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-green-200"
            >
              <h4 className="font-medium text-gray-900 break-words">{task.task_name}</h4>
              <p className="text-sm text-gray-500 mt-1 break-words">
                {task.subcontractors?.name}
              </p>
              <p className="text-sm text-gray-500">
                Dauer: {task.duration} Tage
              </p>
            </div>
          ))}
          {columns.done.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              Keine abgeschlossenen Aufgaben
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

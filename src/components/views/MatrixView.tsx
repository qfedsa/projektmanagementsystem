import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types';

interface MatrixViewProps {
  projectId: string;
}

export function MatrixView({ projectId }: MatrixViewProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Try loading from localStorage first for immediate display
    try {
      const cached = localStorage.getItem(`matrix_tasks_${projectId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatrixData();

    const channel = supabase
      .channel(`tasks-matrix-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadMatrixData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  async function loadMatrixData() {
    try {
      const { data, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          task_name,
          duration,
          start_date,
          calculated_end_date,
          position,
          started,
          completed,
          subcontractors!inner (
            name
          ),
          delays (
            delay_days
          )
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (tasksError) throw tasksError;
      
      // Cache the data in localStorage
      if (data) {
        localStorage.setItem(`matrix_tasks_${projectId}`, JSON.stringify(data));
        setTasks(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Matrix-Daten:', err);
      setError('Fehler beim Laden der Matrix-Daten');
    }
  }

  const getTaskStatus = (task: Task): string => {
    if (task.completed) return 'Erledigt';
    if (task.started) return 'In Bearbeitung';
    return 'Ausstehend';
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[768px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aufgabe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gewerkschaft
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dauer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verzögerung
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Keine Aufgaben verfügbar
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const totalDelay = task.delays?.reduce((sum, delay) => sum + delay.delay_days, 0) || 0;
                  const status = getTaskStatus(task);

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {task.task_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {task.subcontractors?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {task.duration} Tage
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          status === 'Erledigt'
                            ? 'bg-green-100 text-green-800'
                            : status === 'In Bearbeitung'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {totalDelay > 0 ? (
                          <span className="text-sm text-red-600">
                            {totalDelay} Tage
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

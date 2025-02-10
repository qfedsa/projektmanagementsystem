import React, { useState, useEffect } from 'react';  // Semicolon added here
    import { MoveHorizontal, Loader2, AlertTriangle } from 'lucide-react';
    import { supabase } from '../lib/supabase';
    import type { Task } from '../types';
    import { NoProjectSelected } from '../components/NoProjectSelected';
    import { usePageCache } from '../hooks/usePageCache';
    import { useSubscriptionCache } from '../hooks/useSubscriptionCache';
    import { useAuth } from '../context/AuthContext';

    const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/5rmx68swrx7gcqx16dyte0189bc9n9v7';

    export function ShiftTask() {
      const { user } = useAuth();
      const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
      const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
      const [tasks, setTasks] = useState<Task[]>([]);
      const [selectedTaskId, setSelectedTaskId] = useState('');
      const [shiftReason, setShiftReason] = useState('');
      const [shiftDays, setShiftDays] = useState<number | ''>(0);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [successMessage, setSuccessMessage] = useState<string | null>(null);

      const { getCachedData, invalidateCache } = usePageCache(
        `shift-tasks-${projectId}`,
        loadTasks,
        [projectId]
      );

      const { invalidateSubscription } = useSubscriptionCache({
        projectId: projectId || '',
        table: 'tasks',
        onUpdate: () => {
          invalidateCache();
          loadTasks();
        }
      });

      useEffect(() => {
        if (projectId && user) {
          const cachedData = getCachedData();
          if (cachedData) {
            setTasks(cachedData);
          } else {
            loadTasks();
          }
        }

        return () => {
          invalidateSubscription();
        };
      }, [projectId, user, getCachedData, invalidateSubscription]);

      async function loadTasks() {
        if (!projectId || !user) return null;

        try {
          const { data, error: tasksError } = await supabase
            .from('tasks')
            .select('id, task_name')
            .eq('project_id', projectId)
            .order('position');
          
          if (tasksError) throw tasksError;
          setTasks(data || []);
          return data;
        } catch (err) {
          console.error('Fehler beim Laden der Aufgaben:', err);
          setError('Fehler beim Laden der Aufgaben');
          return null;
        }
      }

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTaskId || !shiftReason || !shiftDays || shiftDays <= 0 || !user) {
          setError('Bitte füllen Sie alle Felder aus.');
          return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
          // Validiere Projekt-ID
          if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
            throw new Error('Ungültige Projekt-ID');
          }

          // Bereite Webhook-Daten vor
          const webhookData = {
            task_id: selectedTaskId,
            project_id: projectId,
            delay_reason: shiftReason,
            shift_days: Number(shiftDays),
            user_id: user.id
          };

          // Sende Daten NUR an Make.com Webhook
          const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
          });

          if (!webhookResponse.ok) {
            throw new Error('Webhook-Aufruf fehlgeschlagen');
          }

          setSelectedTaskId('');
          setShiftReason('');
          setShiftDays(0);
          setSuccessMessage('Verschiebung wurde erfolgreich gemeldet.');
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
          console.error('Fehler beim Melden der Verschiebung:', err);
          setError('Fehler beim Melden der Verschiebung');
        } finally {
          setIsSubmitting(false);
        }
      };

      if (!projectId || !projectName) {
        return <NoProjectSelected />;
      }

      return (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Verschiebung einer Aufgabe</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Betroffene Aufgabe
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.task_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grund der Verschiebung
                </label>
                <textarea
                  value={shiftReason}
                  onChange={(e) => setShiftReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Verschiebung in Tagen
                </label>
                <input
                  type="number"
                  min="1"
                  value={shiftDays}
                  onChange={(e) => setShiftDays(e.target.value ? parseInt(e.target.value) : '')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                <MoveHorizontal className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Wird gemeldet...' : 'Verschiebung melden'}
              </button>
            </form>
          </div>
        </div>
      );
    }

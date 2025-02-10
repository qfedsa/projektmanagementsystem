import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { usePageCache } from '../hooks/usePageCache';
import { useSubscriptionCache } from '../hooks/useSubscriptionCache';
import { useAuth } from '../context/AuthContext';

export function ReportDelay() {
  const { user } = useAuth();
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [delayDays, setDelayDays] = useState<number | ''>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { getCachedData, invalidateCache } = usePageCache(
    `delay-tasks-${projectId}`,
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
  }, [projectId, user]);

  async function loadTasks() {
    if (!projectId || !user) return null;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, task_name')
        .eq('project_id', projectId)
        .order('position');
      
      if (error) throw error;
      setTasks(data || []);
      return data;
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
      setError('Fehler beim Laden der Aufgaben');
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !delayReason || !delayDays || delayDays <= 0 || !user) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
        throw new Error('Ungültige Projekt-ID');
      }

      // Speichere Verzögerung in Supabase
      const { error: insertError } = await supabase
        .from('delays')
        .insert([{
          task_id: selectedTaskId,
          project_id: projectId,
          delay_reason: delayReason,
          delay_days: delayDays,
          user_id: user.id
        }]);

      if (insertError) throw insertError;

      // Webhook für Make.com aufrufen
      const webhookResponse = await fetch('https://hook.eu2.make.com/yiehybdy5eiea4a9c0guau42x7q7jpqx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTaskId,
          project_id: projectId,
          delay_reason: delayReason,
          delay_days: delayDays,
          user_id: user.id
        })
      });

      if (!webhookResponse.ok) {
        throw new Error('Fehler beim Benachrichtigen des Workflow-Systems');
      }

      setSelectedTaskId('');
      setDelayReason('');
      setDelayDays(0);
      setSuccessMessage('Verzögerung wurde erfolgreich gemeldet.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Fehler beim Melden der Verzögerung:', error);
      setError('Fehler beim Melden der Verzögerung');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Verzögerung melden</h1>

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
              Grund der Verzögerung
            </label>
            <textarea
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Verzögerung in Tagen
            </label>
            <input
              type="number"
              min="1"
              value={delayDays}
              onChange={(e) => setDelayDays(e.target.value ? parseInt(e.target.value) : '')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Wird gemeldet...' : 'Verzögerung melden'}
          </button>
        </form>
      </div>
    </div>
  );
}

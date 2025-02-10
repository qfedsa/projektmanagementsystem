import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type { Task, Subcontractor } from '../types';
import { getTasks, addTask } from '../services/localStorageService';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { useAuth } from '../context/AuthContext';

export function AddTask() {
  const { user } = useAuth();
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [startDate, setStartDate] = useState(() => localStorage.getItem('startDate') || '');
  const [task, setTask] = useState<Task>({
    id: uuidv4(),
    project_id: projectId || '',
    task_name: '',
    duration: 0,
    responsible_party: '',
    dependencies: null,
    position: 0
  });
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('startDate', startDate);
  }, [startDate]);

  // Lade Subunternehmer aus Supabase
  useEffect(() => {
    if (user) {
      loadSubcontractors();
    } else {
      setSubcontractors([]);
    }
  }, [user]);

  const loadSubcontractors = async () => {
    try {
      const { data, error: loadError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (loadError) throw loadError;
      setSubcontractors(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Subunternehmer:', err);
      setError('Fehler beim Laden der Subunternehmer');
    }
  };

  if (!projectId || !projectName) {
    return <NoProjectSelected />;
  }

  const handleInputChange = (field: keyof Task, value: string | number) => {
    setTask(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.task_name || task.duration <= 0 || !task.responsible_party) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const updatedTasks = addTask({
        ...task,
        id: uuidv4(),
        dependencies: task.dependencies || null,
        position: tasks.length
      });
      
      setTasks(updatedTasks);
      setTask({
        id: uuidv4(),
        project_id: projectId,
        task_name: '',
        duration: 0,
        responsible_party: '',
        dependencies: null,
        position: 0
      });
      setSuccessMessage('Aufgabe wurde erfolgreich hinzugefügt');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Fehler beim Speichern der Aufgabe:', err);
      setError('Fehler beim Speichern der Aufgabe');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Neue Aufgabe hinzufügen</h1>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Aufgabenname</label>
              <input
                type="text"
                value={task.task_name}
                onChange={(e) => handleInputChange('task_name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="z.B. Fundament gießen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dauer (in Tagen)</label>
              <input
                type="number"
                value={task.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zuständige Gewerkschaft</label>
              <select
                value={task.responsible_party}
                onChange={(e) => handleInputChange('responsible_party', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Bitte wählen...</option>
                {subcontractors.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Abhängigkeit</label>
              <select
                value={task.dependencies || ''}
                onChange={(e) => handleInputChange('dependencies', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Keine Abhängigkeit</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.task_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
          >
            <Plus className="w-5 h-5 mr-2" />
            Aufgabe hinzufügen
          </button>
        </form>
      </div>
    </div>
  );
}

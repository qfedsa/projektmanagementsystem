import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Task, Subcontractor } from '../types';

interface TaskFormProps {
  task: Task;
  index: number;
  tasks: Task[];
  subcontractors: Subcontractor[];
  updateTask: (index: number, field: keyof Task, value: string | string[] | number) => void;
  removeTask: (index: number) => void;
}

export function TaskForm({ task, index, tasks, subcontractors, updateTask, removeTask }: TaskFormProps) {
  // Filtere die aktuelle Aufgabe aus der Abhängigkeitsliste aus
  const availableDependencies = tasks.filter((t, i) => i < index);

  // Konvertiere dependencies String zu Array
  const selectedDependencies = task.dependencies ? task.dependencies.split(',').filter(Boolean) : [];

  const handleDependencyChange = (taskId: string) => {
    const currentDeps = selectedDependencies;
    const newDeps = currentDeps.includes(taskId)
      ? currentDeps.filter(dep => dep !== taskId)
      : [...currentDeps, taskId];
    
    updateTask(index, 'dependencies', newDeps.join(','));
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Aufgabenname</label>
          <input
            type="text"
            value={task.task_name}
            onChange={(e) => updateTask(index, 'task_name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="z.B. Fundament gießen"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Dauer (in Tagen)</label>
          <input
            type="number"
            value={task.duration}
            onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value))}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Zuständige Gewerkschaft</label>
          <select
            value={task.responsible_party}
            onChange={(e) => updateTask(index, 'responsible_party', e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abhängigkeiten
            {availableDependencies.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                (Mehrfachauswahl möglich)
              </span>
            )}
          </label>
          <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-sm max-h-48 overflow-y-auto">
            {availableDependencies.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                Dies ist die erste Aufgabe und kann keine Abhängigkeiten haben.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {availableDependencies.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(t.id)}
                        onChange={() => handleDependencyChange(t.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{t.task_name}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedDependencies.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
              <div className="text-sm font-medium text-blue-700">
                {selectedDependencies.length} Abhängigkeit{selectedDependencies.length !== 1 ? 'en' : ''} ausgewählt:
              </div>
              <div className="mt-1 text-sm text-blue-600">
                {availableDependencies
                  .filter(t => selectedDependencies.includes(t.id))
                  .map(t => t.task_name)
                  .join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => removeTask(index)}
        className="mt-4 flex items-center text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Aufgabe entfernen
      </button>
    </div>
  );
}

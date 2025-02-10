import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export async function createDependencies(tasks: Task[], insertedTasks: any[]) {
  try {
    // Erstelle eine Map für schnellen Task-Name zu ID Lookup
    const taskNameToId = new Map(
      insertedTasks.map(task => [task.task_name, task.id])
    );

    // Erstelle Dependencies basierend auf den Task-Namen
    const dependenciesToInsert = tasks
      .filter(task => task.dependencies && task.dependencies.trim() !== '')
      .flatMap(task => {
        const taskId = taskNameToId.get(task.task_name);
        // Teile die Dependencies-String in einzelne Task-Namen
        const dependentTaskNames = task.dependencies.split(',').map(d => d.trim());
        
        return dependentTaskNames.map(depTaskName => {
          const dependentTaskId = taskNameToId.get(depTaskName);
          
          if (!taskId || !dependentTaskId) {
            console.warn(`Ungültige Abhängigkeit: ${task.task_name} -> ${depTaskName}`);
            return null;
          }

          return {
            task_id: taskId,
            dependent_task_id: dependentTaskId
          };
        });
      })
      .filter((dep): dep is { task_id: string; dependent_task_id: string } => dep !== null);

    if (dependenciesToInsert.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('dependencies')
      .insert(dependenciesToInsert)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fehler beim Erstellen der Abhängigkeiten:', error);
    throw error;
  }
}

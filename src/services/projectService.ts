import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export async function createProject(startDate: string) {
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([{ start_date: startDate }])
      .select()
      .single();

    if (projectError) throw projectError;
    return projectData;
  } catch (error) {
    console.error('Fehler beim Erstellen des Projekts:', error);
    throw error;
  }
}

export async function createTasks(projectId: string, tasks: Task[]) {
  try {
    // Erstelle einen Basis-Zeitstempel
    const baseTimestamp = new Date();
    
    // Füge Tasks sequentiell ein, um die Reihenfolge zu erhalten
    const insertedTasks = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      // Füge 0.1 Sekunden für jede nachfolgende Aufgabe hinzu
      const taskTimestamp = new Date(baseTimestamp.getTime() + (i * 100));
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          task_name: task.task_name,
          duration: task.duration,
          responsible_party: task.responsible_party,
          project_id: projectId,
          created_at: taskTimestamp.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Keine Daten zurückgegeben');
      
      insertedTasks.push(data);
    }

    return insertedTasks;
  } catch (error) {
    console.error('Fehler beim Erstellen der Tasks:', error);
    throw error;
  }
}

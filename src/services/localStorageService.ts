import type { Task } from '../types';

export const LOCAL_STORAGE_KEYS = {
  TASKS_PREFIX: 'tasks_',  // Prefix für projektspezifische Tasks
  PROJECT_ID: 'currentProjectId',
  PROJECT_NAME: 'currentProjectName',
  START_DATE: 'startDate'
} as const;

// Hilfsfunktion um den projektspezifischen Storage-Key zu erstellen
function getTasksKey(projectId: string): string {
  return `${LOCAL_STORAGE_KEYS.TASKS_PREFIX}${projectId}`;
}

export function getTasks(): Task[] {
  const projectId = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
  if (!projectId) return [];
  
  const tasksJson = localStorage.getItem(getTasksKey(projectId));
  if (!tasksJson) return [];
  
  const tasks = JSON.parse(tasksJson);
  // Stelle sicher, dass alle Tasks eine Position haben und sortiere sie
  const tasksWithPosition = tasks.map((task: Task, index: number) => ({
    ...task,
    position: task.position ?? index
  }));
  return tasksWithPosition.sort((a: Task, b: Task) => a.position - b.position);
}

export function saveTasks(tasks: Task[]): void {
  const projectId = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
  if (!projectId) return;

  // Stelle sicher, dass alle Tasks eine Position haben
  const tasksWithPosition = tasks.map((task, index) => ({
    ...task,
    position: task.position ?? index
  }));
  localStorage.setItem(getTasksKey(projectId), JSON.stringify(tasksWithPosition));
}

export function addTask(task: Task): Task[] {
  const projectId = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
  if (!projectId) return [];

  const currentTasks = getTasks();
  // Setze die Position auf den nächsten verfügbaren Index
  const newTask = {
    ...task,
    position: currentTasks.length
  };
  const updatedTasks = [...currentTasks, newTask];
  saveTasks(updatedTasks);
  return updatedTasks;
}

export function updateTaskPositions(tasks: Task[]): Task[] {
  // Aktualisiere die Positionen basierend auf der Array-Reihenfolge
  const updatedTasks = tasks.map((task, index) => ({
    ...task,
    position: index
  }));
  saveTasks(updatedTasks);
  return updatedTasks;
}

export function clearTasks(): void {
  const projectId = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_ID);
  if (!projectId) return;
  
  localStorage.removeItem(getTasksKey(projectId));
}

// Neue Funktion zum Löschen aller Tasks eines bestimmten Projekts
export function clearProjectTasks(projectId: string): void {
  localStorage.removeItem(getTasksKey(projectId));
}

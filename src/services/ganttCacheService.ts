import type { Task } from '../types';

interface CachedGanttData {
  projectId: string;
  startDate: string;
  tasks: Task[];
  timestamp: number;
  version: number;
}

const CACHE_KEY = 'gantt_cache';
const CACHE_VERSION = 1;
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

export function getCachedGanttData(projectId: string): CachedGanttData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedGanttData = JSON.parse(cached);
    
    // Validiere Cache-Version und Projekt-ID
    if (data.version !== CACHE_VERSION || data.projectId !== projectId) {
      return null;
    }

    // Prüfe ob der Cache abgelaufen ist
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Fehler beim Lesen des Cache:', error);
    return null;
  }
}

export function cacheGanttData(projectId: string, startDate: string, tasks: Task[]): void {
  try {
    const cacheData: CachedGanttData = {
      projectId,
      startDate,
      tasks,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Fehler beim Speichern des Cache:', error);
  }
}

export function invalidateGanttCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

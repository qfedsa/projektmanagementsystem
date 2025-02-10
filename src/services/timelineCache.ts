import { supabase } from '../lib/supabase';
import type { Task } from '../types';

const CACHE_KEY = 'timeline_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TimelineData {
  tasks: Task[];
  startDate: string | null;
  endDate: string | null;
  timestamp: number;
}

export async function preloadTimelineData(projectId: string): Promise<TimelineData> {
  try {
    // Check cache first
    const cached = localStorage.getItem(`${CACHE_KEY}_${projectId}`);
    if (cached) {
      const cachedData: TimelineData = JSON.parse(cached);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return cachedData;
      }
    }

    // Optimierte Abfrage mit minimalen Spalten
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('start_date, project_end_date')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        task_name,
        duration,
        start_date,
        calculated_end_date,
        position,
        subcontractors!inner (
          name
        )
      `)
      .eq('project_id', projectId)
      .not('start_date', 'is', null)
      .not('calculated_end_date', 'is', null)
      .order('position', { ascending: true });

    if (tasksError) throw tasksError;

    // Process data efficiently using typed arrays for better performance
    const validTasks = tasksData?.filter(task => 
      task.start_date && 
      task.calculated_end_date && 
      task.duration > 0
    ) || [];

    // Use project_end_date from projects table
    const timelineData: TimelineData = {
      tasks: validTasks,
      startDate: projectData.start_date,
      endDate: projectData.project_end_date,
      timestamp: Date.now()
    };

    // Save to cache
    localStorage.setItem(
      `${CACHE_KEY}_${projectId}`, 
      JSON.stringify(timelineData)
    );

    return timelineData;
  } catch (err) {
    console.error('Error loading timeline data:', err);
    return {
      tasks: [],
      startDate: null,
      endDate: null,
      timestamp: Date.now()
    };
  }
}

export function getTimelineFromCache(projectId: string): TimelineData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${projectId}`);
    if (!cached) return null;

    const cachedData: TimelineData = JSON.parse(cached);
    if (Date.now() - cachedData.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY}_${projectId}`);
      return null;
    }

    return cachedData;
  } catch {
    return null;
  }
}

export function invalidateTimelineCache(projectId: string): void {
  localStorage.removeItem(`${CACHE_KEY}_${projectId}`);
}

import { supabase } from '../lib/supabase';
import type { Task, Project } from '../types';

const CACHE_KEY = 'dashboard_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface DashboardData {
  tasks: Task[];
  project: Project | null;
  timestamp: number;
}

export async function preloadDashboardData(projectId: string): Promise<DashboardData> {
  try {
    // Check cache first
    const cached = localStorage.getItem(`${CACHE_KEY}_${projectId}`);
    if (cached) {
      const cachedData: DashboardData = JSON.parse(cached);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return cachedData;
      }
    }

    // Optimized query with minimal columns
    const [projectResponse, tasksResponse] = await Promise.all([
      supabase
        .from('projects')
        .select('id, project_name, start_date, project_end_date, completed, completed_at')
        .eq('id', projectId)
        .maybeSingle(),
      
      supabase
        .from('tasks')
        .select(`
          id,
          task_name,
          duration,
          start_date,
          calculated_end_date,
          started,
          completed,
          subcontractors!inner (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('position')
    ]);

    if (projectResponse.error) throw projectResponse.error;
    if (tasksResponse.error) throw tasksResponse.error;

    const dashboardData: DashboardData = {
      project: projectResponse.data,
      tasks: tasksResponse.data || [],
      timestamp: Date.now()
    };

    // Save to cache
    localStorage.setItem(
      `${CACHE_KEY}_${projectId}`, 
      JSON.stringify(dashboardData)
    );

    return dashboardData;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    return {
      project: null,
      tasks: [],
      timestamp: Date.now()
    };
  }
}

export function getDashboardFromCache(projectId: string): DashboardData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${projectId}`);
    if (!cached) return null;

    const cachedData: DashboardData = JSON.parse(cached);
    if (Date.now() - cachedData.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY}_${projectId}`);
      return null;
    }

    return cachedData;
  } catch {
    return null;
  }
}

export function invalidateDashboardCache(projectId: string): void {
  localStorage.removeItem(`${CACHE_KEY}_${projectId}`);
}

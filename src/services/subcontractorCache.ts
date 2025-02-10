import { supabase } from '../lib/supabase';
import type { Subcontractor } from '../types';

const CACHE_KEY = 'subcontractors_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: Subcontractor[];
  timestamp: number;
  userId: string;
}

// Initialize cache from localStorage
let memoryCache: Map<string, CacheEntry> = new Map();

try {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const entries = JSON.parse(cached);
    Object.entries(entries).forEach(([userId, entry]) => {
      memoryCache.set(userId, entry as CacheEntry);
    });
  }
} catch (err) {
  console.error('Error loading subcontractor cache:', err);
}

export function getSubcontractorsFromCache(userId: string): Subcontractor[] | null {
  const entry = memoryCache.get(userId);
  if (!entry) return null;

  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    memoryCache.delete(userId);
    return null;
  }

  return entry.data;
}

export async function loadSubcontractors(userId: string): Promise<Subcontractor[]> {
  // Check memory cache first
  const cached = getSubcontractorsFromCache(userId);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;

    // Update cache
    const entry: CacheEntry = {
      data: data || [],
      timestamp: Date.now(),
      userId
    };

    memoryCache.set(userId, entry);

    // Persist to localStorage
    localStorage.setItem(CACHE_KEY, JSON.stringify(
      Object.fromEntries(memoryCache.entries())
    ));

    return data || [];
  } catch (err) {
    console.error('Error loading subcontractors:', err);
    throw err;
  }
}

export function invalidateCache(userId: string): void {
  memoryCache.delete(userId);
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const entries = JSON.parse(cached);
      delete entries[userId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    }
  } catch (err) {
    console.error('Error invalidating cache:', err);
  }
}

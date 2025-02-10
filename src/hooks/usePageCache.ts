import { useEffect, useRef } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache duration
const pageCache = new Map<string, CacheEntry>();

export function usePageCache(key: string, loadData: () => Promise<any>, dependencies: any[] = []) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const cachedEntry = pageCache.get(key);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
      return;
    }

    const fetchAndCacheData = async () => {
      try {
        const data = await loadData();
        pageCache.set(key, {
          data,
          timestamp: now
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchAndCacheData();
  }, [key, loadData, ...dependencies]);

  return {
    getCachedData: () => {
      const cachedEntry = pageCache.get(key);
      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
        return cachedEntry.data;
      }
      return null;
    },
    invalidateCache: () => {
      pageCache.delete(key);
    }
  };
}

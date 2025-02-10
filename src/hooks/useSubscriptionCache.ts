import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  projectId: string;
  table: string;
  onUpdate: () => void;
}

const subscriptionCache = new Map<string, RealtimeChannel>();

export function useSubscriptionCache({ projectId, table, onUpdate }: SubscriptionConfig) {
  const subscriptionKey = `${projectId}:${table}`;
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let subscription = subscriptionCache.get(subscriptionKey);

    if (!subscription) {
      subscription = supabase
        .channel(`${table}-changes-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `project_id=eq.${projectId}`
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      subscriptionCache.set(subscriptionKey, subscription);
    }

    return () => {
      if (!subscriptionCache.has(subscriptionKey)) {
        subscription?.unsubscribe();
      }
    };
  }, [projectId, table, onUpdate, subscriptionKey]);

  return {
    invalidateSubscription: () => {
      const subscription = subscriptionCache.get(subscriptionKey);
      if (subscription) {
        subscription.unsubscribe();
        subscriptionCache.delete(subscriptionKey);
      }
    }
  };
}

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  projectId: string;
  tables: string[];
  onUpdate: () => void;
}

export function useRealtimeSubscription({ projectId, tables, onUpdate }: SubscriptionConfig) {
  const subscriptions = useRef<RealtimeChannel[]>([]);
  const isInitialLoad = useRef(true);
  
  const setupSubscriptions = useCallback(() => {
    // Cleanup old subscriptions
    subscriptions.current.forEach(subscription => {
      subscription.unsubscribe();
    });
    subscriptions.current = [];

    // Create new subscriptions
    tables.forEach(table => {
      const channel = supabase
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
            // Ignore first update after subscription
            if (isInitialLoad.current) {
              isInitialLoad.current = false;
              return;
            }
            onUpdate();
          }
        )
        .subscribe();

      subscriptions.current.push(channel);
    });
  }, [projectId, tables, onUpdate]);

  useEffect(() => {
    if (projectId) {
      setupSubscriptions();
    }

    return () => {
      subscriptions.current.forEach(subscription => {
        subscription.unsubscribe();
      });
      subscriptions.current = [];
    };
  }, [projectId, setupSubscriptions]);

  // Auto-reconnect logic
  useEffect(() => {
    const handleOnline = () => {
      console.log('Reconnecting realtime subscriptions...');
      setupSubscriptions();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [setupSubscriptions]);
}

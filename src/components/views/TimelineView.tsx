import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { AlertTriangle, Calendar, Info, RefreshCw } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import type { Task } from '../../types';
    import { format, addDays } from 'date-fns';
    import { de } from 'date-fns/locale';
    import { useAuth } from '../../context/AuthContext';

    interface TimelineViewProps {
      projectId: string;
    }

    interface ProjectInfo {
      start_date: string | null;
      project_end_date: string | null;
    }

    // Cache für Timeline-Daten
    const timelineCache = new Map<string, {
      tasks: Task[];
      project: ProjectInfo;
      timestamp: number;
    }>();

    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    export function TimelineView({ projectId }: TimelineViewProps) {
      const { user } = useAuth();
      const [error, setError] = useState<string | null>(null);
      const [tasks, setTasks] = useState<Task[]>(() => {
        const cached = timelineCache.get(projectId);
        return cached && Date.now() - cached.timestamp < CACHE_TTL ? cached.tasks : [];
      });
      const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
      const timelineRef = useRef<HTMLDivElement>(null);
      const pollingInterval = useRef<NodeJS.Timeout>();

      // Optimierte Funktion zum Laden der Daten
      const loadData = useCallback(async (showRefreshIndicator = false) => {
        if (!projectId || !user) return;

        try {
          setError(null);
          if (showRefreshIndicator) {
            setIsRefreshing(true);
          }

          // Parallele Abfragen für bessere Performance
          const [projectResponse, tasksResponse] = await Promise.all([
            supabase
              .from('projects')
              .select('start_date, project_end_date')
              .eq('id', projectId)
              .eq('user_id', user.id)
              .single(),

            supabase
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
              .eq('user_id', user.id) // Add user_id filter here
              .not('start_date', 'is', null)
              .not('calculated_end_date', 'is', null)
              .order('position')
          ]);

          if (projectResponse.error) throw projectResponse.error;
          if (tasksResponse.error) throw tasksResponse.error;

          // Verarbeite die Daten
          const validTasks = tasksResponse.data?.filter(task =>
            task.start_date &&
            task.calculated_end_date &&
            task.duration > 0
          ) || [];

          // Update state und cache
          const newData = {
            tasks: validTasks,
            project: projectResponse.data,
            timestamp: Date.now()
          };

          timelineCache.set(projectId, newData);
          setTasks(validTasks);
          setProjectInfo(projectResponse.data);
          setLastUpdate(new Date());
        } catch (err) {
          console.error('Error loading timeline data:', err);
          setError('Fehler beim Laden der Timeline-Daten');
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }, [projectId, user]);

      // Initial laden und Polling starten
      useEffect(() => {
        if (!projectId || !user) return;

        // Initial laden wenn Cache abgelaufen
        const cached = timelineCache.get(projectId);
        if (!cached || Date.now() - cached.timestamp >= CACHE_TTL) {
          loadData();
        }

        // Polling alle 2 Minuten
        pollingInterval.current = setInterval(() => {
          loadData();
        }, 2 * 60 * 1000);

        // Cleanup
        return () => {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
        };
      }, [projectId, loadData, user]);

      // Echtzeit-Updates
      useEffect(() => {
        if (!projectId || !user) return;

        const channel = supabase
          .channel(`timeline-${projectId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `project_id=eq.${projectId}`
            },
            () => {
              loadData(true);
            }
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      }, [projectId, loadData, user]);

      // Manuelles Neuladen
      const handleRefresh = () => {
        loadData(true);
      };

      if (!projectId) {
        return (
          <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Keine Projekt-ID verfügbar
          </div>
        );
      }

      if (tasks.length === 0) {
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Aufgaben verfügbar
              </h3>
              <p className="text-gray-600">
                Diesem Projekt wurden noch keine Aufgaben zugewiesen.
              </p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="p-4 bg-red-50 rounded-lg text-red-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        );
      }

      // Berechne Start- und Enddatum für die Timeline
      const timelineStartDate = new Date(tasks[0].start_date!);
      const timelineEndDate = new Date(tasks[tasks.length - 1].calculated_end_date!);
      const totalDays = Math.ceil((timelineEndDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return (
        <div className="space-y-4">
          {/* Header mit Aktualisierungsinfo und Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-500 mb-2 sm:mb-0">
              Letzte Aktualisierung: {format(lastUpdate, 'HH:mm:ss', { locale: de })} Uhr
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:text-gray-400 transition-colors duration-150"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Wird aktualisiert...' : 'Aktualisieren'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div ref={timelineRef} style={{ minWidth: '100%' }}>
                {/* Timeline Header */}
                <div className="sticky top-0 bg-white z-10">
                  <div className="flex">
                    <div className="w-64 flex-shrink-0 p-4">
                      <h3 className="font-medium text-gray-900">Aufgabe</h3>
                    </div>
                    <div className="flex-1">
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(40px, 1fr))` }}>
                        {Array.from({ length: totalDays }).map((_, index) => {
                          const date = addDays(timelineStartDate, index);
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          return (
                            <div
                              key={index}
                              className={`px-2 py-4 text-center ${
                                isWeekend ? 'bg-gray-50' : ''
                              }`}
                              style={{ height: '100%' }}
                            >
                              <div className="text-xs text-gray-500">
                                {format(date, 'EEE', { locale: de })}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {format(date, 'd', { locale: de })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Body */}
                <div>
                  {tasks.map((task) => {
                    const taskStart = new Date(task.start_date!);
                    const taskEnd = new Date(task.calculated_end_date!);
                    const startOffset = Math.floor((taskStart.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const endOffset = Math.floor((taskEnd.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const width = endOffset - startOffset + 1;

                    return (
                      <div key={task.id} className="flex hover:bg-gray-50">
                        <div className="w-64 flex-shrink-0 p-4">
                          <div className="font-medium text-gray-900">{task.task_name}</div>
                          <div className="text-sm text-gray-500">{task.subcontractors?.name}</div>
                        </div>
                        <div className="flex-1 relative">
                          <div 
                            className="grid h-full" 
                            style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(40px, 1fr))` }}
                          >
                            {Array.from({ length: totalDays }).map((_, index) => {
                              const date = addDays(timelineStartDate, index);
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                              return (
                                <div
                                  key={index}
                                  className={`${
                                    isWeekend ? 'bg-gray-50' : ''
                                  }`}
                                  style={{ height: '100%' }}
                                />
                              );
                            })}
                          </div>
                          <div
                            className="absolute top-0 h-12 bg-gray-700 rounded-sm flex items-center justify-center text-white text-xs font-medium shadow-sm transition-all duration-200 hover:bg-gray-800"
                            style={{
                              left: `${(startOffset / totalDays) * 100}%`,
                              width: `${(width / totalDays) * 100}%`,
                              margin: '4px 0'
                            }}
                          >
                            {task.duration} Tage
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

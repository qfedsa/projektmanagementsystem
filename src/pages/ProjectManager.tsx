import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
    import { Calendar, FolderPlus, AlertTriangle, Info, Loader2, RefreshCw } from 'lucide-react'; // Added Loader2 import
    import { useNavigate } from 'react-router-dom';
    import { NoProjectSelected } from '../components/NoProjectSelected';
    import { supabase } from '../lib/supabase';
    import { format } from 'date-fns';
    import { de } from 'date-fns/locale';
    import { useAuth } from '../context/AuthContext';
    import { useSubscriptionCache } from '../hooks/useSubscriptionCache'; // Import

    // Lazy load views with preloading
    const TimelineView = lazy(() => import('../components/views/TimelineView').then(module => ({ default: module.TimelineView })));
    const KanbanView = lazy(() => import('../components/views/KanbanView').then(module => ({ default: module.KanbanView })));
    const MatrixView = lazy(() => import('../components/views/MatrixView').then(module => ({ default: module.MatrixView })));

    interface ProjectInfo {
      project_end_date: string | null;
      completed: boolean;
      start_date: string | null;
      started: boolean;
    }

    const CACHE_KEY_PREFIX = 'project_data_';
    const CACHE_VERSION = 1; // Increment this to invalidate the cache
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    interface CachedData {
      projectInfo: ProjectInfo | null;
      timestamp: number;
      version: number;
    }

    export function ProjectManager() {
      const navigate = useNavigate();
      const { user } = useAuth();
      const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
      const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
      const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
      const [view, setView] = useState<'timeline' | 'kanban' | 'matrix'>('timeline');
      const [error, setError] = useState<string | null>(null);
      const [isLoading, setIsLoading] = useState(true); // Initial loading state
      const [isRefreshing, setIsRefreshing] = useState(false); // For manual refresh

      const cacheKey = `${CACHE_KEY_PREFIX}${projectId}_${CACHE_VERSION}`;

      const { invalidateSubscription } = useSubscriptionCache({
        projectId: projectId || '',
        table: 'projects',
        onUpdate: () => {
          invalidateCache();
          loadProjectData(true); // Force a refresh
        }
      });

      const invalidateCache = useCallback(() => {
        localStorage.removeItem(cacheKey);
      }, [cacheKey]);

      const loadProjectData = useCallback(async (showRefreshIndicator = false) => {
        if (!projectId || !user) {
          setIsLoading(false);
          return;
        }

        try {
          if (showRefreshIndicator) {
            setIsRefreshing(true);
          }
          setError(null);

          // Check cache first
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsedCache: CachedData = JSON.parse(cachedData);
            if (Date.now() - parsedCache.timestamp < CACHE_TTL) {
              setProjectInfo(parsedCache.projectInfo);
              setIsLoading(false);
              return; // Use cached data
            } else {
              localStorage.removeItem(cacheKey); // Invalidate expired cache
            }
          }

          const { data, error: projectError } = await supabase
            .from('projects')
            .select('start_date, project_end_date, completed, started')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

          if (projectError) throw projectError;

          // Update cache
          const newCacheData: CachedData = {
            projectInfo: data,
            timestamp: Date.now(),
            version: CACHE_VERSION
          };
          localStorage.setItem(cacheKey, JSON.stringify(newCacheData));

          setProjectInfo(data);
        } catch (err) {
          console.error('Error loading project:', err);
          setError('Ein unerwarteter Fehler ist aufgetreten');
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }, [projectId, user, cacheKey]);

      useEffect(() => {
        loadProjectData();

        return () => {
          invalidateSubscription();
        };
      }, [loadProjectData, invalidateSubscription]);

      const handleRefresh = () => {
        invalidateCache(); // Invalidate cache on manual refresh
        loadProjectData(true); // Show refresh indicator
      };

      if (!projectId || !projectName) {
        return <NoProjectSelected />;
      }

      const renderContent = () => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Fehler beim Laden der Daten
                </h3>
                <p className="text-gray-600">
                  {error}
                </p>
              </div>
            </div>
          );
        }

        // Zeige Willkommensbildschirm nur wenn das Projekt noch nicht gestartet wurde
        if (!projectInfo?.started) {
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <Info className="w-16 h-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Willkommen im Dashboard
                </h3>
                <div className="max-w-md">
                  <p className="text-gray-600 mb-4">
                    Hier sehen Sie später alle wichtigen Informationen zu Ihrem Projekt. Fügen Sie zunächst Aufgaben hinzu und starten Sie das Projekt in der Aufgabenübersicht.
                  </p>
                  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                    <Info className="w-5 h-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700">
                      Tipp: Beginnen Sie mit dem Hinzufügen von Aufgaben über den Menüpunkt "Aufgaben hinzufügen"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Zeige die gewählte Ansicht für gestartete Projekte
        return (
          <Suspense fallback={null}>
            {view === 'timeline' && <TimelineView projectId={projectId} />}
            {view === 'kanban' && <KanbanView projectId={projectId} />}
            {view === 'matrix' && <MatrixView projectId={projectId} />}
          </Suspense>
        );
      };

      return (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projektübersicht</h1>
                {projectInfo && (
                  <div className="mt-2 space-y-1">
                    {projectInfo.start_date && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          Projektstart: {format(new Date(projectInfo.start_date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                    )}
                    {projectInfo.project_end_date && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          Geplantes Ende: {format(new Date(projectInfo.project_end_date), 'dd.MM.yyyy', { locale: de })}
                          {projectInfo.completed && ' (Abgeschlossen)'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {projectInfo?.started && (
                <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => setView('timeline')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      view === 'timeline'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setView('kanban')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      view === 'kanban'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setView('matrix')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      view === 'matrix'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Matrix
                  </button>
                </div>
              )}
            </div>

            {renderContent()}
          </div>
        </div>
      );
    }

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, X, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface WorkflowStatus {
  id: string;
  task_id: string;
  status: string;
  message: string;
  subject: string;
  contact_person: string;
  email: string;
  created_at: string;
  subcontractor_id: string;
  project_id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  archived: boolean;
}

const EMERGENCY_WEBHOOK_URL = 'https://hook.eu2.make.com/2habcgbqvbncegiupdpqk09ev8ur6oxs';
const RETRY_LOADING_DURATION = 30000; // 30 seconds

export function WorkflowStatusMonitor() {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<WorkflowStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryingStates, setRetryingStates] = useState<Record<string, boolean>>({});
  const [retryTimers, setRetryTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [showArchived, setShowArchived] = useState(false);

  const projectId = localStorage.getItem('currentProjectId');
  const isInProject = location.pathname.startsWith('/project/') && 
                     location.pathname !== '/project-selection' &&
                     projectId;

  const loadWorkflowData = useCallback(async () => {
    if (!isInProject || !projectId || !user) return;

    try {
      setError(null);

      const { data, error: statusError } = await supabase
        .from('workflow_status')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (statusError) throw statusError;
      setMessageStatuses(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Nachrichten:', err);
      setError('Fehler beim Laden der Nachrichten');
    }
  }, [isInProject, projectId, user]);

  useEffect(() => {
    if (isInProject && isOpen && user) {
      loadWorkflowData();

      const channel = supabase
        .channel('workflow-status-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'workflow_status', filter: `project_id=eq.${projectId}` },
          () => loadWorkflowData()
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [isInProject, isOpen, loadWorkflowData, projectId, user]);

  useEffect(() => {
    return () => {
      Object.values(retryTimers).forEach(timer => clearTimeout(timer));
    };
  }, [retryTimers]);

  const handleRetry = async (status: WorkflowStatus) => {
    if (!status || retryingStates[status.id] || !projectId || !user) return;

    try {
      setRetryingStates(prev => ({ ...prev, [status.id]: true }));
      setError(null);
      
      const response = await fetch(EMERGENCY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          task_id: status.task_id,
          task_name: status.task_name,
          email: status.email,
          contact_person: status.contact_person,
          start_date: status.start_date,
          end_date: status.end_date,
          original_status_id: status.id,
          user_id: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim erneuten Senden');
      }

      const timer = setTimeout(async () => {
        await loadWorkflowData();
        setRetryingStates(prev => ({ ...prev, [status.id]: false }));
        setRetryTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[status.id];
          return newTimers;
        });
      }, RETRY_LOADING_DURATION);

      setRetryTimers(prev => ({
        ...prev,
        [status.id]: timer
      }));

    } catch (err) {
      console.error('Fehler beim erneuten Senden:', err);
      setError('Fehler beim erneuten Senden der Nachricht');
      setRetryingStates(prev => ({ ...prev, [status.id]: false }));
    }
  };

  const handleArchiveAll = async () => {
    if (!projectId || !user) return;
    
    try {
      const { error: updateError } = await supabase
        .from('workflow_status')
        .update({ archived: true })
        .eq('project_id', projectId)
        .is('archived', false);

      if (updateError) throw updateError;
      
      await loadWorkflowData();
    } catch (err) {
      console.error('Fehler beim Archivieren:', err);
      setError('Fehler beim Archivieren der Nachrichten');
    }
  };

  const handleArchiveStatus = async (statusId: string) => {
    if (!user) return;
    
    try {
      const { error: updateError } = await supabase
        .from('workflow_status')
        .update({ archived: true })
        .eq('id', statusId);

      if (updateError) throw updateError;
      
      await loadWorkflowData();
    } catch (err) {
      console.error('Fehler beim Archivieren:', err);
      setError('Fehler beim Archivieren der Nachricht');
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  if (!isInProject) {
    return null;
  }

  const filteredStatuses = messageStatuses.filter(status => showArchived ? status.archived : !status.archived);
  const failedStatusCount = messageStatuses.filter(status => !status.archived && status.status === 'fehlgeschlagen').length;

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          loadWorkflowData();
        }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="Workflow-Status anzeigen"
      >
        <Activity className="w-6 h-6" />
        {failedStatusCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {failedStatusCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Workflow-Status
              {failedStatusCount > 0 && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {failedStatusCount} Fehler
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                showArchived
                  ? 'bg-gray-100 text-gray-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {showArchived ? 'Aktive anzeigen' : 'Archivierte anzeigen'}
            </button>
            {!showArchived && (
              <button
                onClick={handleArchiveAll}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
              >
                <Archive className="w-4 h-4 mr-1.5" />
                Alle archivieren
              </button>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <div className="p-4 bg-red-50 rounded-lg text-red-700 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {filteredStatuses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {showArchived ? 'Keine archivierten Nachrichten' : 'Keine aktiven Nachrichten'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStatuses.map((status) => (
                <div
                  key={status.id}
                  className={`p-4 rounded-lg border ${
                    status.status === 'erfolgreich'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {status.status === 'erfolgreich' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          status.status === 'erfolgreich' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {status.task_name || 'Unbekannte Aufgabe'}
                        </p>
                        {!status.archived && (
                          <button
                            onClick={() => handleArchiveStatus(status.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Nachricht archivieren"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className={`mt-1 p-3 rounded-md ${
                        status.status === 'erfolgreich'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <p className="text-sm font-medium">
                          {status.status}
                        </p>
                        <p className="text-sm">
                          {status.message}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p>Kontakt: {status.contact_person || '-'}</p>
                        <p>Email: {status.email || '-'}</p>
                        <p>Erstellt: {formatDateTime(status.created_at)}</p>
                      </div>
                      {status.status === 'fehlgeschlagen' && !status.archived && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleRetry(status)}
                            disabled={retryingStates[status.id]}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                              retryingStates[status.id]
                                ? 'bg-red-400 cursor-wait'
                                : 'bg-red-600 hover:bg-red-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200`}
                          >
                            {retryingStates[status.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                Wird erneut gesendet...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                Erneut senden
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

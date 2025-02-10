import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MessageStatus {
  id: string;
  status: string;
  message: string;
  subject: string;
  contact_person: string;
  email: string;
  created_at: string;
  subcontractor_id: string;
  project_id: string;
  archived: boolean;
}

const RETRY_WEBHOOK_URL = 'https://hook.eu2.make.com/2habcgbqvbncegiupdpqk09ev8ur6oxs';
const RETRY_LOADING_DURATION = 30000; // 30 seconds

export function MessageStatusMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<MessageStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryingStates, setRetryingStates] = useState<Record<string, boolean>>({});
  const [retryTimers, setRetryTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [showArchived, setShowArchived] = useState(false);
  const location = useLocation();

  const projectId = localStorage.getItem('currentProjectId');
  const isInProject = location.pathname.startsWith('/project/') && 
                     location.pathname !== '/project-selection' &&
                     projectId;

  const isSuccessStatus = (status: string) => {
    return status.toLowerCase() === 'erfolgreich';
  };

  const isErrorStatus = (status: string) => {
    return status.toLowerCase() === 'fehlgeschlagen';
  };

  const loadMessageStatuses = useCallback(async () => {
    if (!isInProject || !projectId) return;

    try {
      setError(null);

      const { data, error: statusError } = await supabase
        .from('message_sent')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (statusError) throw statusError;
      setMessageStatuses(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Nachrichten:', err);
      setError('Fehler beim Laden der Nachrichten');
    }
  }, [isInProject, projectId]);

  useEffect(() => {
    if (isInProject && isOpen) {
      loadMessageStatuses();

      const messageStatusSubscription = supabase
        .channel('message-sent-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'message_sent', filter: `project_id=eq.${projectId}` },
          () => loadMessageStatuses()
        )
        .subscribe();

      return () => {
        messageStatusSubscription.unsubscribe();
      };
    }
  }, [isInProject, isOpen, loadMessageStatuses, projectId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(retryTimers).forEach(timer => clearTimeout(timer));
    };
  }, [retryTimers]);

  const handleArchiveAll = async () => {
    if (!projectId) return;
    
    try {
      const { error: updateError } = await supabase
        .from('message_sent')
        .update({ archived: true })
        .eq('project_id', projectId)
        .is('archived', false);

      if (updateError) throw updateError;
      
      await loadMessageStatuses();
    } catch (err) {
      console.error('Fehler beim Archivieren:', err);
      setError('Fehler beim Archivieren der Nachrichten');
    }
  };

  const handleArchiveMessage = async (messageId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('message_sent')
        .update({ archived: true })
        .eq('id', messageId);

      if (updateError) throw updateError;
      
      await loadMessageStatuses();
    } catch (err) {
      console.error('Fehler beim Archivieren:', err);
      setError('Fehler beim Archivieren der Nachricht');
    }
  };

  const handleRetry = async (status: MessageStatus) => {
    if (!status || retryingStates[status.id]) return;

    try {
      setRetryingStates(prev => ({ ...prev, [status.id]: true }));
      setError(null);

      const response = await fetch(RETRY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: status.id,
          subcontractor_id: status.subcontractor_id,
          project_id: status.project_id,
          subject: status.subject,
          message: status.message,
          contact_person: status.contact_person,
          email: status.email
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim erneuten Senden');
      }

      const timer = setTimeout(async () => {
        await loadMessageStatuses();
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  if (!isInProject) {
    return null;
  }

  const filteredMessages = messageStatuses.filter(status => showArchived ? status.archived : !status.archived);
  const failedMessageCount = messageStatuses.filter(status => !status.archived && isErrorStatus(status.status)).length;

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          loadMessageStatuses();
        }}
        className="fixed bottom-4 right-20 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="Nachrichten-Status anzeigen"
      >
        <Send className="w-6 h-6" />
        {failedMessageCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {failedMessageCount}
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
              <Send className="w-5 h-5 mr-2" />
              Nachrichten-Status
              {failedMessageCount > 0 && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {failedMessageCount} Fehler
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

          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {showArchived ? 'Keine archivierten Nachrichten' : 'Keine aktiven Nachrichten'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((status) => (
                <div
                  key={status.id}
                  className={`p-4 rounded-lg border ${
                    isSuccessStatus(status.status)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  } transition-colors duration-300`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {isSuccessStatus(status.status) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          isSuccessStatus(status.status) ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {status.status}
                        </p>
                        {!status.archived && (
                          <button
                            onClick={() => handleArchiveMessage(status.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Nachricht archivieren"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className={`mt-1 p-3 rounded-md ${
                        isSuccessStatus(status.status)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      } transition-colors duration-300`}>
                        <p className="text-sm">
                          {status.message}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p>Empfänger: {status.contact_person}</p>
                        <p>Email: {status.email}</p>
                        <p>Gesendet: {formatDateTime(status.created_at)}</p>
                      </div>
                      {isErrorStatus(status.status) && !status.archived && (
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

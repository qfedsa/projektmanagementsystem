import React, { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Info } from 'lucide-react';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/p3kfp3878w5uf7rft5bf4ej0f5kb8kpa';

export function SendMessage() {
  const { user } = useAuth();
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [isProjectStarted, setIsProjectStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId && user) {
      loadSubcontractors();
      checkProjectStatus();
    }
  }, [projectId, user]);

  const loadSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Subunternehmer:', err);
      setError('Fehler beim Laden der Subunternehmer');
    }
  };

  const checkProjectStatus = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('start_date')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setIsProjectStarted(data && !!data.start_date);
    } catch (err) {
      console.error('Fehler beim Prüfen des Projektstatus:', err);
      setIsProjectStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubcontractorId || !subject.trim() || !message.trim()) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (!isProjectStarted) {
      setError('Das Projekt muss zuerst gestartet werden.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prüfe ob der Subunternehmer zum aktuellen Benutzer gehört
      const subcontractor = subcontractors.find(s => s.id === selectedSubcontractorId);
      if (!subcontractor || subcontractor.user_id !== user?.id) {
        throw new Error('Unzulässiger Subunternehmer ausgewählt');
      }

      const webhookData = {
        subcontractor: {
          id: subcontractor.id,
          name: subcontractor.name,
          email: subcontractor.email,
          contact_person: subcontractor.contact_person
        },
        subject: subject.trim(),
        message: message.trim(),
        project_name: projectName || 'Unbenanntes Projekt',
        project_id: projectId,
        user_id: user?.id // Füge user_id für Make.com hinzu
      };

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Nachricht');
      }

      setSelectedSubcontractorId('');
      setSubject('');
      setMessage('');
      setSuccessMessage('Nachricht wurde erfolgreich gesendet');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Fehler beim Senden der Nachricht:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Senden der Nachricht');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!projectId || !projectName) {
    return <NoProjectSelected />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nachricht senden</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 text-green-800 py-1 px-4 rounded-lg border-l-4 border-green-400">
            {successMessage}
          </div>
        )}

        {!isProjectStarted && !isLoading && (
          <div className="flex items-center bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200 mb-6">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">Das Projekt muss zuerst gestartet werden.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subunternehmer
            </label>
            <select
              value={selectedSubcontractorId}
              onChange={(e) => setSelectedSubcontractorId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Bitte wählen...</option>
              {subcontractors.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.contact_person})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Betreff
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Betreff der Nachricht"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nachricht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ihre Nachricht an den Subunternehmer..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isProjectStarted}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !isProjectStarted
                ? 'bg-gray-400 cursor-not-allowed'
                : isSubmitting
                ? 'bg-blue-400'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-150`}
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
          </button>
        </form>
      </div>
    </div>
  );
}

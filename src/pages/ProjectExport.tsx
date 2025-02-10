import React, { useState } from 'react';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NoProjectSelected } from '../components/NoProjectSelected';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

interface ProjectData {
  project_name: string;
  start_date: string;
  completed: boolean;
  completed_at: string | null;
}

interface TaskData {
  task_name: string;
  duration: number;
  start_date: string;
  calculated_end_date: string;
  completed: boolean;
  started: boolean;
  subcontractor_name: string;
  delay_days: number;
}

interface SubcontractorData {
  name: string;
  contact_person: string;
  email: string;
}

export function ProjectExport() {
  const { user } = useAuth();
  const [projectId] = useState(() => localStorage.getItem('currentProjectId'));
  const [projectName] = useState(() => localStorage.getItem('currentProjectName'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTaskStatus = (task: TaskData): string => {
    if (task.completed) return 'Erledigt';
    if (task.started) return 'In Bearbeitung';
    return 'Ausstehend';
  };

  const generatePDF = async () => {
    if (!projectId || !user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all required data with user_id filter
      const [projectData, tasksData, subcontractorsData] = await Promise.all([
        // Project details
        supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single(),

        // Tasks with subcontractor info and delays
        supabase
          .from('tasks')
          .select(`
            *,
            subcontractors!inner (
              name,
              user_id
            ),
            delays (
              delay_days
            )
          `)
          .eq('project_id', projectId)
          .order('position'),

        // Only user's subcontractors
        supabase
          .from('subcontractors')
          .select('*')
          .eq('user_id', user.id)
          .order('name')
      ]);

      if (projectData.error) throw projectData.error;
      if (tasksData.error) throw tasksData.error;
      if (subcontractorsData.error) throw subcontractorsData.error;

      // Verify project belongs to user
      if (!projectData.data) {
        throw new Error('Projekt nicht gefunden oder keine Berechtigung');
      }

      // Filter tasks to only include those with subcontractors belonging to the user
      const tasks = tasksData.data
        .filter(task => task.subcontractors?.user_id === user.id)
        .map(task => ({
          task_name: task.task_name,
          duration: task.duration,
          start_date: task.start_date,
          calculated_end_date: task.calculated_end_date,
          completed: task.completed,
          started: task.started,
          subcontractor_name: task.subcontractors?.name || '-',
          delay_days: task.delays?.reduce((sum, delay) => sum + delay.delay_days, 0) || 0
        }));

      // Create PDF
      const pdf = new jsPDF();
      const project = projectData.data;
      const currentDate = format(new Date(), 'dd.MM.yyyy', { locale: de });

      // Title
      pdf.setFontSize(20);
      pdf.text('Projektbericht', 20, 20);

      // Project Info
      pdf.setFontSize(12);
      pdf.text([
        `Projektname: ${project.project_name}`,
        `Startdatum: ${format(new Date(project.start_date), 'dd.MM.yyyy', { locale: de })}`,
        `Status: ${project.completed ? 'Abgeschlossen' : 'In Bearbeitung'}`,
        project.completed_at ? `Abgeschlossen am: ${format(new Date(project.completed_at), 'dd.MM.yyyy', { locale: de })}` : '',
        `Erstellt am: ${currentDate}`
      ].filter(Boolean), 20, 40);

      // Project Statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const inProgressTasks = tasks.filter(t => !t.completed && t.started).length;
      const pendingTasks = tasks.filter(t => !t.completed && !t.started).length;
      const delayedTasks = tasks.filter(t => t.delay_days > 0).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      pdf.setFontSize(14);
      pdf.text('Projektstatistik', 20, 80);
      pdf.setFontSize(12);
      pdf.text([
        `Gesamtanzahl Aufgaben: ${totalTasks}`,
        `Ausstehende Aufgaben: ${pendingTasks}`,
        `Aufgaben in Bearbeitung: ${inProgressTasks}`,
        `Abgeschlossene Aufgaben: ${completedTasks}`,
        `Verzögerte Aufgaben: ${delayedTasks}`,
        `Fortschritt: ${completionRate}%`
      ], 20, 90);

      // Tasks Table
      pdf.setFontSize(14);
      pdf.text('Aufgabenübersicht', 20, 130);
      
      // @ts-ignore (jspdf-autotable types)
      pdf.autoTable({
        startY: 140,
        head: [['Aufgabe', 'Dauer', 'Start', 'Ende', 'Status', 'Gewerk', 'Verzögerung']],
        body: tasks.map(task => [
          task.task_name,
          `${task.duration} Tage`,
          format(new Date(task.start_date), 'dd.MM.yyyy', { locale: de }),
          format(new Date(task.calculated_end_date), 'dd.MM.yyyy', { locale: de }),
          getTaskStatus(task),
          task.subcontractor_name,
          task.delay_days > 0 ? `${task.delay_days} Tage` : '-'
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      // Subcontractors Table
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Gewerkübersicht', 20, 20);

      // @ts-ignore (jspdf-autotable types)
      pdf.autoTable({
        startY: 30,
        head: [['Gewerk', 'Ansprechpartner', 'E-Mail']],
        body: subcontractorsData.data.map(sub => [
          sub.name,
          sub.contact_person,
          sub.email
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      // Save the PDF
      const fileName = `Projektbericht_${project.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${currentDate.replace(/\./g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Fehler beim Erstellen des PDFs:', err);
      setError('Fehler beim Erstellen des PDFs');
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId || !projectName) {
    return <NoProjectSelected />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Projekt exportieren</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">PDF Export</h3>
              <p className="mt-1 text-sm text-gray-500">
                Exportieren Sie alle Projektdaten in eine PDF-Datei. Der Export enthält:
              </p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Projektübersicht und Statistiken</li>
                <li>Detaillierte Aufgabenliste mit Status</li>
                <li>Gewerkübersicht mit Kontaktdaten</li>
              </ul>
            </div>
            <button
              onClick={generatePDF}
              disabled={isLoading}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5 mr-2" />
                  PDF herunterladen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* ... (rest of your imports) ... */}
    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { FolderPlus, Folder, CheckSquare, Archive, Trash2, Loader2, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
    import { v4 as uuidv4 } from 'uuid';
    import type { Project } from '../types';
    import { supabase } from '../lib/supabase';
    import { HelpGuide } from '../components/HelpGuide';
    import { useAuth } from '../context/AuthContext';

    export function ProjectSelection() {
      const navigate = useNavigate();
      const { signOut, user } = useAuth();
      const [projects, setProjects] = useState<Project[]>([]);
      const [newProjectName, setNewProjectName] = useState('');
      const [isCreating, setIsCreating] = useState(false);
      const [isDeleting, setIsDeleting] = useState<string | null>(null);
      const [isCompleting, setIsCompleting] = useState<string | null>(null); // Not used in this component
      const [error, setError] = useState<string | null>(null);
      const [successMessage, setSuccessMessage] = useState<string | null>(null);
      const [showCompleted, setShowCompleted] = useState(false);

      useEffect(() => {
        if (user) {
          loadProjects();
        } else {
          setProjects([]);
        }
      }, [user]);

      function loadProjects() {
        try {
          const storageKey = `projects_${user?.id}`;
          const localProjectsStr = localStorage.getItem(storageKey);
          const localProjects = localProjectsStr ? JSON.parse(localProjectsStr) : [];
          setProjects(localProjects);
        } catch (err) {
          console.error('Fehler beim Laden der Projekte:', err);
          setError('Fehler beim Laden der Projekte');
        }
      }

      const handleLogout = async () => {
        try {
          localStorage.removeItem('currentProjectId');
          localStorage.removeItem('currentProjectName');
          setProjects([]);
          await signOut();
        } catch (err) {
          console.error('Fehler beim Abmelden:', err);
          setError('Fehler beim Abmelden');
        }
      };

      const selectProject = (project: Project) => {
        try {
          localStorage.setItem('currentProjectId', project.id);
          localStorage.setItem('currentProjectName', project.project_name);
          navigate('/project/overview');
        } catch (err) {
          console.error('Fehler beim Auswählen des Projekts:', err);
          setError('Fehler beim Auswählen des Projekts');
        }
      };

      const createNewProject = () => {
        if (!newProjectName.trim()) {
          setError('Bitte geben Sie einen Projektnamen ein');
          return;
        }

        setIsCreating(true);
        setError(null);

        try {
          const newProject: Project = {
            id: uuidv4(),
            project_name: newProjectName.trim(),
            created_at: new Date().toISOString(),
            completed: false,
            completed_at: null,
            started: false,
            user_id: user?.id
          };

          const storageKey = `projects_${user?.id}`;
          const localProjectsStr = localStorage.getItem(storageKey);
          const localProjects = localProjectsStr ? JSON.parse(localProjectsStr) : [];
          const updatedProjects = [...localProjects, newProject];
          
          localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
          setProjects(updatedProjects);
          setNewProjectName('');
          setSuccessMessage('Projekt wurde erfolgreich erstellt');
          setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
          console.error('Fehler beim Erstellen des Projekts:', err);
          setError('Fehler beim Erstellen des Projekts');
        } finally {
          setIsCreating(false);
        }
      };

      const deleteProject = async (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!user) return;

        const confirmMessage = `Möchten Sie dieses Projekt wirklich löschen? Alle zugehörigen Daten werden unwiderruflich gelöscht:

    - Aufgaben und Abhängigkeiten
    - Verzögerungen und Nachrichten
    - Workflow-Status und Fehlermeldungen`;

        if (!window.confirm(confirmMessage)) {
          return;
        }

        setIsDeleting(project.id);
        setError(null);

        try {
          // Lösche alle Projektdaten in Supabase
          const { error: deleteError } = await supabase.rpc('delete_project_cascade', {
            project_id_param: project.id
            // user_id_param: user.id  <-- REMOVE THIS LINE.  The function only takes project_id now.
          });

          if (deleteError) {
            console.error('Supabase Fehler:', deleteError);
            throw new Error(`Fehler beim Löschen der Projektdaten: ${deleteError.message}`);
          }

          // Verifiziere dass das Projekt gelöscht wurde
          const { data: projectCheck } = await supabase
            .from('projects')
            .select('id')
            .eq('id', project.id)
            .eq('user_id', user.id)
            .single();

          if (projectCheck) {
            throw new Error('Projekt wurde nicht vollständig gelöscht');
          }

          // Update lokalen State
          const storageKey = `projects_${user.id}`;
          const updatedProjects = projects.filter(p => p.id !== project.id);
          localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
          
          // Entferne aktuelle Projekt-Auswahl wenn das gelöschte Projekt aktiv war
          if (localStorage.getItem('currentProjectId') === project.id) {
            localStorage.removeItem('currentProjectId');
            localStorage.removeItem('currentProjectName');
            localStorage.removeItem('startDate');
          }
          
          setProjects(updatedProjects);
          setSuccessMessage('Projekt und alle zugehörigen Daten wurden erfolgreich gelöscht');
          setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
          console.error('Fehler beim Löschen des Projekts:', err);
          setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Projekts');
        } finally {
          setIsDeleting(null);
        }
      };

      const filteredProjects = projects.filter(project => 
        showCompleted ? project.completed : !project.completed
      );

      return (
        <div className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Bauprojekt Manager</h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-150"
                  >
                    {showCompleted ? (
                      <>
                        <Archive className="w-5 h-5 mr-2" />
                        Aktive Projekte
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5 mr-2" />
                        Abgeschlossene Projekte
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-150"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Abmelden
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-6 bg-green-50 text-green-800 py-1 px-4 rounded-lg border-l-4 border-green-400">
                  {successMessage}
                </div>
              )}

              <div className="mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Neues Projekt"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={createNewProject}
                    disabled={isCreating}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-150"
                  >
                    <FolderPlus className="w-5 h-5 mr-2" />
                    {isCreating ? 'Wird erstellt...' : 'Projekt erstellen'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {showCompleted ? 'Keine abgeschlossenen Projekte' : 'Keine aktiven Projekte'}
                    </h3>
                    <p className="text-gray-500">
                      {showCompleted 
                        ? 'Es wurden noch keine Projekte abgeschlossen.' 
                        : 'Erstellen Sie ein neues Projekt, um loszulegen.'}
                    </p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => selectProject(project)}
                      className="relative group bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Folder className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {project.project_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!project.completed && (
                            <button
                              onClick={(e) => completeProject(project, e)}
                              disabled={isCompleting === project.id}
                              className="p-1 text-gray-400 hover:text-green-600 disabled:hover:text-gray-400 transition-colors duration-150"
                              title="Projekt abschließen"
                            >
                              {isCompleting === project.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteProject(project, e)}
                            disabled={isDeleting === project.id}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:hover:text-gray-400 transition-colors duration-150"
                            title="Projekt löschen"
                          >
                            {isDeleting === project.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Erstellt am: {new Date(project.created_at).toLocaleDateString()}
                        {project.started && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Gestartet
                          </span>
                        )}
                        {project.completed && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Abgeschlossen
                          </span>
                        )}
                        {project.completed_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            Abgeschlossen am: {new Date(project.completed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <HelpGuide />
        </div>
      );
    }

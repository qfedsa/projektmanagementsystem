import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';

export function NoProjectSelected() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <FolderPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Kein Projekt ausgewählt
        </h2>
        <p className="text-gray-600 mb-6">
          Bitte wählen Sie zuerst ein Projekt aus oder erstellen Sie ein neues Projekt.
        </p>
        <button
          onClick={() => navigate('/project-selection')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
        >
          Zur Projektauswahl
        </button>
      </div>
    </div>
  );
}

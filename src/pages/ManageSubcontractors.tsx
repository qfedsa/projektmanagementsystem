import React, { useState, useEffect } from 'react';
import { Plus, Save, AlertTriangle } from 'lucide-react';
import type { Subcontractor } from '../types';
import { SubcontractorForm } from '../components/SubcontractorForm';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getSubcontractorsFromCache, loadSubcontractors, invalidateCache } from '../services/subcontractorCache';

export function ManageSubcontractors() {
  const { user } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(() => {
    // Initialize from cache if available
    return user ? getSubcontractorsFromCache(user.id) || [] : [];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubcontractors([]);
      return;
    }

    // Load data in background if needed
    const loadData = async () => {
      try {
        const data = await loadSubcontractors(user.id);
        setSubcontractors(data);
      } catch (err) {
        console.error('Error loading subcontractors:', err);
        setError('Fehler beim Laden der Subunternehmer');
      }
    };

    if (!getSubcontractorsFromCache(user.id)) {
      loadData();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel('subcontractors-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'subcontractors',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          invalidateCache(user.id);
          const data = await loadSubcontractors(user.id);
          setSubcontractors(data);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const addSubcontractor = () => {
    const newSubcontractor: Subcontractor = {
      id: '',
      name: '',
      email: '',
      contact_person: '',
      user_id: user?.id || null
    };
    setSubcontractors(prev => [...prev, newSubcontractor]);
    setError(null);
  };

  const updateSubcontractor = (index: number, field: keyof Subcontractor, value: string) => {
    setSubcontractors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value.trim() };
      return updated;
    });
    setError(null);
  };

  const removeSubcontractor = async (index: number) => {
    const sub = subcontractors[index];
    if (sub.id && !window.confirm('Möchten Sie diesen Subunternehmer wirklich löschen?')) {
      return;
    }

    try {
      if (sub.id && user) {
        const { error: deleteError } = await supabase
          .from('subcontractors')
          .delete()
          .eq('id', sub.id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      setSubcontractors(prev => prev.filter((_, i) => i !== index));
      setSuccessMessage('Subunternehmer wurde erfolgreich gelöscht');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error deleting subcontractor:', err);
      setError('Fehler beim Löschen des Subunternehmers');
    }
  };

  const saveChanges = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      for (const sub of subcontractors) {
        const subData = {
          name: sub.name.trim(),
          email: sub.email.trim(),
          contact_person: sub.contact_person.trim(),
          user_id: user.id
        };

        if (sub.id) {
          const { error: updateError } = await supabase
            .from('subcontractors')
            .update(subData)
            .eq('id', sub.id)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('subcontractors')
            .insert([subData]);

          if (insertError) throw insertError;
        }
      }

      invalidateCache(user.id);
      const updatedData = await loadSubcontractors(user.id);
      setSubcontractors(updatedData);
      
      setSuccessMessage('Änderungen wurden erfolgreich gespeichert');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Subunternehmer verwalten</h1>
          {successMessage && (
            <div className="bg-green-50 text-green-800 py-1 px-4 rounded-lg border-l-4 border-green-400">
              {successMessage}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end mb-6">
          <button
            onClick={addSubcontractor}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
          >
            <Plus className="w-5 h-5 mr-2" />
            Neuer Subunternehmer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gewerkschaft
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansprechpartner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-Mail
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subcontractors.map((sub, index) => (
                <SubcontractorForm
                  key={sub.id || index}
                  subcontractor={sub}
                  onUpdate={(field, value) => updateSubcontractor(index, field, value)}
                  onDelete={() => removeSubcontractor(index)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {subcontractors.length > 0 && (
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="mt-6 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors duration-150"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>
        )}
      </div>
    </div>
  );
}

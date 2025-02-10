import { supabase } from '../lib/supabase';
import type { Subcontractor } from '../types';

export async function loadSubcontractors() {
  console.log('Loading subcontractors...');
  try {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error loading subcontractors:', error);
      throw error;
    }

    console.log('Loaded subcontractors:', data);
    return data || [];
  } catch (error) {
    console.error('Error in loadSubcontractors:', error);
    throw error;
  }
}

export async function saveSubcontractor(subcontractor: Subcontractor) {
  console.log('Saving subcontractor:', subcontractor);
  
  // Validiere die Eingaben
  if (!subcontractor.name?.trim()) {
    throw new Error('Gewerkschaft ist erforderlich');
  }
  if (!subcontractor.contact_person?.trim()) {
    throw new Error('Ansprechpartner ist erforderlich');
  }
  if (!subcontractor.email?.trim()) {
    throw new Error('E-Mail ist erforderlich');
  }

  const subcontractorData = {
    name: subcontractor.name.trim(),
    email: subcontractor.email.trim(),
    contact_person: subcontractor.contact_person.trim()
  };

  try {
    let result;
    if (subcontractor.id) {
      // Update existierenden Subunternehmer
      result = await supabase
        .from('subcontractors')
        .update(subcontractorData)
        .eq('id', subcontractor.id)
        .select()
        .single();
    } else {
      // Erstelle neuen Subunternehmer
      result = await supabase
        .from('subcontractors')
        .insert([subcontractorData])
        .select()
        .single();
    }

    if (result.error) throw result.error;
    console.log('Saved subcontractor:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error saving subcontractor:', error);
    throw error;
  }
}

export async function deleteSubcontractor(id: string) {
  console.log('Deleting subcontractor:', id);
  try {
    const { error } = await supabase
      .from('subcontractors')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting subcontractor:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteSubcontractor:', error);
    throw error;
  }
}

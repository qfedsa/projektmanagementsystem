/*
  # Disable RLS for subcontractors table

  1. Changes
    - Disable Row Level Security for subcontractors table
*/

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

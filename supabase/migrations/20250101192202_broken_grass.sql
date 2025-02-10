/*
  # Disable RLS for subcontractors table

  1. Changes
    - Disable Row Level Security for the subcontractors table
*/

ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

/*
  # Fix RLS for subcontractors table
  
  1. Changes
    - Disable RLS for subcontractors table to allow unrestricted access
    - Similar to how we handled the tasks table
*/

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

/*
  # Temporarily disable RLS for testing
  
  1. Changes
    - Disable RLS on tasks table to allow operations without authentication
*/

ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

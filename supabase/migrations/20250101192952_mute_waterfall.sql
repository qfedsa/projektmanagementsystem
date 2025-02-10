/*
  # Update subcontractors table schema

  1. Changes
    - Drop existing subcontractors table
    - Create new subcontractors table with correct column names
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS subcontractors CASCADE;

-- Create subcontractors table with correct column names
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  contact_person text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

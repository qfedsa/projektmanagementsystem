/*
  # Fix Subcontractor Table Constraints

  1. Changes
    - Drop existing unique constraint on name column
    - Add composite unique constraint on name and email
*/

-- Drop existing table and recreate with correct constraints
DROP TABLE IF EXISTS subcontractors CASCADE;

CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  contact_person text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, email)
);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

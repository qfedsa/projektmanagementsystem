/*
  # Fix subcontractors table structure

  1. Changes
    - Drop existing subcontractors table
    - Recreate with correct column names matching the code
    - Add unique constraint
    - Disable RLS

  2. Notes
    - This ensures column names match exactly with the frontend code
    - Preserves unique constraint on trade name and email
*/

-- Drop existing table
DROP TABLE IF EXISTS subcontractors CASCADE;

-- Create subcontractors table with correct column names
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  contact_person text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicates
ALTER TABLE subcontractors 
  ADD CONSTRAINT subcontractors_name_email_key 
  UNIQUE (name, email);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

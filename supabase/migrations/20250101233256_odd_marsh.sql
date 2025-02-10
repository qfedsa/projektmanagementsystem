/*
  # Fix subcontractors table structure

  1. Changes
    - Drop and recreate subcontractors table with correct column names
    - Add unique constraint on trade_name and contact_email
    - Disable RLS for subcontractors table

  2. Security
    - RLS disabled as per requirements
*/

-- Drop existing table
DROP TABLE IF EXISTS subcontractors CASCADE;

-- Create subcontractors table with correct structure
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

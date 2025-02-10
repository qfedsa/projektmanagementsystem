/*
  # Fix subcontractors table structure

  1. Changes
    - Drop and recreate subcontractors table with correct structure
    - Add trade_name field back for compatibility
    - Ensure all required fields are present
*/

-- Drop existing table
DROP TABLE IF EXISTS subcontractors CASCADE;

-- Create subcontractors table with correct structure
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name text NOT NULL,
  contact_email text NOT NULL,
  contact_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

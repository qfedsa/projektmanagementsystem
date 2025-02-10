/*
  # Fix subcontractors table structure

  1. Changes
    - Drop and recreate subcontractors table with correct column names
    - Add proper constraints and defaults
    - Ensure consistent naming across the application

  2. Security
    - Keep RLS disabled as per previous configuration
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

-- Add unique constraint to prevent duplicates
ALTER TABLE subcontractors 
  ADD CONSTRAINT subcontractors_trade_name_contact_email_key 
  UNIQUE (trade_name, contact_email);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

/*
  # Create projects table

  1. New Tables
    - `projects` table for storing project information
      - `id` (uuid, primary key)
      - `start_date` (date)
      - `created_at` (timestamp)

  2. Changes
    - Creates a new projects table
    - Adds necessary columns
*/

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

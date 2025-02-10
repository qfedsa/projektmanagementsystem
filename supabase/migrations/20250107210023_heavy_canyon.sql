/*
  # Fix delays table and webhook setup

  1. Changes
    - Drop and recreate delays table with proper structure
    - Add indexes for better performance
    - Add check constraint for positive delay_days
  
  2. Security
    - Disable RLS for delays table
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS delays CASCADE;

-- Create delays table with proper structure
CREATE TABLE delays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delay_reason text NOT NULL,
    delay_days integer NOT NULL CHECK (delay_days > 0),
    created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delays_task_id ON delays(task_id);
CREATE INDEX IF NOT EXISTS idx_delays_project_id ON delays(project_id);

-- Disable RLS for delays table
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;

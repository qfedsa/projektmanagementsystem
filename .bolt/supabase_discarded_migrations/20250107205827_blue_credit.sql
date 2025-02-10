/*
  # Create delays table

  1. New Tables
    - `delays`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `project_id` (uuid, foreign key to projects)
      - `delay_reason` (text)
      - `delay_days` (integer)
      - `created_at` (timestamp)
  2. Security
    - Disable RLS for delays table
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS delays CASCADE;

-- Create delays table
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

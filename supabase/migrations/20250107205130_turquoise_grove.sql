/*
  # Recreate delays table

  1. New Tables
    - `delays`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `project_id` (uuid, foreign key to projects)
      - `delay_reason` (text)
      - `delay_days` (integer)
      - `created_at` (timestamp)
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS delays CASCADE;

-- Create delays table
CREATE TABLE delays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    delay_reason text NOT NULL,
    delay_days integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Disable RLS for delays table
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;

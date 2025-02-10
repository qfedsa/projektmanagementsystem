/*
  # Recreate Tasks Table with RLS

  1. Changes
    - Drop existing tasks table
    - Recreate tasks table with correct structure
    - Enable RLS
    - Add all necessary policies
*/

-- Drop existing table and dependencies
DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  duration integer NOT NULL,
  responsible_party text,
  start_date date,
  created_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false,
  project_started boolean DEFAULT false,
  subcontractor_notified boolean DEFAULT false,
  project_id text
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to insert tasks"
ON tasks FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read tasks"
ON tasks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update tasks"
ON tasks FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete tasks"
ON tasks FOR DELETE TO authenticated
USING (true);

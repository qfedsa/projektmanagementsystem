/*
  # Add RLS policies for tasks table

  1. Security Changes
    - Enable RLS on tasks table
    - Add policies for:
      - Insert: Allow authenticated users to insert tasks
      - Select: Allow authenticated users to read all tasks
      - Update: Allow authenticated users to update tasks
      - Delete: Allow authenticated users to delete tasks
*/

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

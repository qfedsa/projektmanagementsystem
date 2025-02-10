-- Add user_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id 
ON tasks(user_id);

-- Add comment explaining the column
COMMENT ON COLUMN tasks.user_id IS 'The user who created this task';

-- Add user_id to tasks RLS policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

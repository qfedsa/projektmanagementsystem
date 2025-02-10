/*
  # Add RLS Policies for Project Access Control
  
  1. Changes
    - Enable RLS on tables that need it
    - Add policies for project access control
    - Add policies for task management
    - Add policies for workflow status and messages
  
  2. Security
    - Ensures users can only access their own projects
    - Project owners have full control
    - Members have appropriate access levels
*/

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON tasks;
DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can view delays of their projects" ON delays;
DROP POLICY IF EXISTS "Users can manage delays in their projects" ON delays;
DROP POLICY IF EXISTS "Users can view workflow status of their projects" ON workflow_status;
DROP POLICY IF EXISTS "Users can view messages of their projects" ON message_sent;

-- Projects Policies
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Tasks Policies
CREATE POLICY "Users can view tasks of their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tasks in their projects"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

-- Delays Policies
CREATE POLICY "Users can view delays of their projects"
  ON delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage delays in their projects"
  ON delays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

-- Workflow Status Policies
CREATE POLICY "Users can view workflow status of their projects"
  ON workflow_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = workflow_status.project_id
      AND user_id = auth.uid()
    )
  );

-- Message Sent Policies
CREATE POLICY "Users can view messages of their projects"
  ON message_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = message_sent.project_id
      AND user_id = auth.uid()
    )
  );

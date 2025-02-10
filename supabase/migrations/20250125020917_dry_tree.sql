-- Disable RLS temporarily to avoid recursion during changes
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
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

-- Create new simplified policies without recursion
CREATE POLICY "Allow users to view own memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow project owners to manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Allow users to view accessible projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow project members to update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project owners to delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

CREATE POLICY "Allow project members to view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project members to manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project members to view delays"
  ON delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = delays.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project members to manage delays"
  ON delays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = delays.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project members to view workflow status"
  ON workflow_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = workflow_status.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow project members to view messages"
  ON message_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = message_sent.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;

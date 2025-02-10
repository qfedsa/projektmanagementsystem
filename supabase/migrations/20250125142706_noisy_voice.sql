-- Disable RLS temporarily
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE projekt_fehler DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow users to view own memberships" ON project_members;
DROP POLICY IF EXISTS "Allow project owners to manage members" ON project_members;
DROP POLICY IF EXISTS "Allow users to view accessible projects" ON projects;
DROP POLICY IF EXISTS "Allow users to create projects" ON projects;
DROP POLICY IF EXISTS "Allow project members to update projects" ON projects;
DROP POLICY IF EXISTS "Allow project owners to delete projects" ON projects;
DROP POLICY IF EXISTS "Allow project members to view tasks" ON tasks;
DROP POLICY IF EXISTS "Allow project members to manage tasks" ON tasks;
DROP POLICY IF EXISTS "Allow project members to view delays" ON delays;
DROP POLICY IF EXISTS "Allow project members to manage delays" ON delays;
DROP POLICY IF EXISTS "Allow project members to view workflow status" ON workflow_status;
DROP POLICY IF EXISTS "Allow project members to view messages" ON message_sent;

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projekt_fehler ENABLE ROW LEVEL SECURITY;

-- Project Members policies (simplified to avoid recursion)
CREATE POLICY "View own memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Insert own memberships"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Projects policies
CREATE POLICY "View projects as member"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update projects as member"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Delete projects as owner"
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

-- Tasks policies
CREATE POLICY "View tasks as project member"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Manage tasks as project member"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

-- Delays policies
CREATE POLICY "View delays as project member"
  ON delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Manage delays as project member"
  ON delays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

-- Workflow Status policies
CREATE POLICY "View workflow status as project member"
  ON workflow_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = workflow_status.project_id
      AND user_id = auth.uid()
    )
  );

-- Message Sent policies
CREATE POLICY "View messages as project member"
  ON message_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = message_sent.project_id
      AND user_id = auth.uid()
    )
  );

-- Dependencies policies
CREATE POLICY "View dependencies as project member"
  ON dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tasks t ON t.project_id = pm.project_id
      WHERE t.id = dependencies.task_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Manage dependencies as project member"
  ON dependencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tasks t ON t.project_id = pm.project_id
      WHERE t.id = dependencies.task_id
      AND pm.user_id = auth.uid()
    )
  );

-- Projekt Fehler policies
CREATE POLICY "View projekt fehler as project member"
  ON projekt_fehler FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projekt_fehler.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Manage projekt fehler as project member"
  ON projekt_fehler FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projekt_fehler.project_id
      AND user_id = auth.uid()
    )
  );

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
DO $$ 
DECLARE
  _table text;
BEGIN
  FOR _table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "View own memberships" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Insert own memberships" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View projects as member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Create projects" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Update projects as member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Delete projects as owner" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View tasks as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Manage tasks as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View delays as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Manage delays as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View workflow status as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View messages as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View dependencies as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Manage dependencies as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "View projekt fehler as project member" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "Manage projekt fehler as project member" ON %I', _table);
  END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projekt_fehler ENABLE ROW LEVEL SECURITY;

-- Basic project_members policies without recursion
CREATE POLICY "project_members_select"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "project_members_insert"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Projects policies
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "projects_delete"
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
CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_all"
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
CREATE POLICY "delays_select"
  ON delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "delays_all"
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
CREATE POLICY "workflow_status_select"
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
CREATE POLICY "message_sent_select"
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
CREATE POLICY "dependencies_select"
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

CREATE POLICY "dependencies_all"
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
CREATE POLICY "projekt_fehler_select"
  ON projekt_fehler FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projekt_fehler.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "projekt_fehler_all"
  ON projekt_fehler FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projekt_fehler.project_id
      AND user_id = auth.uid()
    )
  );

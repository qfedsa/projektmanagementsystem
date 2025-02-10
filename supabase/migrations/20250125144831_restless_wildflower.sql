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
    EXECUTE format('DROP POLICY IF EXISTS "project_members_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "project_members_insert" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projects_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projects_insert" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projects_update" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projects_delete" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "tasks_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "tasks_all" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "delays_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "delays_all" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "workflow_status_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "message_sent_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "dependencies_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "dependencies_all" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projekt_fehler_select" ON %I', _table);
    EXECUTE format('DROP POLICY IF EXISTS "projekt_fehler_all" ON %I', _table);
  END LOOP;
END $$;

-- Create simplified policies
CREATE POLICY "members_read"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "members_insert"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects_read"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "tasks_read"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_write"
  ON tasks FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "delays_read"
  ON delays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "delays_write"
  ON delays FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "workflow_read"
  ON workflow_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "messages_read"
  ON message_sent FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dependencies_read"
  ON dependencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dependencies_write"
  ON dependencies FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "errors_read"
  ON projekt_fehler FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "errors_write"
  ON projekt_fehler FOR ALL
  TO authenticated
  USING (true);

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projekt_fehler ENABLE ROW LEVEL SECURITY;

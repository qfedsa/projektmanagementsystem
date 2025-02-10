-- Disable RLS on all tables
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

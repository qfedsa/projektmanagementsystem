-- Disable RLS on all tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE projekt_fehler DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

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
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
      (SELECT string_agg(policyname, ',') 
       FROM pg_policies 
       WHERE tablename = _table), 
      _table);
  END LOOP;
END $$;

-- Make start_date column nullable and add default values
ALTER TABLE projects 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN completed SET DEFAULT false,
  ALTER COLUMN project_name SET NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN projects.start_date IS 'Project start date. Can be null until the project is started.';

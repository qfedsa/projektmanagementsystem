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

-- Disable RLS on all tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE delays DISABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

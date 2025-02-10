-- Enable RLS for projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing projects
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

-- Create policy for creating projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for updating projects
CREATE POLICY "Project members can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

-- Create policy for deleting projects
CREATE POLICY "Project owners can delete projects"
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

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view their projects" ON projects IS 'Users can only view projects where they are members';
COMMENT ON POLICY "Users can create projects" ON projects IS 'Any authenticated user can create new projects';
COMMENT ON POLICY "Project members can update projects" ON projects IS 'Only project members can update project details';
COMMENT ON POLICY "Project owners can delete projects" ON projects IS 'Only project owners can delete projects';

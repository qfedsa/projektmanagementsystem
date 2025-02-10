-- Drop existing policies for project_members
DROP POLICY IF EXISTS "Users can view their project memberships" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view project memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert project memberships"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = project_members.project_id 
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can update project memberships"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = project_members.project_id 
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can delete project memberships"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM project_members 
      WHERE project_id = project_members.project_id 
      AND role = 'owner'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Enable RLS for subcontractors table
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing subcontractors
CREATE POLICY "Users can view subcontractors"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tasks t ON t.project_id = pm.project_id
      WHERE t.responsible_party = subcontractors.id
      AND pm.user_id = auth.uid()
    )
  );

-- Create policy for creating subcontractors
CREATE POLICY "Users can create subcontractors"
  ON subcontractors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for updating subcontractors
CREATE POLICY "Users can update subcontractors"
  ON subcontractors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tasks t ON t.project_id = pm.project_id
      WHERE t.responsible_party = subcontractors.id
      AND pm.user_id = auth.uid()
    )
  );

-- Create policy for deleting subcontractors
CREATE POLICY "Users can delete subcontractors"
  ON subcontractors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tasks t ON t.project_id = pm.project_id
      WHERE t.responsible_party = subcontractors.id
      AND pm.user_id = auth.uid()
    )
  );

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view subcontractors" ON subcontractors IS 'Users can only view subcontractors used in their projects';
COMMENT ON POLICY "Users can create subcontractors" ON subcontractors IS 'Any authenticated user can create subcontractors';
COMMENT ON POLICY "Users can update subcontractors" ON subcontractors IS 'Users can only update subcontractors used in their projects';
COMMENT ON POLICY "Users can delete subcontractors" ON subcontractors IS 'Users can only delete subcontractors used in their projects';

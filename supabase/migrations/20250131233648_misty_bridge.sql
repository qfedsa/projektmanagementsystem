-- Drop existing policies
DROP POLICY IF EXISTS "Users can view subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can create subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can update subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can delete subcontractors" ON subcontractors;

-- Create simplified policies that don't depend on tasks
CREATE POLICY "Users can view subcontractors"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create subcontractors"
  ON subcontractors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update subcontractors"
  ON subcontractors FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete subcontractors"
  ON subcontractors FOR DELETE
  TO authenticated
  USING (true);

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view subcontractors" ON subcontractors IS 'All authenticated users can view subcontractors';
COMMENT ON POLICY "Users can create subcontractors" ON subcontractors IS 'All authenticated users can create subcontractors';
COMMENT ON POLICY "Users can update subcontractors" ON subcontractors IS 'All authenticated users can update subcontractors';
COMMENT ON POLICY "Users can delete subcontractors" ON subcontractors IS 'All authenticated users can delete subcontractors';

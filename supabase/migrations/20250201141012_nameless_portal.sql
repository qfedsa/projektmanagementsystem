-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can create own subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can update own subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can delete own subcontractors" ON subcontractors;

-- Add trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_subcontractor_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subcontractors_set_user_id ON subcontractors;
CREATE TRIGGER subcontractors_set_user_id
  BEFORE INSERT ON subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION set_subcontractor_user_id();

-- Create policies that enforce user isolation
CREATE POLICY "Users can view own subcontractors"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE t.responsible_party = subcontractors.id
        AND pm.user_id = auth.uid()
      )
    END
  );

CREATE POLICY "Users can create own subcontractors"
  ON subcontractors FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(user_id, auth.uid()) = auth.uid()
  );

CREATE POLICY "Users can update own subcontractors"
  ON subcontractors FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE t.responsible_party = subcontractors.id
        AND pm.user_id = auth.uid()
      )
    END
  );

CREATE POLICY "Users can delete own subcontractors"
  ON subcontractors FOR DELETE
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE t.responsible_party = subcontractors.id
        AND pm.user_id = auth.uid()
      )
    END
  );

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view own subcontractors" ON subcontractors IS 'Users can only view their own subcontractors or those used in their projects';
COMMENT ON POLICY "Users can create own subcontractors" ON subcontractors IS 'Users can only create subcontractors for themselves';
COMMENT ON POLICY "Users can update own subcontractors" ON subcontractors IS 'Users can only update their own subcontractors or those used in their projects';
COMMENT ON POLICY "Users can delete own subcontractors" ON subcontractors IS 'Users can only delete their own subcontractors or those used in their projects';

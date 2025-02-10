-- Drop existing policies
DROP POLICY IF EXISTS "Users can view subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can create subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can update subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Users can delete subcontractors" ON subcontractors;

-- Add user_id column to track ownership
ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create temporary function to get default user
CREATE OR REPLACE FUNCTION get_first_user_id()
RETURNS uuid AS $$
DECLARE
    first_user_id uuid;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    RETURN first_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default user_id for existing records
DO $$ 
DECLARE
    default_user_id uuid;
BEGIN
    default_user_id := get_first_user_id();
    IF default_user_id IS NOT NULL THEN
        UPDATE subcontractors 
        SET user_id = default_user_id
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Drop temporary function
DROP FUNCTION get_first_user_id();

-- Make user_id required for future records, but only after setting defaults
ALTER TABLE subcontractors 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subcontractors_user_id 
ON subcontractors(user_id);

-- Create policies that enforce user isolation
CREATE POLICY "Users can view own subcontractors"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own subcontractors"
  ON subcontractors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subcontractors"
  ON subcontractors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subcontractors"
  ON subcontractors FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add comments explaining the policies
COMMENT ON COLUMN subcontractors.user_id IS 'The user who created this subcontractor';
COMMENT ON POLICY "Users can view own subcontractors" ON subcontractors IS 'Users can only view their own subcontractors';
COMMENT ON POLICY "Users can create own subcontractors" ON subcontractors IS 'Users can only create subcontractors for themselves';
COMMENT ON POLICY "Users can update own subcontractors" ON subcontractors IS 'Users can only update their own subcontractors';
COMMENT ON POLICY "Users can delete own subcontractors" ON subcontractors IS 'Users can only delete their own subcontractors';

-- Enable RLS for projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;

-- Add user_id column to track ownership
ALTER TABLE projects 
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
        UPDATE projects 
        SET user_id = default_user_id
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Drop temporary function
DROP FUNCTION get_first_user_id();

-- Make user_id required for future records
ALTER TABLE projects 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects(user_id);

-- Create policies that enforce user isolation
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add comments explaining the policies
COMMENT ON COLUMN projects.user_id IS 'The user who created this project';
COMMENT ON POLICY "Users can view own projects" ON projects IS 'Users can only view their own projects';
COMMENT ON POLICY "Users can create own projects" ON projects IS 'Users can only create projects for themselves';
COMMENT ON POLICY "Users can update own projects" ON projects IS 'Users can only update their own projects';
COMMENT ON POLICY "Users can delete own projects" ON projects IS 'Users can only delete their own projects';

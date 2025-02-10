-- Enable RLS for projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Add user_id column to track ownership if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects(user_id);

-- Create policies that enforce user isolation
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = id
        AND user_id = auth.uid()
      )
    END
  );

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(user_id, auth.uid()) = auth.uid()
  );

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = id
        AND user_id = auth.uid()
      )
    END
  );

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = id
        AND user_id = auth.uid()
        AND role = 'owner'
      )
    END
  );

-- Add trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_project_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_set_user_id ON projects;
CREATE TRIGGER projects_set_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_user_id();

-- Add comments explaining the policies
COMMENT ON COLUMN projects.user_id IS 'The user who created this project';
COMMENT ON POLICY "Users can view own projects" ON projects IS 'Users can only view their own projects';
COMMENT ON POLICY "Users can create own projects" ON projects IS 'Users can only create projects for themselves';
COMMENT ON POLICY "Users can update own projects" ON projects IS 'Users can only update their own projects';
COMMENT ON POLICY "Users can delete own projects" ON projects IS 'Users can only delete their own projects';

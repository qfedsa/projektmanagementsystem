-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_project_created ON projects;
DROP FUNCTION IF EXISTS add_project_creator_as_member;

-- Create improved function that handles null auth.uid() case
CREATE OR REPLACE FUNCTION add_project_creator_as_member()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Only insert project member if we have a valid user ID
  IF current_user_id IS NOT NULL THEN
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.id, current_user_id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_member();

-- Add comment to function
COMMENT ON FUNCTION add_project_creator_as_member IS 'Adds the project creator as an owner in project_members when a new project is created';

-- Create function to manually add project member
CREATE OR REPLACE FUNCTION manually_add_project_member(
  project_id_param uuid,
  user_id_param uuid,
  role_param text DEFAULT 'member'
)
RETURNS void AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (project_id_param, user_id_param, role_param)
  ON CONFLICT (project_id, user_id) 
  DO UPDATE SET role = role_param;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION manually_add_project_member IS 'Manually adds or updates a project member with specified role';

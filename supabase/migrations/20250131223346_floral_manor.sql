-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'owner',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT project_members_unique_membership UNIQUE(project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id 
    ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id 
    ON project_members(user_id);

-- Create function to automatically add project creator as member
CREATE OR REPLACE FUNCTION add_project_creator_as_member()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID from auth.uid()
    current_user_id := auth.uid();
    
    -- Only proceed if we have a valid user ID
    IF current_user_id IS NOT NULL THEN
        -- Insert project member record
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (NEW.id, current_user_id, 'owner');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after project creation
DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION add_project_creator_as_member();

-- Disable RLS for project_members table
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the table and trigger
COMMENT ON TABLE project_members IS 'Stores project membership information and roles';
COMMENT ON FUNCTION add_project_creator_as_member IS 'Automatically adds project creator as owner when a new project is created';

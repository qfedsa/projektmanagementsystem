-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT project_members_project_id_fkey 
        FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE,
    CONSTRAINT project_members_unique_membership 
        UNIQUE(project_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id 
    ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id 
    ON project_members(user_id);

-- Disable RLS for project_members table
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Update delete_project_cascade function to handle project_members
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
RETURNS void AS $$
BEGIN
    -- Delete message_sent entries (they reference project_id)
    DELETE FROM message_sent WHERE project_id = project_id_param;
    
    -- Delete workflow_status entries (they reference tasks and project_id)
    DELETE FROM workflow_status WHERE project_id = project_id_param;
    
    -- Delete delays (they reference tasks and project_id)
    DELETE FROM delays WHERE project_id = project_id_param;
    
    -- Delete dependencies (they reference tasks)
    DELETE FROM dependencies 
    WHERE task_id IN (
        SELECT id FROM tasks WHERE project_id = project_id_param
    );
    
    -- Delete all tasks for the project
    DELETE FROM tasks WHERE project_id = project_id_param;
    
    -- Delete projekt_fehler entries
    DELETE FROM projekt_fehler WHERE project_id = project_id_param;
    
    -- Delete project_members entries (will be handled by ON DELETE CASCADE)
    
    -- Finally delete the project itself
    DELETE FROM projects WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION delete_project_cascade IS 'Deletes a project and all related data across all tables';

-- Drop existing function
DROP FUNCTION IF EXISTS delete_project_cascade;

-- Create updated function that handles all related tables
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
    
    -- Finally delete the project itself
    DELETE FROM projects WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

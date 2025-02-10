-- Drop existing function
DROP FUNCTION IF EXISTS delete_project_cascade;

-- Create updated function with better error handling
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
RETURNS void AS $$
DECLARE
    project_exists boolean;
BEGIN
    -- Check if project exists first
    SELECT EXISTS (
        SELECT 1 FROM projects WHERE id = project_id_param
    ) INTO project_exists;

    IF NOT project_exists THEN
        RAISE NOTICE 'Project % does not exist, skipping deletion', project_id_param;
        RETURN;
    END IF;

    -- Start transaction
    BEGIN
        -- Delete work_times entries first (they reference employees)
        DELETE FROM work_times 
        WHERE employee_id IN (
            SELECT id FROM employees 
            WHERE project_id = project_id_param
        );
        
        -- Delete employees entries
        DELETE FROM employees 
        WHERE project_id = project_id_param;

        -- Delete message_sent entries (they reference project_id)
        DELETE FROM message_sent 
        WHERE project_id = project_id_param;
        
        -- Delete workflow_status entries (they reference tasks and project_id)
        DELETE FROM workflow_status 
        WHERE project_id = project_id_param;
        
        -- Delete delays (they reference tasks and project_id)
        DELETE FROM delays 
        WHERE project_id = project_id_param;
        
        -- Delete dependencies (they reference tasks)
        DELETE FROM dependencies 
        WHERE task_id IN (
            SELECT id FROM tasks 
            WHERE project_id = project_id_param
        );
        
        -- Delete all tasks for the project
        DELETE FROM tasks 
        WHERE project_id = project_id_param;
        
        -- Delete projekt_fehler entries
        DELETE FROM projekt_fehler 
        WHERE project_id = project_id_param;
        
        -- Delete project_members entries
        DELETE FROM project_members 
        WHERE project_id = project_id_param;
        
        -- Finally delete the project itself
        DELETE FROM projects 
        WHERE id = project_id_param;

        -- Verify deletion
        IF EXISTS (SELECT 1 FROM projects WHERE id = project_id_param) THEN
            RAISE EXCEPTION 'Project deletion failed: Project still exists';
        END IF;

        -- Log successful deletion
        RAISE NOTICE 'Successfully deleted project % and all related data', project_id_param;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error details
            RAISE NOTICE 'Error deleting project %: % %', 
                project_id_param, 
                SQLERRM,
                SQLSTATE;
            -- Re-raise the error
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION delete_project_cascade IS 'Deletes a project and all related data across all tables with improved error handling';

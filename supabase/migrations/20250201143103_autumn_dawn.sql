-- Drop existing function
DROP FUNCTION IF EXISTS delete_project_cascade;

-- Create improved function with better error handling and explicit locks
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
RETURNS void AS $$
DECLARE
    project_exists boolean;
    project_record projects%ROWTYPE;
BEGIN
    -- Lock the project record first to prevent concurrent modifications
    SELECT * INTO project_record
    FROM projects 
    WHERE id = project_id_param
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE NOTICE 'Project % does not exist', project_id_param;
        RETURN;
    END IF;

    -- Delete related records in correct order with explicit error handling
    BEGIN
        -- Delete message_sent entries
        DELETE FROM message_sent 
        WHERE project_id = project_id_param;
        
        -- Delete workflow_status entries
        DELETE FROM workflow_status 
        WHERE project_id = project_id_param;
        
        -- Delete delays
        DELETE FROM delays 
        WHERE project_id = project_id_param;
        
        -- Delete dependencies
        DELETE FROM dependencies 
        WHERE task_id IN (
            SELECT id FROM tasks 
            WHERE project_id = project_id_param
        );
        
        -- Delete tasks
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

        -- Verify deletion was successful
        SELECT EXISTS (
            SELECT 1 FROM projects WHERE id = project_id_param
        ) INTO project_exists;

        IF project_exists THEN
            RAISE EXCEPTION 'Project deletion verification failed';
        END IF;

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
COMMENT ON FUNCTION delete_project_cascade IS 'Deletes a project and all related data with improved error handling and locking';

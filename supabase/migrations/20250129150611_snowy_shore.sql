/*
  # Update delete_project_cascade function

  1. Changes
    - Add support for work_times and employees tables
    - Improve deletion order to handle foreign key constraints
    - Add error handling and logging
  
  2. Tables Handled
    - message_sent
    - workflow_status
    - delays
    - dependencies
    - tasks
    - projekt_fehler
    - project_members
    - work_times
    - employees
    - projects
*/

-- Drop existing function
DROP FUNCTION IF EXISTS delete_project_cascade;

-- Create updated function that handles all related tables
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION delete_project_cascade IS 'Deletes a project and all related data across all tables including work_times and employees';

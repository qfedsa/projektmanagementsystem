/*
  # Add cascade delete for projekt_fehler table

  1. Changes
    - Drop existing foreign key if it exists
    - Add new foreign key with CASCADE delete
    - Update delete_project_cascade function to handle projekt_fehler table

  2. Notes
    - Ensures clean project deletion
    - Prevents foreign key constraint violations
*/

-- Drop existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'projekt_fehler_project_id_fkey'
  ) THEN
    ALTER TABLE projekt_fehler DROP CONSTRAINT projekt_fehler_project_id_fkey;
  END IF;
END $$;

-- Add new foreign key with CASCADE delete
ALTER TABLE projekt_fehler
  ADD CONSTRAINT projekt_fehler_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

-- Update delete_project_cascade function to include projekt_fehler
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
RETURNS void AS $$
BEGIN
    -- Delete delays first (they reference tasks)
    DELETE FROM delays WHERE project_id = project_id_param;
    
    -- Delete workflow status entries
    DELETE FROM workflow_status 
    WHERE task_id IN (
        SELECT id FROM tasks WHERE project_id = project_id_param
    );
    
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

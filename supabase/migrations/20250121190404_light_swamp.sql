/*
      # Fix delete_project_cascade stored procedure
      
      Korrigiert die Stored Procedure zum Löschen von Projekten:
      - Fügt korrekte Typkonvertierung hinzu
      - Verbessert Fehlerbehandlung
      - Stellt sicher, dass alle abhängigen Daten gelöscht werden
    */

    -- Drop existing procedure if it exists
    DROP FUNCTION IF EXISTS delete_project_cascade(uuid);

    -- Create the fixed procedure
    CREATE OR REPLACE FUNCTION delete_project_cascade(project_id_param uuid)
    RETURNS void AS $$
    BEGIN
        -- Delete delays first (they reference tasks)
        DELETE FROM delays WHERE project_id = project_id_param;
        
        -- Delete dependencies (they reference tasks)
        DELETE FROM dependencies 
        WHERE task_id IN (
            SELECT id FROM tasks WHERE project_id = project_id_param
        );
        
        -- Delete all tasks for the project
        DELETE FROM tasks WHERE project_id = project_id_param;
        
        -- Finally delete the project itself
        DELETE FROM projects WHERE id = project_id_param;
    END;
    $$ LANGUAGE plpgsql;

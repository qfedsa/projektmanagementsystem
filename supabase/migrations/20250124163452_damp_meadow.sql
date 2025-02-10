/*
  # Fix workflow status table

  1. Changes
    - Drop and recreate workflow_status table with correct structure
    - Add project_id column
    - Add missing columns for task info
    - Add proper foreign key constraints
    - Add indexes for better performance
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS workflow_status CASCADE;

-- Create workflow_status table with proper structure
CREATE TABLE workflow_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    project_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('erfolgreich', 'fehlgeschlagen')),
    message text NOT NULL,
    task_name text NOT NULL,
    contact_person text,
    email text,
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_task FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_workflow_status_task_id ON workflow_status(task_id);
CREATE INDEX idx_workflow_status_project_id ON workflow_status(project_id);
CREATE INDEX idx_workflow_status_created_at ON workflow_status(created_at DESC);

-- Disable RLS for workflow_status table
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;

/*
  # Fix project_id type mismatch

  1. Changes
    - Change project_id column type in tasks table from text to uuid
    - Add foreign key constraint to projects table
  
  2. Security
    - Maintain existing RLS settings
*/

-- Temporarily convert project_id to uuid and add foreign key constraint
ALTER TABLE tasks 
  ALTER COLUMN project_id TYPE uuid USING project_id::uuid,
  ADD CONSTRAINT fk_tasks_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE;

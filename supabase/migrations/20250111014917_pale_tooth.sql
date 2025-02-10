/*
  # Add project name field
  
  1. Changes
    - Add project_name column to projects table
    - Set default name for existing projects
  
  2. Notes
    - Ensures backward compatibility
    - Adds NOT NULL constraint
*/

-- Add project_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_name text NOT NULL DEFAULT 'Neues Projekt';
  END IF;
END $$;

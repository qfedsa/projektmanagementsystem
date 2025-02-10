/*
  # Add dependencies column to tasks table

  1. Changes
    - Add dependencies column to tasks table
    - Make it nullable to support tasks without dependencies
*/

-- Add dependencies column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'dependencies'
  ) THEN
    ALTER TABLE tasks ADD COLUMN dependencies uuid REFERENCES tasks(id);
  END IF;
END $$;

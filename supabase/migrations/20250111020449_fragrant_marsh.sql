/*
  # Add project completion status
  
  1. Changes
    - Add completed column to projects table
    - Add completed_at timestamp
  
  2. Notes
    - Default value for completed is false
    - completed_at is nullable
*/

-- Add completion status columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'completed'
  ) THEN
    ALTER TABLE projects ADD COLUMN completed boolean NOT NULL DEFAULT false;
    ALTER TABLE projects ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

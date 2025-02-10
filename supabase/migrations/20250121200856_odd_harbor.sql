/*
  # Add completed column to tasks table

  1. Changes
    - Add completed column to tasks table with default value false
    - Add completed_at timestamp column
  
  2. Notes
    - completed is used to track task completion status
    - completed_at records when a task was completed
*/

-- Add completed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'completed'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed boolean NOT NULL DEFAULT false;
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

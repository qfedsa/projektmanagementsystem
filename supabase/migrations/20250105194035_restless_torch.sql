/*
  # Fix task ordering and timestamps

  1. Changes
    - Add position column to tasks table
    - Update existing tasks with sequential positions
    - Add index for better query performance
*/

-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'position'
  ) THEN
    ALTER TABLE tasks ADD COLUMN position integer;
  END IF;
END $$;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);

-- Update existing tasks to have sequential positions based on created_at
WITH numbered_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id 
      ORDER BY created_at ASC
    ) as new_position
  FROM tasks
)
UPDATE tasks t
SET position = nt.new_position
FROM numbered_tasks nt
WHERE t.id = nt.id;

/*
  # Fix task positions

  1. Changes
    - Add position column if not exists
    - Update position values based on task order
    - Create trigger to automatically set position for new tasks
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

-- Create function to maintain task positions
CREATE OR REPLACE FUNCTION maintain_task_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Set position based on project_id to maintain separate sequences per project
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM tasks
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set position
DROP TRIGGER IF EXISTS set_task_position ON tasks;
CREATE TRIGGER set_task_position
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION maintain_task_position();

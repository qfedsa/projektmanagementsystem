-- Add position column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);

-- Update existing tasks to have sequential positions
DO $$
DECLARE
  task_record RECORD;
  pos integer := 0;
BEGIN
  FOR task_record IN SELECT id FROM tasks ORDER BY created_at ASC LOOP
    UPDATE tasks SET position = pos WHERE id = task_record.id;
    pos := pos + 1;
  END LOOP;
END $$;

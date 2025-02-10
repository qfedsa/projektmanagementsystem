/*
  # Update workflow status table

  1. Changes
    - Add missing indexes if they don't exist
    - Ensure correct constraints
    - No table creation (since it already exists)

  2. Notes
    - Safe migration that only adds missing components
    - Preserves existing data
*/

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_workflow_status_created_at 
  ON workflow_status(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_status_task_id 
  ON workflow_status(task_id);

-- Ensure status check constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'workflow_status_status_check'
  ) THEN
    ALTER TABLE workflow_status
      ADD CONSTRAINT workflow_status_status_check 
      CHECK (status IN ('success', 'error'));
  END IF;
END $$;

-- Ensure task_id foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'workflow_status_task_id_fkey'
  ) THEN
    ALTER TABLE workflow_status
      ADD CONSTRAINT workflow_status_task_id_fkey 
      FOREIGN KEY (task_id) 
      REFERENCES tasks(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure RLS is disabled
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;

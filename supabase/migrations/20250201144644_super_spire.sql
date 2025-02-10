-- Drop existing dependencies table
DROP TABLE IF EXISTS dependencies CASCADE;

-- Create new dependencies table with array support
CREATE TABLE dependencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependent_task_ids uuid[] NOT NULL DEFAULT '{}', -- Array of dependent task IDs
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_task FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX idx_dependencies_task_id ON dependencies(task_id);

-- Create GIN index for array searching
CREATE INDEX idx_dependencies_dependent_tasks ON dependencies USING GIN (dependent_task_ids);

-- Disable RLS for dependencies table
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the table structure
COMMENT ON TABLE dependencies IS 'Stores task dependencies with support for multiple dependent tasks';
COMMENT ON COLUMN dependencies.dependent_task_ids IS 'Array of task IDs that this task depends on';

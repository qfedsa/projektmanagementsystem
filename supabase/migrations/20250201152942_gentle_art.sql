-- Drop existing dependencies table
DROP TABLE IF EXISTS dependencies CASCADE;

-- Create new dependencies table with proper structure
CREATE TABLE dependencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependent_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_dependency UNIQUE (task_id, dependent_task_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_dependencies_task_id ON dependencies(task_id);
CREATE INDEX idx_dependencies_dependent_task_id ON dependencies(dependent_task_id);

-- Disable RLS for dependencies table
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the table structure
COMMENT ON TABLE dependencies IS 'Stores task dependencies with one-to-one relationships';
COMMENT ON COLUMN dependencies.dependent_task_id IS 'The ID of the task that this task depends on';

/*
  # Timeline Query Optimization

  1. New Indexes
    - Add indexes for timeline-related queries
    - Create composite indexes for common query patterns
    - Add indexes for sorting and filtering

  2. Changes
    - Add task status index
    - Add project status index
    - Add composite indexes for timeline queries
    - Add indexes for date columns
*/

-- Add index for task status columns
CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON tasks(started, completed);

-- Add index for task dates
CREATE INDEX IF NOT EXISTS idx_tasks_dates 
ON tasks(start_date, calculated_end_date);

-- Add composite index for timeline queries
CREATE INDEX IF NOT EXISTS idx_tasks_timeline 
ON tasks(project_id, position, start_date, calculated_end_date);

-- Add index for project status
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(completed, start_date);

-- Add index for task position ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position_project 
ON tasks(project_id, position);

-- Add partial index for active tasks
CREATE INDEX IF NOT EXISTS idx_tasks_active 
ON tasks(project_id) 
WHERE NOT completed;

-- Add index for task duration
CREATE INDEX IF NOT EXISTS idx_tasks_duration 
ON tasks(duration) 
WHERE duration > 0;

-- Add comment explaining the optimizations
COMMENT ON TABLE tasks IS 'Task table with optimized indexes for timeline queries';

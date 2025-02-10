-- Add started column to projects if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS started boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_started ON projects(started);

-- Add comment explaining the column
COMMENT ON COLUMN projects.started IS 'Indicates whether the project has been started';

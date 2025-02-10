-- Make start_date column nullable
ALTER TABLE projects ALTER COLUMN start_date DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN projects.start_date IS 'Project start date. Can be null until the project is started.';

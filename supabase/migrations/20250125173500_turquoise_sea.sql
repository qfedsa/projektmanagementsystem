-- Make start_date column nullable and add default values for other required fields
ALTER TABLE projects 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN completed SET DEFAULT false,
  ALTER COLUMN project_name SET NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN projects.start_date IS 'Project start date. Can be null until the project is started.';

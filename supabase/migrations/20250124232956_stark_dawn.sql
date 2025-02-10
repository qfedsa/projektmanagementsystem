-- Add archived column to workflow_status table
ALTER TABLE workflow_status ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_status_archived ON workflow_status(archived);

-- Add comment to function
COMMENT ON FUNCTION delete_project_cascade IS 'Deletes a project and all related data across all tables except holidays';

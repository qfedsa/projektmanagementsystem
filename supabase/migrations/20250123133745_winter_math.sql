/*
  # Create workflow_status table with task relationship

  1. New Tables
    - `workflow_status`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `status` (text, check constraint for 'success' or 'error')
      - `message` (text)
      - `created_at` (timestamp with timezone)
  
  2. Indexes
    - Index on task_id for faster joins
    - Index on created_at for faster sorting
*/

-- Drop existing table and indexes if they exist
DROP TABLE IF EXISTS workflow_status CASCADE;

-- Create workflow_status table
CREATE TABLE workflow_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'error')),
    message text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE workflow_status
    ADD CONSTRAINT workflow_status_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES tasks(id) 
    ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_workflow_status_task_id 
    ON workflow_status(task_id);
    
CREATE INDEX idx_workflow_status_created_at 
    ON workflow_status(created_at);

-- Disable RLS for workflow_status table
ALTER TABLE workflow_status DISABLE ROW LEVEL SECURITY;

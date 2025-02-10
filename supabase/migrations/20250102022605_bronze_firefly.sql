/*
  # Fix dependencies table structure

  1. Changes
    - Drop existing dependencies table
    - Recreate dependencies table with proper UUID constraints
    - Add foreign key constraints with ON DELETE CASCADE
    - Add unique constraint to prevent duplicate dependencies
    
  2. Security
    - RLS disabled for dependencies table (internal use only)
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS dependencies CASCADE;

-- Create dependencies table with proper UUID columns
CREATE TABLE dependencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    dependent_task_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_task FOREIGN KEY (task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_dependent_task FOREIGN KEY (dependent_task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT unique_dependency UNIQUE (task_id, dependent_task_id)
);

-- Disable RLS for dependencies table
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;

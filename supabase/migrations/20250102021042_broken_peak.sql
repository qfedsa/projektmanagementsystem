/*
  # Create dependencies table and relationships

  1. New Tables
    - `dependencies`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `dependent_task_id` (uuid, foreign key to tasks)
      - `created_at` (timestamptz)

  2. Relationships
    - Foreign key constraints to tasks table
*/

-- Create dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id),
    dependent_task_id uuid NOT NULL REFERENCES tasks(id),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_dependency UNIQUE (task_id, dependent_task_id)
);

-- Disable RLS for dependencies table
ALTER TABLE dependencies DISABLE ROW LEVEL SECURITY;

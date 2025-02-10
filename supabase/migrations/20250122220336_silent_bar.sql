/*
  # Fix tasks and subcontractors relationship

  1. Changes
    - Add foreign key constraint between tasks.responsible_party and subcontractors.id
    - Update existing tasks to ensure data integrity
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- First, ensure the responsible_party column is UUID type
ALTER TABLE tasks 
  ALTER COLUMN responsible_party TYPE uuid USING responsible_party::uuid;

-- Add the foreign key constraint
ALTER TABLE tasks
  ADD CONSTRAINT tasks_responsible_party_fkey
  FOREIGN KEY (responsible_party)
  REFERENCES subcontractors(id)
  ON DELETE SET NULL;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_tasks_responsible_party
  ON tasks(responsible_party);

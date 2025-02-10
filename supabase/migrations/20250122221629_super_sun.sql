/*
  # Fix task and subcontractor relationship

  1. Changes
    - Drop duplicate foreign key constraints
    - Create single, clear foreign key relationship
    - Update indexes for performance

  2. Security
    - Maintain existing security settings
*/

-- Drop any existing foreign key constraints between tasks and subcontractors
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_subcontractor_id_fkey'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_subcontractor_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_responsible_party_fkey'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_responsible_party_fkey;
  END IF;
END $$;

-- Drop the subcontractor_id column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'subcontractor_id'
  ) THEN
    ALTER TABLE tasks DROP COLUMN subcontractor_id;
  END IF;
END $$;

-- Ensure responsible_party is UUID type
ALTER TABLE tasks 
  ALTER COLUMN responsible_party TYPE uuid USING responsible_party::uuid;

-- Create single foreign key constraint
ALTER TABLE tasks
  ADD CONSTRAINT tasks_responsible_party_fkey
  FOREIGN KEY (responsible_party)
  REFERENCES subcontractors(id)
  ON DELETE SET NULL;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_tasks_responsible_party
  ON tasks(responsible_party);

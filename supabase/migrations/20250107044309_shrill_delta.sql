/*
  # Update dependencies table structure

  1. Changes
    - Entferne dependencies Spalte aus tasks Tabelle
    - Stelle sicher, dass die dependencies Tabelle korrekt eingerichtet ist
*/

-- Entferne die dependencies Spalte aus der tasks Tabelle
ALTER TABLE tasks DROP COLUMN IF EXISTS dependencies;

-- Stelle sicher, dass die dependencies Tabelle existiert
CREATE TABLE IF NOT EXISTS dependencies (
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

/*
  # Fix project_id type in tasks table
  
  1. Changes
    - Ändert den Datentyp der project_id Spalte von text zu uuid
    - Aktualisiert die Foreign Key Constraint
  
  2. Sicherheit
    - Verwendet eine sichere Konvertierung von text zu uuid
    - Behält bestehende Daten bei
*/

-- Temporär die Foreign Key Constraints entfernen
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE delays DROP CONSTRAINT IF EXISTS delays_project_id_fkey;

-- Ändere den Datentyp der project_id Spalte
ALTER TABLE tasks 
  ALTER COLUMN project_id TYPE uuid 
  USING project_id::uuid;

-- Stelle die Foreign Key Constraints wieder her
ALTER TABLE tasks
  ADD CONSTRAINT tasks_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id)
  ON DELETE CASCADE;

ALTER TABLE delays
  ADD CONSTRAINT delays_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id)
  ON DELETE CASCADE;

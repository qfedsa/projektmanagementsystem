/*
  # Task Status Update Trigger

  1. Neue Funktionen
    - `update_task_status()`: Aktualisiert den Status einer Aufgabe basierend auf dem aktuellen Datum
    - `update_all_task_statuses()`: Aktualisiert die Status aller Aufgaben eines Projekts

  2. Trigger
    - Trigger der bei Änderungen am Datum einer Aufgabe ausgelöst wird
    - Trigger der bei INSERT einer neuen Aufgabe ausgelöst wird

  3. Sicherheit
    - Keine RLS-Änderungen notwendig
*/

-- Lösche existierende Funktionen und Trigger
DROP TRIGGER IF EXISTS task_status_update ON tasks;
DROP TRIGGER IF EXISTS task_status_insert ON tasks;
DROP FUNCTION IF EXISTS update_task_status();
DROP FUNCTION IF EXISTS update_all_task_statuses(uuid);

-- Funktion zum Aktualisieren des Task-Status
CREATE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Setze started auf true wenn das Startdatum erreicht ist
  IF NEW.start_date <= CURRENT_DATE AND NOT NEW.started AND NOT NEW.completed THEN
    NEW.started = true;
  END IF;

  -- Setze completed auf true am Tag nach dem Enddatum
  IF NEW.calculated_end_date < CURRENT_DATE AND NOT NEW.completed THEN
    NEW.completed = true;
    NEW.completed_at = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Aktualisieren aller Task-Status eines Projekts
CREATE FUNCTION update_all_task_statuses(project_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Aktualisiere started Status
  UPDATE tasks
  SET started = true
  WHERE 
    project_id = project_id_param 
    AND start_date <= CURRENT_DATE 
    AND NOT started 
    AND NOT completed;

  -- Aktualisiere completed Status
  UPDATE tasks
  SET 
    completed = true,
    completed_at = CURRENT_TIMESTAMP
  WHERE 
    project_id = project_id_param 
    AND calculated_end_date < CURRENT_DATE 
    AND NOT completed;
END;
$$ LANGUAGE plpgsql;

-- Trigger für einzelne Task-Updates
CREATE TRIGGER task_status_update
  BEFORE UPDATE OF start_date, calculated_end_date
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status();

-- Trigger für neue Tasks
CREATE TRIGGER task_status_insert
  BEFORE INSERT
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status();

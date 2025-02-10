-- Lösche existierende Funktionen und Trigger
DROP TRIGGER IF EXISTS task_status_update ON tasks;
DROP TRIGGER IF EXISTS task_status_insert ON tasks;
DROP FUNCTION IF EXISTS update_task_status();
DROP FUNCTION IF EXISTS update_all_task_statuses(uuid);

-- Funktion zum Aktualisieren des Task-Status
CREATE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
DECLARE
  current_status text;
BEGIN
  -- Setze started auf true wenn das Startdatum erreicht ist
  IF NEW.start_date <= CURRENT_DATE AND NOT COALESCE(NEW.started, false) AND NOT COALESCE(NEW.completed, false) THEN
    NEW.started = true;
    
    -- Erstelle Workflow-Status-Eintrag für gestartete Aufgabe
    INSERT INTO workflow_status (
      task_id,
      project_id,
      status,
      message,
      task_name,
      start_date,
      end_date
    ) VALUES (
      NEW.id,
      NEW.project_id,
      'erfolgreich',
      'Aufgabe wurde automatisch gestartet',
      NEW.task_name,
      NEW.start_date,
      NEW.calculated_end_date
    );
  END IF;

  -- Setze completed auf true am Tag nach dem Enddatum
  IF NEW.calculated_end_date < CURRENT_DATE AND NOT COALESCE(NEW.completed, false) THEN
    NEW.completed = true;
    NEW.completed_at = CURRENT_TIMESTAMP;
    
    -- Erstelle Workflow-Status-Eintrag für abgeschlossene Aufgabe
    INSERT INTO workflow_status (
      task_id,
      project_id,
      status,
      message,
      task_name,
      start_date,
      end_date
    ) VALUES (
      NEW.id,
      NEW.project_id,
      'erfolgreich',
      'Aufgabe wurde automatisch abgeschlossen',
      NEW.task_name,
      NEW.start_date,
      NEW.calculated_end_date
    );
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
    AND NOT COALESCE(started, false)
    AND NOT COALESCE(completed, false);

  -- Aktualisiere completed Status
  UPDATE tasks
  SET 
    completed = true,
    completed_at = CURRENT_TIMESTAMP
  WHERE 
    project_id = project_id_param 
    AND calculated_end_date < CURRENT_DATE 
    AND NOT COALESCE(completed, false);
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

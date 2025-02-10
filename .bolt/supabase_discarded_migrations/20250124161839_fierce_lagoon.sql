-- Test-Daten für die Workflow-Funktionalität
DO $$
DECLARE
  test_project_id uuid;
  task_id_1 uuid;
  task_id_2 uuid;
  task_id_3 uuid;
BEGIN
  -- Erstelle ein Test-Projekt
  INSERT INTO projects (project_name, start_date)
  VALUES ('Test Projekt', CURRENT_DATE)
  RETURNING id INTO test_project_id;

  -- Test 1: Task mit heutigem Startdatum
  INSERT INTO tasks (
    project_id,
    task_name,
    duration,
    start_date,
    calculated_end_date,
    position
  ) VALUES (
    test_project_id,
    'Test Task 1 - Heute starten',
    5,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    0
  ) RETURNING id INTO task_id_1;

  -- Test 2: Task mit gestrigem Enddatum
  INSERT INTO tasks (
    project_id,
    task_name,
    duration,
    start_date,
    calculated_end_date,
    position
  ) VALUES (
    test_project_id,
    'Test Task 2 - Gestern beendet',
    1,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '1 day',
    1
  ) RETURNING id INTO task_id_2;

  -- Test 3: Zukünftiger Task
  INSERT INTO tasks (
    project_id,
    task_name,
    duration,
    start_date,
    calculated_end_date,
    position
  ) VALUES (
    test_project_id,
    'Test Task 3 - Zukunft',
    3,
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days',
    2
  ) RETURNING id INTO task_id_3;

  -- Überprüfe die Status
  RAISE NOTICE 'Überprüfe Task-Status...';
  
  -- Task 1 sollte "started = true" sein
  IF EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id_1 
    AND started = true 
    AND completed = false
  ) THEN
    RAISE NOTICE 'Test 1 erfolgreich: Task 1 wurde automatisch gestartet';
  ELSE
    RAISE NOTICE 'Test 1 fehlgeschlagen: Task 1 wurde nicht korrekt gestartet';
  END IF;

  -- Task 2 sollte "completed = true" sein
  IF EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id_2 
    AND completed = true 
    AND completed_at IS NOT NULL
  ) THEN
    RAISE NOTICE 'Test 2 erfolgreich: Task 2 wurde automatisch abgeschlossen';
  ELSE
    RAISE NOTICE 'Test 2 fehlgeschlagen: Task 2 wurde nicht korrekt abgeschlossen';
  END IF;

  -- Task 3 sollte weder gestartet noch abgeschlossen sein
  IF EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id_3 
    AND started = false 
    AND completed = false
  ) THEN
    RAISE NOTICE 'Test 3 erfolgreich: Task 3 wurde korrekt initialisiert';
  ELSE
    RAISE NOTICE 'Test 3 fehlgeschlagen: Task 3 hat falschen Status';
  END IF;

  -- Überprüfe Workflow-Status-Einträge
  IF EXISTS (
    SELECT 1 FROM workflow_status 
    WHERE task_id = task_id_1 
    AND status = 'erfolgreich'
    AND message LIKE '%automatisch gestartet%'
  ) THEN
    RAISE NOTICE 'Workflow-Status Test 1 erfolgreich: Start-Status wurde erstellt';
  ELSE
    RAISE NOTICE 'Workflow-Status Test 1 fehlgeschlagen: Kein Start-Status gefunden';
  END IF;

  IF EXISTS (
    SELECT 1 FROM workflow_status 
    WHERE task_id = task_id_2 
    AND status = 'erfolgreich'
    AND message LIKE '%automatisch abgeschlossen%'
  ) THEN
    RAISE NOTICE 'Workflow-Status Test 2 erfolgreich: Abschluss-Status wurde erstellt';
  ELSE
    RAISE NOTICE 'Workflow-Status Test 2 fehlgeschlagen: Kein Abschluss-Status gefunden';
  END IF;

  -- Lösche die Test-Daten
  DELETE FROM workflow_status WHERE task_id IN (task_id_1, task_id_2, task_id_3);
  DELETE FROM tasks WHERE project_id = test_project_id;
  DELETE FROM projects WHERE id = test_project_id;
  
  RAISE NOTICE 'Test-Daten wurden bereinigt';
END $$;

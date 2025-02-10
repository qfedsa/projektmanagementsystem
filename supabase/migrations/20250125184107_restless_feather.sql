-- Erstelle ein neues Schema für das zweite Projekt
CREATE SCHEMA IF NOT EXISTS project2;

-- Kopiere alle Tabellen und ihre Struktur
CREATE TABLE project2.projects (LIKE public.projects INCLUDING ALL);
CREATE TABLE project2.tasks (LIKE public.tasks INCLUDING ALL);
CREATE TABLE project2.subcontractors (LIKE public.subcontractors INCLUDING ALL);
CREATE TABLE project2.delays (LIKE public.delays INCLUDING ALL);
CREATE TABLE project2.dependencies (LIKE public.dependencies INCLUDING ALL);
CREATE TABLE project2.workflow_status (LIKE public.workflow_status INCLUDING ALL);
CREATE TABLE project2.message_sent (LIKE public.message_sent INCLUDING ALL);
CREATE TABLE project2.projekt_fehler (LIKE public.projekt_fehler INCLUDING ALL);

-- Kopiere alle Foreign Key Constraints
ALTER TABLE project2.tasks
  ADD CONSTRAINT tasks_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES project2.projects(id)
  ON DELETE CASCADE;

ALTER TABLE project2.tasks
  ADD CONSTRAINT tasks_responsible_party_fkey
  FOREIGN KEY (responsible_party)
  REFERENCES project2.subcontractors(id)
  ON DELETE SET NULL;

ALTER TABLE project2.delays
  ADD CONSTRAINT delays_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES project2.projects(id)
  ON DELETE CASCADE;

ALTER TABLE project2.delays
  ADD CONSTRAINT delays_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES project2.tasks(id)
  ON DELETE CASCADE;

ALTER TABLE project2.dependencies
  ADD CONSTRAINT dependencies_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES project2.tasks(id)
  ON DELETE CASCADE;

ALTER TABLE project2.dependencies
  ADD CONSTRAINT dependencies_dependent_task_id_fkey 
  FOREIGN KEY (dependent_task_id) 
  REFERENCES project2.tasks(id)
  ON DELETE CASCADE;

ALTER TABLE project2.workflow_status
  ADD CONSTRAINT workflow_status_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES project2.projects(id)
  ON DELETE CASCADE;

ALTER TABLE project2.workflow_status
  ADD CONSTRAINT workflow_status_task_id_fkey 
  FOREIGN KEY (task_id) 
  REFERENCES project2.tasks(id)
  ON DELETE CASCADE;

ALTER TABLE project2.message_sent
  ADD CONSTRAINT message_sent_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES project2.projects(id)
  ON DELETE CASCADE;

ALTER TABLE project2.message_sent
  ADD CONSTRAINT message_sent_subcontractor_id_fkey 
  FOREIGN KEY (subcontractor_id) 
  REFERENCES project2.subcontractors(id)
  ON DELETE CASCADE;

ALTER TABLE project2.projekt_fehler
  ADD CONSTRAINT projekt_fehler_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES project2.projects(id)
  ON DELETE CASCADE;

-- Kopiere alle Indizes
CREATE INDEX IF NOT EXISTS idx_tasks_position_2 ON project2.tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible_party_2 ON project2.tasks(responsible_party);
CREATE INDEX IF NOT EXISTS idx_delays_task_id_2 ON project2.delays(task_id);
CREATE INDEX IF NOT EXISTS idx_delays_project_id_2 ON project2.delays(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status_created_at_2 ON project2.workflow_status(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_status_task_id_2 ON project2.workflow_status(task_id);
CREATE INDEX IF NOT EXISTS idx_message_sent_created_at_2 ON project2.message_sent(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_sent_archived_2 ON project2.message_sent(archived);
CREATE INDEX IF NOT EXISTS idx_projekt_fehler_created_at_2 ON project2.projekt_fehler(created_at DESC);

-- Disable RLS for all tables in the new schema
ALTER TABLE project2.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.subcontractors DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.delays DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.workflow_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.message_sent DISABLE ROW LEVEL SECURITY;
ALTER TABLE project2.projekt_fehler DISABLE ROW LEVEL SECURITY;

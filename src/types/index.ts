export interface Task {
  id: string;
  task_name: string;
  duration: number;
  responsible_party: string;
  dependencies: string | null;
  project_id: string;
  position: number;
  start_date?: string;
  calculated_end_date?: string;
  calculation_status?: 'pending' | 'calculated';
}

export interface Project {
  id: string;
  project_name: string;
  start_date: string;
  created_at: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Subcontractor {
  id: string;
  name: string;
  email: string;
  contact_person: string;
  created_at?: string;
  user_id?: string | null; // Neues Feld für Benutzer-ID
}

export interface Delay {
  id: string;
  task_id: string;
  project_id: string;
  delay_reason: string;
  delay_days: number;
  created_at: string;
}

export interface WebhookTask {
  id: string;
  task_name: string;
  duration: number;
  responsible_party: string;
  dependencies: string | string[];
  position: number;
}

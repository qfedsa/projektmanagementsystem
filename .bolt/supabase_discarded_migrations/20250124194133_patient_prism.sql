-- Create message_sent table
CREATE TABLE message_sent (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    subcontractor_id uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('erfolgreich', 'fehlgeschlagen')),
    message text NOT NULL,
    subject text NOT NULL,
    contact_person text NOT NULL,
    email text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT fk_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_subcontractor FOREIGN KEY (subcontractor_id)
        REFERENCES subcontractors(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_message_sent_project_id ON message_sent(project_id);
CREATE INDEX idx_message_sent_created_at ON message_sent(created_at DESC);

-- Disable RLS for message_sent table
ALTER TABLE message_sent DISABLE ROW LEVEL SECURITY;

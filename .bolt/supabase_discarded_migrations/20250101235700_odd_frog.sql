-- Drop existing table if it exists
DROP TABLE IF EXISTS subcontractors CASCADE;

-- Create subcontractors table with correct structure
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  contact_person text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicates
ALTER TABLE subcontractors 
  ADD CONSTRAINT subcontractors_name_email_key 
  UNIQUE (name, email);

-- Disable RLS for subcontractors table
ALTER TABLE subcontractors DISABLE ROW LEVEL SECURITY;

-- Insert some test data
INSERT INTO subcontractors (name, email, contact_person) VALUES
('Maurer', 'maurer@example.com', 'Herr Maurer'),
('Dachdecker', 'dach@example.com', 'Herr Dach');

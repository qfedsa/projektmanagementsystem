/*
  # Authentication and Authorization Setup

  1. Tables
    - Create project_members table for managing project access
    - Add trigger for automatic member creation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure data isolation between users
*/

-- Create project_members table first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'project_members'
  ) THEN
    CREATE TABLE project_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'member',
      created_at timestamptz DEFAULT now(),
      UNIQUE(project_id, user_id)
    );
  END IF;
END $$;

-- Add automatic project member creation on project creation
CREATE OR REPLACE FUNCTION add_project_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_project_created ON projects;

-- Create trigger
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_member();

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Project Members policies
  DROP POLICY IF EXISTS "Users can view their project memberships" ON project_members;
  DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
  
  -- Projects policies
  DROP POLICY IF EXISTS "Users can view their projects" ON projects;
  DROP POLICY IF EXISTS "Users can create projects" ON projects;
  DROP POLICY IF EXISTS "Users can update their projects" ON projects;
  DROP POLICY IF EXISTS "Users can delete their projects" ON projects;
  
  -- Tasks policies
  DROP POLICY IF EXISTS "Users can view tasks of their projects" ON tasks;
  DROP POLICY IF EXISTS "Users can manage tasks in their projects" ON tasks;
  
  -- Other policies
  DROP POLICY IF EXISTS "Users can view all subcontractors" ON subcontractors;
  DROP POLICY IF EXISTS "Users can manage subcontractors" ON subcontractors;
  DROP POLICY IF EXISTS "Users can view delays of their projects" ON delays;
  DROP POLICY IF EXISTS "Users can manage delays in their projects" ON delays;
  DROP POLICY IF EXISTS "Users can view workflow status of their projects" ON workflow_status;
  DROP POLICY IF EXISTS "Users can view messages of their projects" ON message_sent;
END $$;

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create new policies

-- Project Members Policies
CREATE POLICY "Users can view their project memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Projects Policies
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Tasks Policies
CREATE POLICY "Users can view tasks of their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tasks in their projects"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
      AND user_id = auth.uid()
    )
  );

-- Subcontractors Policies
CREATE POLICY "Users can view all subcontractors"
  ON subcontractors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage subcontractors"
  ON subcontractors FOR ALL
  TO authenticated
  USING (true);

-- Delays Policies
CREATE POLICY "Users can view delays of their projects"
  ON delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage delays in their projects"
  ON delays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = delays.project_id
      AND user_id = auth.uid()
    )
  );

-- Workflow Status Policies
CREATE POLICY "Users can view workflow status of their projects"
  ON workflow_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = workflow_status.project_id
      AND user_id = auth.uid()
    )
  );

-- Message Sent Policies
CREATE POLICY "Users can view messages of their projects"
  ON message_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = message_sent.project_id
      AND user_id = auth.uid()
    )
  );

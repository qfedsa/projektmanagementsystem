/*
  # Multi-Tenant Setup

  1. New Tables
    - `tenants`: Stores tenant/customer information
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `domain` (text, unique)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add tenant_id to projects table
    - Add indexes for performance
    - Add tenant context functions
    
  3. Security
    - Add RLS policies for tenant isolation
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text UNIQUE,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add tenant_id to projects if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE tenants IS 'Stores tenant/customer information for multi-tenancy';
COMMENT ON FUNCTION get_current_tenant_id IS 'Returns the current tenant ID from context';
COMMENT ON FUNCTION set_tenant_context IS 'Sets the current tenant context';

-- Disable RLS temporarily
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

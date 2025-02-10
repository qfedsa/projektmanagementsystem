-- Create tenants table
CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    domain text UNIQUE,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add tenant_id to projects
ALTER TABLE projects 
ADD COLUMN tenant_id uuid REFERENCES tenants(id);

-- Create index for better query performance
CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
  -- This can be extended to get tenant from request headers/JWT claims
  RETURN current_setting('app.tenant_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for projects
CREATE POLICY "Tenant isolation for projects"
ON projects
USING (tenant_id = get_current_tenant_id());

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tenants IS 'Stores tenant/customer information for multi-tenancy';
COMMENT ON FUNCTION get_current_tenant_id IS 'Returns the current tenant ID from context';
COMMENT ON FUNCTION set_tenant_context IS 'Sets the current tenant context';

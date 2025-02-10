import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with tenant support
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
});

// Tenant management functions
export const tenantApi = {
  // Create a new tenant
  async createTenant(name: string, domain: string) {
    return await supabase
      .from('tenants')
      .insert([{ name, domain }])
      .select()
      .single();
  },

  // Get tenant by domain
  async getTenantByDomain(domain: string) {
    return await supabase
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .single();
  },

  // Get current tenant ID from session
  async getCurrentTenantId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.user_metadata?.tenant_id;
  }
};

// Enhanced query helper with tenant context
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    allowEmpty?: boolean;
    errorMessage?: string;
  } = {}
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await queryFn();

    if (!result.data && !options.allowEmpty) {
      return {
        data: null,
        error: new Error(options.errorMessage || 'Keine Daten gefunden')
      };
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return {
        data: null,
        error: result.error
      };
    }

    return result;
  } catch (err) {
    console.error('Query error:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Ein unerwarteter Fehler ist aufgetreten')
    };
  }
}

// Helper function to set up a new customer
export async function setupNewCustomer(name: string, domain: string, adminEmail: string) {
  try {
    // 1. Create tenant
    const { data: tenant, error: tenantError } = await tenantApi.createTenant(name, domain);
    if (tenantError) throw tenantError;

    // 2. Create admin user
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: generateTempPassword(), // Implement this function
      options: {
        data: {
          tenant_id: tenant.id,
          role: 'admin'
        }
      }
    });
    if (authError) throw authError;

    return {
      success: true,
      tenant,
      auth
    };
  } catch (error) {
    console.error('Error setting up customer:', error);
    return {
      success: false,
      error
    };
  }
}

// Helper function to generate temporary password
function generateTempPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

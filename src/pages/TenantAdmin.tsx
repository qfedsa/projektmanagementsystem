import React, { useState } from 'react';
import { Building2, Loader2, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function TenantAdmin() {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPassword(null);

    try {
      // Generate a secure password
      const password = generateSecurePassword();
      
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name, domain }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create user account
      const { error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          tenant_id: tenant.id,
          role: 'admin'
        }
      });

      if (authError) throw authError;

      setSuccess('Mandant wurde erfolgreich angelegt!');
      setGeneratedPassword(password);
      setName('');
      setDomain('');
      setAdminEmail('');
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Zugangsdaten wurden in die Zwischenablage kopiert!');
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Building2 className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Neuen Mandanten anlegen</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Firmenname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="z.B. Musterbau GmbH"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="z.B. musterbau.de"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Admin E-Mail
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="admin@musterbau.de"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mandant wird angelegt...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 mr-2" />
              Mandant anlegen
            </>
          )}
        </button>
      </form>

      {generatedPassword && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
          <h3 className="font-bold mb-2">Zugangsdaten für den neuen Mandanten:</h3>
          <div className="space-y-2">
            <p><strong>E-Mail:</strong> {adminEmail}</p>
            <p><strong>Passwort:</strong> {generatedPassword}</p>
            <button
              onClick={() => copyToClipboard(`E-Mail: ${adminEmail}\nPasswort: ${generatedPassword}`)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Copy className="w-4 h-4 mr-1" />
              Zugangsdaten kopieren
            </button>
          </div>
          <p className="mt-4 text-sm">
            Bitte speichern oder kopieren Sie diese Zugangsdaten und teilen Sie sie sicher mit dem Mandanten mit.
            Die Zugangsdaten werden aus Sicherheitsgründen nur einmal angezeigt.
          </p>
        </div>
      )}
    </div>
  );
}

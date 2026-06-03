import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LoginLayout } from '@/components/auth/LoginLayout';

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login('admin', { password });
    if (ok) navigate('/admin/dashboard');
  };

  return (
    <LoginLayout cardTitle="Administrator Login" cardSubtitle="Enter your admin password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin_password" className="block text-sm font-medium text-slate-700">Password</label>
          <input
            id="admin_password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="Enter password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={!password}>Login</Button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to main login</Link>
      </div>
    </LoginLayout>
  );
}

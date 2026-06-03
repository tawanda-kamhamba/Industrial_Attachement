import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LoginLayout } from '@/components/auth/LoginLayout';
import { SupervisorSignupForm } from './SupervisorSignupForm';

export function SupervisorLoginPage() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login('supervisor', { staffId, password });
    if (ok) navigate('/supervisor/dashboard');
  };

  return (
    <div className="relative min-h-screen">
      <LoginLayout
        cardTitle="Institutional Supervisor Login"
        cardSubtitle="Staff ID and password"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff_id" className="block text-sm font-medium text-slate-700">Staff ID</label>
            <input
              id="staff_id"
              type="text"
              value={staffId}
              onChange={(e) => { setStaffId(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Staff ID"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={!staffId.trim() || !password}>Login</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="text-primary-600 hover:underline transition-colors"
          >
            Need an account? Sign up
          </button>
          <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to main login</Link>
        </div>
      </LoginLayout>

      {showSignup && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSignup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="supervisor-signup-title"
        >
          <div className="flex max-h-[min(90vh,720px)] w-full max-w-md flex-col rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700/80 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-300/80">
                  Institutional supervisor sign up
                </p>
                <h2 id="supervisor-signup-title" className="mt-0.5 text-lg font-display font-semibold text-slate-50">
                  Create your account
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  All fields are required and appear in the admin Registered lecturers list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="ml-3 shrink-0 rounded-full border border-slate-600/70 bg-slate-800/70 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close signup"
              >
                <span className="block leading-none text-lg">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-slate-200">
              <SupervisorSignupForm variant="dark" onCancel={() => setShowSignup(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

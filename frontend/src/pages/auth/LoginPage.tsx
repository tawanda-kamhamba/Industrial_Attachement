import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LoginLayout } from '@/components/auth/LoginLayout';
import { StudentSignupForm } from './StudentSignupForm';

export function LoginPage() {
  const [indexNumber, setIndexNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login('student', { indexNumber: indexNumber || undefined, password });
    if (ok) navigate('/student');
  };

  return (
    <div className="relative min-h-screen">
      <LoginLayout
        cardTitle="Student Login"
        cardSubtitle="IASMS - Industrial Attachment Management"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="index" className="block text-sm font-medium text-slate-700">Index Number</label>
            <input
              id="index"
              type="text"
              value={indexNumber}
              onChange={(e) => { setIndexNumber(e.target.value); clearError(); }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. 04/2014/0001D"
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
          <Button type="submit" className="w-full" disabled={!indexNumber.trim() || !password}>Login</Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="text-primary-600 hover:underline transition-colors"
          >
            New here? Sign up
          </button>
          <div className="flex gap-4">
            <Link to="/admin/login" className="text-primary-600 hover:underline">Admin login</Link>
            <Link to="/supervisor/login" className="text-primary-600 hover:underline">Supervisor login</Link>
          </div>
        </div>
      </LoginLayout>

      {showSignup && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSignup(false)}
        >
          <div className="w-full max-w-md px-4 pb-8 animate-slide-up">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-700/80 px-6 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-300/80">Student sign up</p>
                  <h2 className="mt-0.5 text-lg font-display font-semibold text-slate-50">Create your account</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="rounded-full border border-slate-600/70 bg-slate-800/70 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  aria-label="Close signup"
                >
                  <span className="block leading-none text-lg">×</span>
                </button>
              </div>
              <div className="px-6 py-5 text-slate-200">
                <StudentSignupForm onCancel={() => setShowSignup(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

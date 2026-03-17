import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

const SUPERVISOR_UNLOCK_KEY = 'supervisor_unlocked_';

export function SupervisorAssessmentLoginPage() {
  const location = useLocation();
  const pathname = location.pathname;
  const type = pathname.includes('/company') ? 'company' : pathname.includes('/visiting') ? 'visiting' : undefined;
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isVisiting = type === 'visiting';
  const title = isVisiting ? 'Visiting Supervisor' : 'Company Supervisor';
  const subtitle = isVisiting
    ? 'Enter the visiting supervisor password to assess this student.'
    : 'Enter the company supervisor password to assess this student.';

  if (type !== 'visiting' && type !== 'company') {
    navigate('/student', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/student/supervisor/verify', {
        type,
        password,
      });
      if (res.success) {
        sessionStorage.setItem(`${SUPERVISOR_UNLOCK_KEY}${type}`, '1');
        navigate(`/student/supervisor/${type}/grade`, { replace: true });
      } else {
        setError(res.error ?? 'Invalid password');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">← Back to dashboard</Link>
      </div>
      <Card className="border-0 shadow-xl" padding="lg">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-display font-semibold text-slate-800">{title} login</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Enter supervisor password"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={!password.trim() || loading}>
            {loading ? 'Verifying…' : 'Continue to assessment'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

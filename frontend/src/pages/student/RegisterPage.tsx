import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

const PROGRAMMES = [
  '',
  'Accountancy',
  'Applied Mathematics',
  'Building Technology',
  'Civil Engineering',
  'Computer Science',
  'Computer Networking',
  'Electrical/Electronic Engineering',
  'Hospitality',
  'Liberal Studies',
  'Marketing',
  'Purchasing & Supply',
  'Secretaryship',
];

const SESSIONS = ['', ' August', 'December', 'January'];
const FACULTIES = ['', 'AGR', 'ARTS', 'COM', 'CIE', 'EDU', 'ENG', 'LAW', 'MED', 'SCI', 'SOC', 'VET'];
const LEVELS = ['', '1', '2', '3'];

interface RegistrationData {
  registered: boolean;
  first_name?: string;
  last_name?: string;
  index_number?: string;
  other_name?: string;
  programme?: string;
  level?: string;
  session?: string;
  faculty?: string;
}

type StatusType = 'idle' | 'success' | 'error';

export function RegisterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RegistrationData | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    other_name: '',
    programme: '',
    level: '',
    session: '',
    faculty: '',
  });

  useEffect(() => {
    api
      .get<RegistrationData>('/student/registration')
      .then((res) => {
        setData(res);
        if (res.registered && res.other_name !== undefined) {
          setForm({
            other_name: res.other_name ?? '',
            programme: res.programme ?? '',
            level: res.level ?? '',
            session: res.session ?? '',
            faculty: res.faculty ?? '',
          });
        }
      })
      .catch(() => setData({ registered: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus('idle');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.programme || !form.level || !form.session || !form.faculty) {
      setStatus('error');
      setMessage('Please select programme, level, session and faculty.');
      return;
    }
    setSubmitting(true);
    setStatus('idle');
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; error?: string; message?: string; registered?: boolean }>(
        '/student/registration',
        form
      );
      if (res.success) {
        setStatus('success');
        setMessage(res.message ?? 'Registration submitted successfully.');
        setData((prev) => (prev ? { ...prev, registered: true } : { registered: true }));
        window.dispatchEvent(new Event('studentOnboardingUpdated'));
      } else {
        setStatus('error');
        setMessage(res.error ?? 'Registration failed.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Request failed.';
      setStatus('error');
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusClasses =
    status === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : status === 'error'
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';

  if (loading) {
    return (
      <div className="space-y-8">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
        <p className="text-slate-500">Loading registration…</p>
      </div>
    );
  }

  const registered = data?.registered ?? false;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-display font-bold tracking-tight md:text-3xl">
          Industrial Registration
        </h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm md:text-base">
          Register for industrial attachment. Complete the form below with your programme, level, session and faculty.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>{message}</div>
      )}

      {registered ? (
        <Card padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Registration complete</h2>
          <p className="mt-2 text-slate-600">
            You have already registered for industrial attachment. You can now submit your{' '}
            <Link to="/student/assumption" className="text-primary-600 hover:underline">
              Assumption of Duty form
            </Link>
            .
          </p>
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p><strong>Programme:</strong> {data?.programme}</p>
            <p><strong>Level:</strong> {data?.level}</p>
            <p><strong>Session:</strong> {data?.session}</p>
            <p><strong>Faculty:</strong> {data?.faculty}</p>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="page-stack">
          <Card padding="lg" className="bg-white space-y-6">
            <h2 className="text-base font-semibold text-slate-800">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">First name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={data?.first_name ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Last name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={data?.last_name ?? ''}
                  disabled
                />
              </div>
            </div>
            <div>
              <label htmlFor="other_name" className="block text-sm font-medium text-slate-700">
                Other name(s)
              </label>
              <input
                id="other_name"
                name="other_name"
                type="text"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Optional"
                value={form.other_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="programme" className="block text-sm font-medium text-slate-700">
                Programme <span className="text-red-500">*</span>
              </label>
              <select
                id="programme"
                name="programme"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={form.programme}
                onChange={handleChange}
              >
                <option value="">— Select programme —</option>
                {PROGRAMMES.filter(Boolean).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-700">
                  Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="level"
                  name="level"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={form.level}
                  onChange={handleChange}
                >
                  <option value="">— Select level —</option>
                  {LEVELS.filter(Boolean).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="session" className="block text-sm font-medium text-slate-700">
                  Session <span className="text-red-500">*</span>
                </label>
                <select
                  id="session"
                  name="session"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  value={form.session}
                  onChange={handleChange}
                >
                  <option value="">— Select session —</option>
                  {SESSIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-slate-700">
                Faculty <span className="text-red-500">*</span>
              </label>
              <select
                id="faculty"
                name="faculty"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={form.faculty}
                onChange={handleChange}
              >
                <option value="">— Select faculty —</option>
                {FACULTIES.filter(Boolean).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit registration'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

const REGIONS = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
];

interface StudentInfo {
  first_name: string;
  last_name: string;
  other_name: string;
  programme: string;
  level: string;
  session: string;
  index_number: string;
}

interface AssumptionData {
  company_name: string;
  supervisor_name: string;
  supervisor_contact: string;
  supervisor_email: string;
  company_region: string;
  company_address: string;
}

interface AssumptionResponse {
  registered: boolean;
  student?: StudentInfo;
  submitted?: boolean;
  assumption?: AssumptionData | null;
  error?: string;
}

type StatusType = 'idle' | 'success' | 'error';

export function SubmitAssumptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [assumption, setAssumption] = useState<AssumptionData | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<AssumptionData>({
    company_name: '',
    supervisor_name: '',
    supervisor_contact: '',
    supervisor_email: '',
    company_region: '',
    company_address: '',
  });

  useEffect(() => {
    api
      .get<AssumptionResponse>('/student/assumption')
      .then((res) => {
        if (!res.registered) {
          setRegistered(false);
          setLoading(false);
          return;
        }
        setRegistered(true);
        setStudent(res.student ?? null);
        setSubmitted(res.submitted ?? false);
        if (res.assumption) {
          setAssumption(res.assumption);
          setForm(res.assumption);
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !registered) {
      navigate('/student/register', { replace: true });
    }
  }, [loading, registered, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus('idle');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof AssumptionData)[] = [
      'company_name',
      'supervisor_name',
      'supervisor_contact',
      'supervisor_email',
      'company_region',
      'company_address',
    ];
    const missing = required.filter((k) => !form[k]?.trim());
    if (missing.length > 0) {
      setStatus('error');
      setMessage('Please fill in all company and supervisor fields.');
      return;
    }
    setSubmitting(true);
    setStatus('idle');
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; error?: string; message?: string }>(
        '/student/assumption',
        form
      );
      if (res.success) {
        setStatus('success');
        setMessage(res.message ?? 'Assumption of duty form submitted successfully.');
        setSubmitted(true);
        setAssumption(form);
      } else {
        setStatus('error');
        setMessage(res.error ?? 'Submission failed.');
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
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!registered) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-display font-bold tracking-tight md:text-3xl">
          Assumption of Duty Form
        </h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm md:text-base">
          Submit your company and supervisor details for industrial attachment. Complete the form below.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>{message}</div>
      )}

      {submitted ? (
        <Card padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Form submitted</h2>
          <p className="mt-2 text-slate-600">
            You have already submitted your assumption of duty form.
          </p>
          {assumption && (
            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <p><strong>Company:</strong> {assumption.company_name}</p>
              <p><strong>Supervisor:</strong> {assumption.supervisor_name}</p>
              <p><strong>Contact:</strong> {assumption.supervisor_contact}</p>
              <p><strong>Email:</strong> {assumption.supervisor_email}</p>
              <p><strong>Province:</strong> {assumption.company_region}</p>
              <p><strong>Address:</strong> {assumption.company_address}</p>
            </div>
          )}
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card padding="lg" className="bg-white space-y-6">
            <h2 className="text-base font-semibold text-slate-800">Student information</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">First name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={student?.first_name ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Last name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={student?.last_name ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Other name(s)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={student?.other_name ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Programme</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={student?.programme ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Index number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={student?.index_number ?? ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Session / Level</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                  value={[student?.session, student?.level].filter(Boolean).join(' / ')}
                  disabled
                />
              </div>
            </div>
          </Card>

          <Card padding="lg" className="bg-white space-y-6">
            <h2 className="text-base font-semibold text-slate-800">Company information</h2>
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-slate-700">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Enter company name"
                value={form.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="supervisor_name" className="block text-sm font-medium text-slate-700">
                  Supervisor&apos;s name <span className="text-red-500">*</span>
                </label>
                <input
                  id="supervisor_name"
                  name="supervisor_name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter supervisor name"
                  value={form.supervisor_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="supervisor_contact" className="block text-sm font-medium text-slate-700">
                  Supervisor&apos;s contact <span className="text-red-500">*</span>
                </label>
                <input
                  id="supervisor_contact"
                  name="supervisor_contact"
                  type="text"
                  required
                  maxLength={15}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Phone number"
                  value={form.supervisor_contact}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="supervisor_email" className="block text-sm font-medium text-slate-700">
                Supervisor&apos;s email <span className="text-red-500">*</span>
              </label>
              <input
                id="supervisor_email"
                name="supervisor_email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="email@example.com"
                value={form.supervisor_email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="company_region" className="block text-sm font-medium text-slate-700">
                Company province <span className="text-red-500">*</span>
              </label>
              <select
                id="company_region"
                name="company_region"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={form.company_region}
                onChange={handleChange}
              >
                <option value="">— Select province —</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="company_address" className="block text-sm font-medium text-slate-700">
                Company address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="company_address"
                name="company_address"
                required
                rows={3}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Full address"
                value={form.company_address}
                onChange={handleChange}
              />
            </div>
            <div className="pt-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit assumption of duty'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}

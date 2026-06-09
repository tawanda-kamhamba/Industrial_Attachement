import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Send } from 'lucide-react';
import { BackToDashboardLink } from '@/components/student/BackToDashboardLink';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';
import { Link } from 'react-router-dom';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  company: 'Company / workplace',
  logbook: 'E-logbook',
  assessment: 'Assessment / grading',
  supervisor_visit: 'Supervisor visit',
  other: 'Other',
};

type IssueReport = {
  id: number;
  category: string;
  issue_message: string;
  status: string;
  created_at: string | null;
  acknowledged_at: string | null;
};

type PageData = {
  has_assigned_supervisor: boolean;
  supervisors: { lecturer_name: string; lecturer_department?: string }[];
  reports: IssueReport[];
  categories: string[];
};

export function StudentReportIssuePage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<PageData>('/student/supervisor-issues');
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/student/supervisor-issues', {
        message: trimmed,
        category,
      });
      if (!res.success) {
        setError(res.error ?? 'Could not submit.');
        return;
      }
      setMessage('');
      setCategory('general');
      setSuccessOpen(true);
      await load();
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2?.message ?? 'Could not submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack min-w-0">
      <BackToDashboardLink />

      <div className="hero-banner bg-gradient-to-br from-red-600 via-red-700 to-slate-900">
        <div className="relative flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <AlertTriangle className="h-6 w-6 text-white" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Need help?</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Report an issue</h1>
            <p className="mt-2 max-w-2xl text-sm text-red-100">
              Tell your assigned institutional supervisor about problems during attachment. Use the red submit
              button when something needs urgent attention.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="border border-slate-200 bg-white">
          <p className="text-sm text-slate-600">Loading…</p>
        </Card>
      ) : !data?.has_assigned_supervisor ? (
        <Card className="border border-amber-200 bg-amber-50/80">
          <p className="font-semibold text-amber-900">No supervisor assigned yet</p>
          <p className="mt-1 text-sm text-amber-800">
            You need an assigned institutional supervisor before you can report issues.
          </p>
          <Link to="/student/request-supervisor" className="mt-3 inline-block">
            <Button size="sm">Request a supervisor</Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="border border-slate-200 bg-white">
            <p className="text-sm font-medium text-slate-800">Reporting to</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {data.supervisors.map((s, i) => (
                <li key={i}>
                  <span className="font-medium text-slate-900">{s.lecturer_name}</span>
                  {s.lecturer_department ? ` · ${s.lecturer_department}` : ''}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border border-red-200 bg-white">
            <form onSubmit={(e) => submit(e).catch(() => undefined)} className="space-y-4">
              <div>
                <label htmlFor="page-issue-category" className="block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  id="page-issue-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  disabled={submitting}
                >
                  {(data.categories ?? []).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="page-issue-message" className="block text-sm font-medium text-slate-700">
                  Issue description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="page-issue-message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Describe the problem clearly: what happened, when, and what support you need…"
                  disabled={submitting}
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/25 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4" aria-hidden />
                {submitting ? 'Submitting…' : 'Submit issue report'}
              </button>
            </form>
          </Card>

          {(data.reports?.length ?? 0) > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800 font-display">Your reports</h2>
              <div className="space-y-3">
                {data.reports.map((r) => (
                  <Card key={r.id} className="border border-slate-200 bg-white" padding="sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                      {r.status === 'acknowledged' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          Open
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{r.issue_message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                      {r.acknowledged_at
                        ? ` · Acknowledged ${new Date(r.acknowledged_at).toLocaleString()}`
                        : ''}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <SuccessModal
        open={successOpen}
        title="Issue reported"
        message="Your supervisor has been notified and will follow up on your report."
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}

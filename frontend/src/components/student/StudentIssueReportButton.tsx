import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  company: 'Company / workplace',
  logbook: 'E-logbook',
  assessment: 'Assessment / grading',
  supervisor_visit: 'Supervisor visit',
  other: 'Other',
};

type IssuesMeta = {
  has_assigned_supervisor: boolean;
  categories: string[];
  supervisors: { lecturer_name: string }[];
};

export function StudentIssueReportButton() {
  const [meta, setMeta] = useState<IssuesMeta | null>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    api
      .get<IssuesMeta>('/student/supervisor-issues')
      .then(setMeta)
      .catch(() => setMeta(null));
  }, [successOpen]);

  if (!meta?.has_assigned_supervisor) {
    return null;
  }

  const supervisorNames = meta.supervisors.map((s) => s.lecturer_name).filter(Boolean).join(', ');

  const submit = async () => {
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
      setOpen(false);
      setMessage('');
      setCategory('general');
      setSuccessOpen(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Could not submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:right-6"
        aria-label="Report an issue to your supervisor"
        title="Report issue to supervisor"
      >
        <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Report issue</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-report-title"
          onClick={() => {
            if (!submitting) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="issue-report-title" className="text-lg font-semibold text-slate-900">
                  Report an issue
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Sent to your assigned supervisor{supervisorNames ? `: ${supervisorNames}` : ''}.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                onClick={() => !submitting && setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label htmlFor="issue-category" className="block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  id="issue-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  disabled={submitting}
                >
                  {(meta.categories ?? Object.keys(CATEGORY_LABELS)).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="issue-message" className="block text-sm font-medium text-slate-700">
                  Describe the issue <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="issue-message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Explain what you are facing so your supervisor can help…"
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Link
                  to="/student/report-issue"
                  className="text-center text-xs text-slate-500 hover:text-primary-600 sm:text-left"
                  onClick={() => setOpen(false)}
                >
                  View past reports
                </Link>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <button
                    type="button"
                    onClick={() => submit().catch(() => undefined)}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {submitting ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SuccessModal
        open={successOpen}
        title="Issue reported"
        message="Your supervisor has been notified. They will review your report in the Student issues section."
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}

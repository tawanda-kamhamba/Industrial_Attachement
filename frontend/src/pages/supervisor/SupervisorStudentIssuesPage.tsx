import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchField } from '@/components/ui/SearchField';
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

type Issue = {
  id: number;
  student_index_number: string;
  student_name: string;
  category: string;
  issue_message: string;
  status: string;
  created_at: string | null;
  acknowledged_at: string | null;
};

export function SupervisorStudentIssuesPage() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [acting, setActing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ open_count: number; issues: Issue[] }>('/supervisor/student-issues');
      setIssues(res.issues ?? []);
      setOpenCount(res.open_count ?? 0);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter((i) => {
      const hay = [i.student_name, i.student_index_number, i.issue_message, i.category].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [issues, query]);

  const selected = filtered.find((i) => i.id === selectedId) ?? issues.find((i) => i.id === selectedId) ?? null;

  const acknowledge = async (id: number) => {
    setActing(true);
    try {
      await api.post('/supervisor/student-issues', { issue_id: id });
      setSuccessOpen(true);
      await load();
      setSelectedId(id);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="page-stack min-w-0">
      <div className="hero-banner bg-gradient-to-br from-red-600 via-slate-800 to-slate-900">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Student support</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Student issues</h1>
          <p className="mt-2 max-w-2xl text-sm text-red-100">
            Reports from your assigned students. Acknowledge when you have seen and started handling an issue.
          </p>
          {openCount > 0 ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {openCount} open
            </p>
          ) : null}
        </div>
      </div>

      <Card className="border border-slate-200 bg-white">
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student, index, message…"
          aria-label="Search issues"
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : filtered.length === 0 ? (
            <Card className="border border-slate-200 bg-white">
              <p className="text-sm text-slate-600">No issue reports from your students.</p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {filtered.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(i.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId === i.id
                        ? 'border-red-300 bg-red-50/50 ring-1 ring-red-200'
                        : 'border-slate-200 bg-white hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{i.student_name}</p>
                        <p className="text-xs text-slate-500">{i.student_index_number}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{i.issue_message}</p>
                      </div>
                      {i.status === 'open' ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Open
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Done
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex min-h-[240px] items-center justify-center border border-dashed border-slate-300 bg-slate-50/50">
              <p className="text-sm text-slate-500">Select a report to read the full message.</p>
            </Card>
          ) : (
            <Card className="border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 font-display">{selected.student_name}</h2>
                  <p className="text-sm text-slate-600">{selected.student_index_number}</p>
                  <Link
                    to={`/supervisor/student/${encodeURIComponent(selected.student_index_number)}`}
                    className="mt-1 inline-block text-sm font-medium text-primary-600 hover:underline"
                  >
                    View student profile
                  </Link>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {CATEGORY_LABELS[selected.category] ?? selected.category}
                </span>
              </div>

              <blockquote className="mt-4 rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap">
                {selected.issue_message}
              </blockquote>

              <p className="mt-3 text-xs text-slate-500">
                Reported {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}
                {selected.acknowledged_at
                  ? ` · Acknowledged ${new Date(selected.acknowledged_at).toLocaleString()}`
                  : ''}
              </p>

              {selected.status === 'open' ? (
                <div className="mt-4">
                  <Button
                    onClick={() => acknowledge(selected.id).catch(() => undefined)}
                    disabled={acting}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {acting ? 'Saving…' : 'Mark as acknowledged'}
                  </Button>
                </div>
              ) : (
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Acknowledged
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      <SuccessModal
        open={successOpen}
        title="Acknowledged"
        message="This issue has been marked as acknowledged."
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}

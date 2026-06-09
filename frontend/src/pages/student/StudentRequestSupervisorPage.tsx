import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Search,
  Send,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { BackToDashboardLink } from '@/components/student/BackToDashboardLink';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchField } from '@/components/ui/SearchField';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';

type Supervisor = {
  id: number;
  lecturer_name: string;
  lecturer_faculty: string;
  lecturer_department: string;
  lecturer_region_residence: string;
  staff_id: string | null;
};

type AssignmentRequest = {
  id: number;
  lecturer_id: number;
  lecturer_name: string;
  student_message: string | null;
  status: string;
  response_reason: string | null;
  created_at: string | null;
  responded_at: string | null;
};

type RequestsResponse = {
  has_direct_assignment: boolean;
  can_request: boolean;
  can_request_reason: string | null;
  supervisors: Supervisor[];
  pending_request: AssignmentRequest | null;
  requests: AssignmentRequest[];
};

export function StudentRequestSupervisorPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RequestsResponse | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<RequestsResponse>('/student/supervisor-requests');
      setData(res);
    } catch {
      setData(null);
      setError('Could not load supervisors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const list = data?.supervisors ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => {
      const hay = [
        s.lecturer_name,
        s.lecturer_faculty,
        s.lecturer_department,
        s.lecturer_region_residence,
        s.staff_id ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data?.supervisors, query]);

  const selected = filtered.find((s) => s.id === selectedId) ?? null;

  const submitRequest = async () => {
    if (!selectedId || !data?.can_request) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; error?: string; lecturer_name?: string }>(
        '/student/supervisor-requests',
        { lecturer_id: selectedId, message: message.trim() || undefined }
      );
      if (!res.success) {
        setError(res.error ?? 'Request failed.');
        return;
      }
      setSuccessText(
        `Your request was sent to ${res.lecturer_name ?? 'the supervisor'}. You will be notified when they respond.`
      );
      setSuccessOpen(true);
      setSelectedId(null);
      setMessage('');
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          <Clock className="h-3 w-3" aria-hidden />
          Pending
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        <XCircle className="h-3 w-3" aria-hidden />
        Declined
      </span>
    );
  };

  return (
    <div className="page-stack min-w-0">
      <BackToDashboardLink />

      <div className="hero-banner bg-gradient-to-br from-violet-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Institutional supervisor</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Request a supervisor</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-100">
            Browse available visiting supervisors and send a direct assignment request. Only students without an
            assigned supervisor can submit a request.
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="border border-slate-200 bg-white">
          <p className="text-sm text-slate-600">Loading…</p>
        </Card>
      ) : data?.has_direct_assignment ? (
        <Card className="border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-emerald-900">You already have a supervisor</p>
              <p className="mt-1 text-sm text-emerald-800">
                Your institutional supervisor is assigned. Return to the dashboard to see their details.
              </p>
              <Link to="/student" className="mt-3 inline-block">
                <Button size="sm">Back to dashboard</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {data?.pending_request ? (
            <Card className="border border-amber-200 bg-amber-50/80">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Request pending</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Waiting for <span className="font-medium">{data.pending_request.lecturer_name}</span> to
                    approve or decline your request.
                  </p>
                  {data.pending_request.created_at ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Sent {new Date(data.pending_request.created_at).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                {statusBadge('pending')}
              </div>
            </Card>
          ) : !data?.can_request && data?.can_request_reason ? (
            <Card className="border border-amber-200 bg-amber-50/80">
              <p className="text-sm font-semibold text-amber-900">Cannot send a request yet</p>
              <p className="mt-1 text-sm text-amber-800">{data.can_request_reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/student/register">
                  <Button variant="outline" size="sm">
                    Registration
                  </Button>
                </Link>
                <Link to="/student/assumption">
                  <Button variant="outline" size="sm">
                    Assumption of duty
                  </Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {data?.can_request ? (
            <>
              <Card className="border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <label className="text-sm font-medium text-slate-700">Search supervisors</label>
                    <div className="mt-1.5">
                      <SearchField
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Name, faculty, department, region…"
                        aria-label="Search supervisors"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 shrink-0">
                    <Search className="mr-1 inline h-4 w-4 opacity-60" aria-hidden />
                    {filtered.length} supervisor{filtered.length === 1 ? '' : 's'}
                  </p>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filtered.map((s) => {
                  const active = selectedId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(active ? null : s.id)}
                      className={`group rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-primary-400 bg-primary-50/50 ring-2 ring-primary-200'
                          : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-base font-semibold text-slate-900 group-hover:text-primary-700">
                            {s.lecturer_name}
                          </p>
                          {s.staff_id ? (
                            <p className="mt-0.5 text-xs text-slate-500">Staff ID: {s.staff_id}</p>
                          ) : null}
                        </div>
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <UserCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                          {[s.lecturer_department, s.lecturer_faculty].filter(Boolean).join(' · ') || '—'}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                          {s.lecturer_region_residence || 'Region not listed'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <Card className="border border-slate-200 bg-white text-center">
                  <p className="text-sm text-slate-600">No supervisors match your search.</p>
                </Card>
              ) : null}

              {selected ? (
                <Card className="border border-primary-200 bg-gradient-to-br from-white to-primary-50/30">
                  <h2 className="text-lg font-semibold text-slate-900">Send request to {selected.lecturer_name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Optional: add a short note about your programme, company, or why you chose this supervisor.
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="e.g. I am attached in Harare, Faculty of Engineering…"
                    disabled={submitting}
                  />
                  {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => submitRequest().catch(() => undefined)} disabled={submitting} className="gap-2">
                      <Send className="h-4 w-4" aria-hidden />
                      {submitting ? 'Sending…' : 'Send request'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedId(null)} disabled={submitting}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {(data?.requests?.length ?? 0) > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800 font-display">Your request history</h2>
              <div className="space-y-3">
                {data?.requests.map((r) => (
                  <Card key={r.id} className="border border-slate-200 bg-white" padding="sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{r.lecturer_name}</p>
                        {r.student_message ? (
                          <p className="mt-1 text-sm text-slate-600">{r.student_message}</p>
                        ) : null}
                        {r.status === 'rejected' && r.response_reason ? (
                          <p className="mt-2 text-sm text-red-700">
                            <span className="font-medium">Reason:</span> {r.response_reason}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                      {statusBadge(r.status)}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <SuccessModal open={successOpen} message={successText} title="Request sent" onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

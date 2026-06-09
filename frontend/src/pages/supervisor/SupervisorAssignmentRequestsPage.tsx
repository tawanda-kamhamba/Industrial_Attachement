import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchField } from '@/components/ui/SearchField';
import { RejectReasonDialog } from '@/components/ui/RejectReasonDialog';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';

type RequestSummary = {
  id: number;
  student_index_number: string;
  student_name: string;
  student_message: string | null;
  status: string;
  response_reason: string | null;
  created_at: string | null;
  responded_at: string | null;
  programme: string | null;
  faculty: string | null;
  company_name: string | null;
  company_region: string | null;
};

type Registration = {
  first_name?: string;
  last_name?: string;
  other_name?: string;
  index_number?: string;
  programme?: string;
  level?: string;
  session?: string;
  faculty?: string;
  attachment_region?: string;
  registration_date?: string;
};

type Assumption = {
  company_name?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  supervisor_email?: string;
  company_region?: string;
  company_address?: string;
  assumption_date?: string;
};

type RequestDetailResponse = {
  request: RequestSummary & { lecturer_name?: string };
  student: {
    student_name: string;
    registration: Registration | null;
    assumption: Assumption | null;
  } | null;
};

type ListResponse = {
  pending_count: number;
  requests: RequestSummary[];
};

export function SupervisorAssignmentRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<RequestSummary[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RequestDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successText, setSuccessText] = useState('');

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get<ListResponse>('/supervisor/assignment-requests');
      setList(res.requests ?? []);
      setPendingCount(res.pending_count ?? 0);
    } catch {
      setList([]);
      setError('Could not load requests.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await api.get<RequestDetailResponse>(`/supervisor/assignment-requests/${id}`);
      setDetail(res);
    } catch {
      setDetail(null);
      setError('Could not load student details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId).catch(() => undefined);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.student_name,
        r.student_index_number,
        r.programme ?? '',
        r.faculty ?? '',
        r.company_name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [list, query]);

  const respond = async (action: 'approve' | 'reject', reason?: string) => {
    if (!selectedId) return;
    setActing(true);
    setError(null);
    try {
      const res = await api.post<{ success: boolean; error?: string; status?: string }>(
        '/supervisor/assignment-requests',
        { request_id: selectedId, action, reason }
      );
      if (!res.success) {
        setError(res.error ?? 'Action failed.');
        return;
      }
      setSuccessText(
        action === 'approve'
          ? 'The student is now assigned to you. They have been notified.'
          : 'The request was declined. The student has been notified with your reason.'
      );
      setSuccessOpen(true);
      setRejectOpen(false);
      setSelectedId(null);
      await loadList();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Action failed.');
    } finally {
      setActing(false);
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
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        <XCircle className="h-3 w-3" aria-hidden />
        Declined
      </span>
    );
  };

  const reg = detail?.student?.registration;
  const asm = detail?.student?.assumption;
  const isPending = detail?.request?.status === 'pending';

  return (
    <div className="page-stack min-w-0">
      <div className="hero-banner bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Student assignments</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Assignment requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-100">
            Review registration and assumption details, then approve or decline with a reason.
          </p>
          {pendingCount > 0 ? (
            <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
              {pendingCount} pending
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 bg-white">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, index, company…"
              aria-label="Search requests"
            />
          </Card>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Loading…</p>
          ) : filtered.length === 0 ? (
            <Card className="mt-4 border border-slate-200 bg-white">
              <p className="text-sm text-slate-600">No assignment requests yet.</p>
            </Card>
          ) : (
            <ul className="mt-4 space-y-2">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId === r.id
                        ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-200'
                        : 'border-slate-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{r.student_name}</p>
                        <p className="text-xs text-slate-500">{r.student_index_number}</p>
                        {r.company_name ? (
                          <p className="mt-1 truncate text-xs text-slate-600">{r.company_name}</p>
                        ) : null}
                      </div>
                      {statusBadge(r.status)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selectedId ? (
            <Card className="flex min-h-[280px] items-center justify-center border border-dashed border-slate-300 bg-slate-50/50">
              <p className="text-sm text-slate-500">Select a request to review student details.</p>
            </Card>
          ) : detailLoading ? (
            <Card className="border border-slate-200 bg-white">
              <p className="text-sm text-slate-600">Loading details…</p>
            </Card>
          ) : detail ? (
            <div className="space-y-4">
              <Card className="border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 font-display">
                      {detail.student?.student_name ?? detail.request.student_name}
                    </h2>
                    <p className="text-sm text-slate-600">{detail.request.student_index_number}</p>
                    {detail.request.student_message ? (
                      <blockquote className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {detail.request.student_message}
                      </blockquote>
                    ) : null}
                  </div>
                  {statusBadge(detail.request.status)}
                </div>

                {detail.request.status === 'rejected' && detail.request.response_reason ? (
                  <p className="mt-3 text-sm text-red-700">
                    <span className="font-medium">Your reason:</span> {detail.request.response_reason}
                  </p>
                ) : null}
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="border border-slate-200 bg-white" padding="sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <GraduationCap className="h-4 w-4 text-primary-600" aria-hidden />
                    Registration
                  </h3>
                  {reg ? (
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-slate-500">Programme</dt>
                        <dd className="font-medium text-slate-900">{reg.programme ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Level / Session</dt>
                        <dd className="font-medium text-slate-900">
                          {[reg.level, reg.session].filter(Boolean).join(' · ') || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Faculty</dt>
                        <dd className="font-medium text-slate-900">{reg.faculty ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Attachment region</dt>
                        <dd className="font-medium text-slate-900">{reg.attachment_region ?? '—'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No registration record.</p>
                  )}
                </Card>

                <Card className="border border-slate-200 bg-white" padding="sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Building2 className="h-4 w-4 text-primary-600" aria-hidden />
                    Assumption of duty
                  </h3>
                  {asm ? (
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-slate-500">Company</dt>
                        <dd className="font-medium text-slate-900">{asm.company_name ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Region</dt>
                        <dd className="flex items-center gap-1 font-medium text-slate-900">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          {asm.company_region ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Company supervisor</dt>
                        <dd className="flex items-center gap-1 font-medium text-slate-900">
                          <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                          {asm.supervisor_name ?? '—'}
                        </dd>
                      </div>
                      {asm.supervisor_contact ? (
                        <div>
                          <dt className="text-slate-500">Contact</dt>
                          <dd className="flex items-center gap-1 text-slate-900">
                            <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {asm.supervisor_contact}
                          </dd>
                        </div>
                      ) : null}
                      {asm.supervisor_email ? (
                        <div>
                          <dt className="text-slate-500">Email</dt>
                          <dd className="flex items-center gap-1 text-slate-900">
                            <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {asm.supervisor_email}
                          </dd>
                        </div>
                      ) : null}
                      {asm.company_address ? (
                        <div>
                          <dt className="text-slate-500">Address</dt>
                          <dd className="text-slate-900">{asm.company_address}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No assumption submitted.</p>
                  )}
                </Card>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              {isPending ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => respond('approve').catch(() => undefined)}
                    disabled={acting}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {acting ? 'Processing…' : 'Approve & assign student'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={acting}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => setRejectOpen(true)}
                  >
                    Decline request
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <RejectReasonDialog
        open={rejectOpen}
        title="Decline assignment request"
        subjectLabel={detail?.student?.student_name ?? undefined}
        description="The student will see your reason in their portal and notifications."
        confirmLabel="Decline request"
        submitting={acting}
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => respond('reject', reason).catch(() => undefined)}
      />

      <SuccessModal
        open={successOpen}
        message={successText}
        title="Done"
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, apiBaseUrl } from '@/services/api';
import { ContractViewDownloadActions } from '@/components/ContractViewDownloadActions';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';
import { SearchField } from '@/components/ui/SearchField';

interface LecturerLite {
  id: number;
  lecturer_name: string;
  lecturer_faculty: string;
  lecturer_department: string;
  lecturer_region_residence: string;
  staff_id: string | null;
}

interface StudentSupervisorData {
  index_number: string;
  assigned: { lecturer_id: number; lecturer_name: string; staff_id: string | null } | null;
  lecturers: LecturerLite[];
}

interface StudentProfileData {
  index_number: string;
  registration: {
    first_name: string;
    last_name: string;
    other_name?: string;
    programme?: string;
    level?: string;
    session?: string;
    faculty?: string;
    date?: string;
    company_supervisor_name?: string;
    company_supervisor_contact?: string;
    attachment_region?: string;
    visiting_supervisor_grade?: string | null;
    company_supervisor_grade?: string | null;
  } | null;
  assumption: {
    company_name: string;
    supervisor_name: string;
    supervisor_contact: string;
    supervisor_email: string;
    company_region: string;
    company_address: string;
  } | null;
  contract: {
    /** Present when API returns normalized contract (required to open PDF). */
    id?: number;
    original_filename: string;
    status: string;
    submission_date: string | null;
    admin_comment?: string;
  } | null;
  orientation: { id: number; completed_at: string | null } | null;
  logbook: { count: number; latest_week: number | null };
  report_submitted: boolean;
  report_files?: string[];
  report_original_filenames?: string[];
}

function StatCard({
  title,
  value,
  unit,
  status,
  statusColor,
}: {
  title: string;
  value: string | number;
  unit?: string;
  status: string;
  statusColor: 'green' | 'red' | 'amber' | 'slate';
}) {
  const colorClass =
    statusColor === 'green'
      ? 'text-emerald-600'
      : statusColor === 'red'
        ? 'text-red-600'
        : statusColor === 'amber'
          ? 'text-amber-600'
          : 'text-slate-500';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {unit && <p className="text-xs text-slate-400">{unit}</p>}
      <p className={`mt-2 text-sm font-medium ${colorClass}`}>{status}</p>
    </div>
  );
}

export function AdminStudentProfilePage() {
  const { indexNumber } = useParams<{ indexNumber: string }>();
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supData, setSupData] = useState<StudentSupervisorData | null>(null);
  const [supLoading, setSupLoading] = useState(false);
  const [supError, setSupError] = useState<string | null>(null);
  const [supSaving, setSupSaving] = useState(false);
  const [supMessage, setSupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('');

  useEffect(() => {
    if (!indexNumber) return;
    api
      .get<StudentProfileData>(`/admin/student-profile/${encodeURIComponent(indexNumber)}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [indexNumber]);

  useEffect(() => {
    if (!indexNumber) return;
    setSupLoading(true);
    setSupError(null);
    api
      .get<StudentSupervisorData>(`/admin/student-supervisor/${encodeURIComponent(indexNumber)}`)
      .then((res) => {
        setSupData(res);
        setSelectedLecturerId(res.assigned ? String(res.assigned.lecturer_id) : '');
      })
      .catch((e) => setSupError(e instanceof Error ? e.message : 'Failed to load supervisors'))
      .finally(() => setSupLoading(false));
  }, [indexNumber]);

  const saveSupervisorAssignment = async () => {
    if (!indexNumber) return;
    setSupSaving(true);
    setSupMessage(null);
    try {
      await api.post('/admin/student-supervisor/assign', {
        index_number: indexNumber,
        lecturer_id: selectedLecturerId || null,
      });
      const refreshed = await api.get<StudentSupervisorData>(
        `/admin/student-supervisor/${encodeURIComponent(indexNumber)}`
      );
      setSupData(refreshed);
      setSelectedLecturerId(refreshed.assigned ? String(refreshed.assigned.lecturer_id) : '');
      setSupMessage({ type: 'success', text: 'Supervisor assignment saved.' });
    } catch (e) {
      setSupMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save assignment' });
    } finally {
      setSupSaving(false);
    }
  };

  if (!indexNumber) return <p className="text-slate-500">Missing student.</p>;
  if (loading) return <p className="text-slate-500">Loading profile…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const reg = data.registration;
  const assump = data.assumption;
  const contract = data.contract;
  const name = reg
    ? [reg.first_name, reg.last_name].filter(Boolean).join(' ') || 'Student'
    : 'Student';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const profilePhotoUrl = `${apiBaseUrl}/admin/student-profile/${encodeURIComponent(data.index_number)}/photo`;

  const contractStatus = !contract
    ? 'Not submitted'
    : contract.status === 'approved'
      ? 'Approved'
      : contract.status === 'rejected'
        ? 'Rejected'
        : 'Pending';
  const contractColor: 'green' | 'red' | 'amber' | 'slate' =
    !contract ? 'slate' : contract.status === 'approved' ? 'green' : contract.status === 'rejected' ? 'red' : 'amber';

  const contractFileId =
    contract &&
    Number.isInteger(Number(contract.id)) &&
    Number(contract.id) >= 1
      ? Number(contract.id)
      : null;

  return (
    <div className="page-stack min-w-0">
      <div className="page-header-row">
        <Link to="/admin/students" className="text-sm text-slate-600 hover:text-slate-900">
          ← Registered students
        </Link>
      </div>

      {/* Student profile card */}
      <Card padding="lg" className="overflow-hidden border-slate-200 bg-slate-50/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full bg-primary-100 text-2xl font-semibold text-primary-700">
              <img
                src={profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  const fallback = el.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <span className="flex h-full w-full items-center justify-center" style={{ display: 'none' }}>
                {initials}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">Index: {data.index_number}</p>
              <Link
                to={`/admin/logbook/${encodeURIComponent(data.index_number)}`}
                className="mt-3 inline-block"
              >
                <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                  View logbook
                </Button>
              </Link>
            </div>
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Programme</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{reg?.programme || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Level</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{reg?.level || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Session</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{reg?.session || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Faculty</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{reg?.faculty || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Region</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                {reg?.attachment_region || assump?.company_region || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Registered</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                {reg?.date ? new Date(reg.date).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Contract</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{contractStatus}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Visiting grade</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                {reg?.visiting_supervisor_grade != null && reg.visiting_supervisor_grade !== ''
                  ? String(reg.visiting_supervisor_grade)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Company grade</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                {reg?.company_supervisor_grade != null && reg.company_supervisor_grade !== ''
                  ? String(reg.company_supervisor_grade)
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* Student current status */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Student current status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Contract"
            value={contractStatus}
            status={
              !contract
                ? 'Not submitted'
                : contract.status === 'approved'
                  ? 'Approved'
                  : contract.status === 'rejected'
                    ? 'Rejected'
                    : 'Pending review'
            }
            statusColor={contractColor}
          />
          <StatCard
            title="Orientation"
            value={data.orientation ? 'Completed' : '—'}
            unit={data.orientation?.completed_at ? new Date(data.orientation.completed_at).toLocaleDateString() : ''}
            status={data.orientation ? 'In the norm' : 'Not completed'}
            statusColor={data.orientation ? 'green' : 'slate'}
          />
          <StatCard
            title="E-Logbook"
            value={data.logbook.count}
            unit="weeks"
            status={data.logbook.count > 0 ? 'On track' : 'No entries yet'}
            statusColor={data.logbook.count > 0 ? 'green' : 'slate'}
          />
          <StatCard
            title="Final report"
            value={data.report_submitted ? 'Submitted' : '—'}
            status={data.report_submitted ? 'Submitted' : 'Not submitted'}
            statusColor={data.report_submitted ? 'green' : 'slate'}
          />
        </div>
      </div>

      {/* Institutional supervisor (direct assignment) */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Institutional supervisor</h2>
        <Card padding="lg" className="border-slate-200">
          <CardHeader title="Assign a specific supervisor to this student" />

          {supMessage && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                supMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {supMessage.text}
            </div>
          )}

          {supLoading ? (
            <p className="text-slate-500">Loading supervisors…</p>
          ) : supError ? (
            <p className="text-red-600">{supError}</p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700">Search supervisor</label>
                  <SearchField
                    value={supervisorFilter}
                    onChange={(e) => setSupervisorFilter(e.target.value)}
                    className="mt-1"
                    placeholder="Type a name, faculty, region…"
                    aria-label="Search supervisor"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Select supervisor</label>
                  <select
                    value={selectedLecturerId}
                    onChange={(e) => setSelectedLecturerId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">— Not assigned —</option>
                    {(supData?.lecturers ?? [])
                      .filter((l) => {
                        const q = supervisorFilter.trim().toLowerCase();
                        if (!q) return true;
                        const hay = `${l.lecturer_name} ${l.lecturer_faculty} ${l.lecturer_department} ${l.lecturer_region_residence} ${
                          l.staff_id ?? ''
                        }`.toLowerCase();
                        return hay.includes(q);
                      })
                      .map((l) => (
                        <option key={l.id} value={String(l.id)}>
                          {l.lecturer_name} — {l.lecturer_faculty} — {l.lecturer_region_residence}
                          {l.staff_id ? ` (Staff ID: ${l.staff_id})` : ''}
                        </option>
                      ))}
                  </select>
                  <p className="mt-2 text-sm text-slate-500">
                    Current: <span className="font-medium text-slate-700">{supData?.assigned?.lecturer_name ?? '—'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <Button onClick={saveSupervisorAssignment} disabled={supSaving}>
                  {supSaving ? 'Saving…' : 'Save supervisor'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Placement & company details */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Placement & company details</h2>
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700">Company name</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Region</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Supervisor</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Contact</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Address</th>
                </tr>
              </thead>
              <tbody>
                {assump ? (
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{assump.company_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{assump.company_region || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{assump.supervisor_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{assump.supervisor_contact || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{assump.supervisor_email || '—'}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-700" title={assump.company_address}>
                      {assump.company_address || '—'}
                    </td>
                  </tr>
                ) : reg?.company_supervisor_name || reg?.company_supervisor_contact ? (
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-700">—</td>
                    <td className="px-4 py-3 text-slate-700">{reg.attachment_region || '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{reg.company_supervisor_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{reg.company_supervisor_contact || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">—</td>
                    <td className="px-4 py-3 text-slate-700">—</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No placement or company details yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Contract details (if submitted) */}
      {contract && (
        <Card padding="lg" className="border-slate-200 bg-slate-50/30">
          <CardHeader title="Contract details" />
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">File</dt>
              <dd className="font-medium text-slate-800">
                {contract.original_filename ? (
                  contractFileId != null ? (
                    <ContractViewDownloadActions
                      role="admin"
                      contractId={contractFileId}
                      fileLabel={contract.original_filename}
                      layout="stacked"
                      onError={(msg) => window.alert(msg)}
                    />
                  ) : (
                    <span className="text-sm text-amber-700">
                      Contract file is listed but the record id is invalid. Fix{' '}
                      <code className="text-xs">student_contracts.id</code> in the database (see{' '}
                      <code className="text-xs">sql/fix_student_contracts_ids.sql</code>).
                    </span>
                  )
                ) : (
                  '—'
                )}
              </dd>
            </div>
            {contract.submission_date && (
              <div>
                <dt className="text-xs text-slate-500">Submitted</dt>
                <dd className="font-medium text-slate-800">
                  {new Date(contract.submission_date).toLocaleString()}
                </dd>
              </div>
            )}
            {contract.admin_comment && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Comment</dt>
                <dd className="text-sm text-slate-700">{contract.admin_comment}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Report details (if submitted) */}
      {data.report_submitted && (data.report_files?.length ?? 0) > 0 && (
        <Card padding="lg" className="border-slate-200 bg-white">
          <CardHeader title="Report details" />
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Files</dt>
              <dd className="mt-1 flex flex-col gap-1">
                {(data.report_files ?? []).map((filename, idx) => {
                  const label = data.report_original_filenames?.[idx] ?? filename;
                  return (
                    <div key={`${filename}-${idx}`} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <ReportViewDownloadActions
                        role="admin"
                        storageFilename={filename}
                        displayLabel={label}
                        layout="actions-only"
                        onError={(msg) => window.alert(msg)}
                      />
                    </div>
                  );
                })}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}

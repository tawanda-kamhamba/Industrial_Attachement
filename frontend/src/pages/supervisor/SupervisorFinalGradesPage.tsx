import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { TableFilters } from '@/components/ui/TableFilters';
import { api } from '@/services/api';
import { filterRows, FINAL_GRADE_FILTER_FIELDS } from '@/utils/tableSearch';
import {
  type FinalGradesResponse,
  type FinalGradeStudent,
  componentLabel,
  computePreviewFinal,
  classGradeColor,
  scoreToClassGrade,
} from '@/lib/grading';

type DraftMarks = { elogbook: string; report: string };

function MarkInput({
  value,
  onChange,
  label,
  max = 100,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0–100"
        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-slate-800 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        aria-label={label}
      />
    </label>
  );
}

function ReadonlyScore({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return <span className="text-sm font-semibold tabular-nums text-slate-700">{value}</span>;
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">—</span>;
  }
  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${classGradeColor(grade)}`}
    >
      {grade}
    </span>
  );
}

export function SupervisorFinalGradesPage() {
  const [data, setData] = useState<FinalGradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftMarks>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const load = useCallback(() => {
    return api
      .get<FinalGradesResponse>('/supervisor/final-grades')
      .then((res) => {
        setData(res);
        const next: Record<string, DraftMarks> = {};
        for (const s of res.students) {
          next[s.student_index] = {
            elogbook: s.elogbook_mark != null ? String(s.elogbook_mark) : '',
            report: s.report_mark != null ? String(s.report_mark) : '',
          };
        }
        setDrafts(next);
      });
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [load]);

  const students = data?.students ?? [];
  const weights = data?.weights ?? {
    first_visit: 20,
    second_visit: 20,
    company: 20,
    report: 20,
    elogbook: 20,
  };

  const filtered = useMemo(() => {
    let list = students;
    if (filterBy === 'complete') list = list.filter((s) => s.is_complete);
    else if (filterBy === 'incomplete') list = list.filter((s) => !s.is_complete);
    else if (filterBy === 'pending_marks') {
      list = list.filter((s) => s.elogbook_mark == null || s.report_mark == null);
    }

    const textFilterBy = ['complete', 'incomplete', 'pending_marks'].includes(filterBy) ? 'all' : filterBy;
    return filterRows(list, search, textFilterBy, {
      student_name: (s) => `${s.first_name} ${s.last_name}`,
      index_number: (s) => s.student_index,
      company_name: (s) => s.company_name ?? '',
    });
  }, [students, search, filterBy]);

  const stats = useMemo(() => {
    const complete = students.filter((s) => s.is_complete);
    const avg =
      complete.length > 0
        ? Math.round((complete.reduce((a, s) => a + (s.final_mark ?? 0), 0) / complete.length) * 10) / 10
        : null;
    const pendingMarks = students.filter((s) => s.elogbook_mark == null || s.report_mark == null).length;
    return {
      total: students.length,
      complete: complete.length,
      avg,
      pendingMarks,
    };
  }, [students]);

  const saveRow = async (student: FinalGradeStudent) => {
    const draft = drafts[student.student_index];
    if (!draft) return;

    const elogbookVal = draft.elogbook.trim();
    const reportVal = draft.report.trim();

    if (elogbookVal === '' && reportVal === '') {
      setMessage({ type: 'error', text: 'Enter at least an e-logbook or report mark.' });
      return;
    }

    const parse = (v: string) => {
      if (v === '') return undefined;
      const n = Number(v);
      if (Number.isNaN(n) || n < 0 || n > 100) return null;
      return n;
    };

    const elogbook_mark = parse(elogbookVal);
    const report_mark = parse(reportVal);
    if (elogbookVal !== '' && elogbook_mark === null) {
      setMessage({ type: 'error', text: 'E-logbook mark must be between 0 and 100.' });
      return;
    }
    if (reportVal !== '' && report_mark === null) {
      setMessage({ type: 'error', text: 'Report mark must be between 0 and 100.' });
      return;
    }

    setMessage(null);
    setSaving(student.student_index);
    try {
      const body: Record<string, unknown> = { index_number: student.student_index };
      if (elogbookVal !== '') body.elogbook_mark = elogbook_mark;
      if (reportVal !== '') body.report_mark = report_mark;

      await api.post<{ success: boolean; error?: string }>('/supervisor/final-grades', body);
      setSuccessMessage(`Marks saved for ${student.student_index}.`);
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };

  const previewRow = (s: FinalGradeStudent): { final: number | null; classGrade: string | null } => {
    const draft = drafts[s.student_index];
    const elogbookRaw = draft?.elogbook.trim();
    const reportRaw = draft?.report.trim();
    const elogbook = elogbookRaw ? Number(elogbookRaw) : s.elogbook_mark;
    const report = reportRaw ? Number(reportRaw) : s.report_mark;
    const final = computePreviewFinal(
      {
        first_visit_grade: s.first_visit_grade,
        second_visit_grade: s.second_visit_grade,
        company_supervisor_grade: s.company_supervisor_grade,
        elogbook_mark: elogbookRaw && !Number.isNaN(elogbook) ? elogbook : s.elogbook_mark,
        report_mark: reportRaw && !Number.isNaN(report) ? report : s.report_mark,
      },
      weights
    );
    return { final, classGrade: scoreToClassGrade(final) };
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-stack min-w-0">
      <div className="hero-banner border border-slate-200/80 bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-100 sm:text-sm">Industrial attachment assessment</p>
            <h1 className="page-title mt-1 text-white">Final grades</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-100/90">
              Enter e-logbook and report marks for each student. The system calculates the weighted final mark
              from both institutional visits, company supervisor score, report, and e-logbook (20% each).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/supervisor/scores"
              className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
            >
              Visit & company scores
            </Link>
            <Link
              to="/supervisor/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow transition hover:bg-primary-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {message && message.type === 'error' && (
        <div className="rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-800">
          {message.text}
        </div>
      )}

      <SuccessModal
        open={!!successMessage}
        message={successMessage ?? ''}
        onClose={() => setSuccessMessage(null)}
      />

      <div className="stat-grid-compact">
        {[
          { label: 'Assigned students', value: stats.total, sub: 'On your list' },
          { label: 'Complete finals', value: stats.complete, sub: 'All 5 components' },
          { label: 'Class average', value: stats.avg ?? '—', sub: 'Completed only' },
          { label: 'Pending your marks', value: stats.pendingMarks, sub: 'E-logbook or report' },
        ].map((item) => (
          <Card key={item.label} padding="sm" className="border-slate-200/80 bg-white">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{item.label}</p>
            <p className="mt-0.5 text-lg font-display font-bold text-slate-900 sm:text-xl">{item.value}</p>
            <p className="text-[10px] text-slate-500 sm:text-xs">{item.sub}</p>
          </Card>
        ))}
      </div>

      <Card padding="sm" className="border-primary-100 bg-primary-50/30">
        <p className="text-sm font-medium text-slate-800">Grading formula</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['1st visit', weights.first_visit],
              ['2nd visit', weights.second_visit],
              ['Company', weights.company],
              ['Report', weights.report],
              ['E-logbook', weights.elogbook],
            ] as const
          ).map(([label, pct]) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/60 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {label} <span className="text-primary-600">{pct}%</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Class grades: 1 (85+), 2.1 (70–84), 2.2 (60–69), 3 (50–59), F (&lt;50)
        </p>
      </Card>

      <Card padding="none" className="flex min-w-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-3 py-3 sm:px-5 sm:py-4">
          <h2 className="mb-3 text-base font-semibold text-slate-900 font-display sm:text-lg">Student final marks</h2>
          <TableFilters
            filterBy={filterBy}
            onFilterByChange={setFilterBy}
            filterOptions={FINAL_GRADE_FILTER_FIELDS}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search students…"
            resultCount={filtered.length}
            totalCount={students.length}
          />
        </div>

        {students.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No students have been assigned to you yet.</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No students match your search or filter.</p>
        ) : (
          <div
            className="table-scroll-panel table-scroll-panel-tall border-t border-slate-100"
            role="region"
            aria-label="Student final marks table"
            tabIndex={0}
          >
            <table className="w-full min-w-[48rem] divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-3 py-2.5 text-left sm:px-4">Student</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">1st visit</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">2nd visit</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">Company</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">Report</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">E-logbook</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">Final</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center">Class</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-center sm:px-4">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((s) => {
                  const draft = drafts[s.student_index] ?? { elogbook: '', report: '' };
                  const preview = previewRow(s);
                  const incomplete = !s.is_complete && preview.final == null;

                  return (
                    <tr key={s.student_index} className="bg-white transition hover:bg-slate-50/50">
                      <td className="px-3 py-3 sm:px-4">
                        <Link
                          to={`/supervisor/student/${encodeURIComponent(s.student_index)}`}
                          className="group block"
                        >
                          <p className="font-medium text-slate-900 group-hover:text-primary-600">
                            {`${s.first_name} ${s.last_name}`.trim() || '—'}
                          </p>
                          <p className="text-xs text-slate-500">{s.student_index}</p>
                          {s.company_name && (
                            <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-400">{s.company_name}</p>
                          )}
                        </Link>
                        {incomplete && s.missing_components.length > 0 && (
                          <p className="mt-1 text-[10px] leading-tight text-amber-700">
                            Missing: {s.missing_components.map(componentLabel).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ReadonlyScore value={s.first_visit_grade} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ReadonlyScore value={s.second_visit_grade} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <ReadonlyScore value={s.company_supervisor_grade} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <MarkInput
                          label="Report mark"
                          value={draft.report}
                          onChange={(v) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [s.student_index]: { ...draft, report: v },
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <MarkInput
                          label="E-logbook mark"
                          value={draft.elogbook}
                          onChange={(v) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [s.student_index]: { ...draft, elogbook: v },
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className="text-sm font-bold tabular-nums text-primary-700 sm:text-base">
                          {preview.final != null ? preview.final : '—'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <GradeBadge grade={preview.classGrade} />
                      </td>
                      <td className="px-3 py-3 text-center sm:px-4">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={saving === s.student_index}
                          onClick={() => saveRow(s)}
                        >
                          {saving === s.student_index ? 'Saving…' : 'Save'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

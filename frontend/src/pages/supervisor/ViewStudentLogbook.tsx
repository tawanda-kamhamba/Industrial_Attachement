import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { SUPERVISOR_ELOGBOOK_COMMENT_TEMPLATES } from '@/constants/supervisorElogbookCommentTemplates';

interface LogbookEntry {
  id: number;
  week_number: number;
  monday_job_assigned: string;
  monday_skill_acquired: string;
  tuesday_job_assigned: string;
  tuesday_skill_acquired: string;
  wednesday_job_assigned: string;
  wednesday_skill_acquired: string;
  thursday_job_assigned: string;
  thursday_skill_acquired: string;
  friday_job_assigned: string;
  friday_skill_acquired: string;
  created_at: string | null;
  updated_at: string | null;
  supervisor_comment?: string | null;
  supervisor_commenter?: string | null;
  supervisor_commented_at?: string | null;
}

interface ElogbookResponse {
  index_number: string;
  entries: LogbookEntry[];
}

function jobAssignedPoints(text: string | null | undefined): string[] {
  const raw = (text ?? '').replace(/\r\n/g, '\n');
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\s*[-*•]\s+/, ''));
}

function renderJobAssigned(text: string | null | undefined) {
  const points = jobAssignedPoints(text);
  if (points.length === 0) return <span className="text-slate-500">-</span>;

  return (
    <ul className="list-disc space-y-1 pl-5">
      {points.map((p, idx) => (
        <li key={idx} className="whitespace-pre-wrap">
          {p}
        </li>
      ))}
    </ul>
  );
}

export function ViewStudentLogbook() {
  const { indexNumber } = useParams<{ indexNumber: string }>();
  const [data, setData] = useState<ElogbookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({}); // keyed by week_number
  const [submittingWeekNumber, setSubmittingWeekNumber] = useState<number | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadLogbook = async (idx: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ElogbookResponse>(`/elogbook/${encodeURIComponent(idx)}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!indexNumber) return;
    loadLogbook(indexNumber).catch(() => undefined);
  }, [indexNumber]);

  useEffect(() => {
    if (!data?.entries) return;
    setCommentDrafts((prev) => {
      const next = { ...prev };
      for (const entry of data.entries) {
        // Use week_number as the stable key (some DBs may have invalid `id` values).
        if (next[entry.week_number] === undefined) {
          next[entry.week_number] = entry.supervisor_comment ?? '';
        }
      }
      return next;
    });
  }, [data]);

  if (!indexNumber) return <p className="text-slate-500">Missing index number.</p>;
  if (loading) return <p className="text-slate-500">Loading logbook...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const entries = data.entries ?? [];

  const applyCommentTemplate = (weekNumber: number, templateText: string) => {
    setCommentDrafts((prev) => {
      const current = (prev[weekNumber] ?? '').trim();
      const nextText =
        current.length > 0 ? `${current}\n\n${templateText}` : templateText;
      return { ...prev, [weekNumber]: nextText };
    });
    setCommentError(null);
  };

  const submitSupervisorComment = async (weekNumber: unknown) => {
    const parsedWeek = typeof weekNumber === 'number' ? weekNumber : Number.parseInt(String(weekNumber), 10);
    if (!Number.isFinite(parsedWeek) || parsedWeek < 1) {
      setCommentError('Invalid logbook week.');
      return;
    }

    if (!data?.index_number) {
      setCommentError('Missing student index number.');
      return;
    }

    const draft = (commentDrafts[parsedWeek] ?? '').trim();
    if (!draft) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setCommentError(null);
    setSubmittingWeekNumber(parsedWeek);
    try {
      await api.post<{ success: boolean; error?: string }>('/supervisor/elogbook-comment', {
        // We send both `entry_id` (when valid) and `index_number + week_number` as fallback.
        // This makes the feature resilient when `elogbook_entries.id` is 0/NULL in some DBs.
        entry_id: data?.entries.find((e) => e.week_number === parsedWeek)?.id,
        index_number: data.index_number,
        week_number: parsedWeek,
        comment: draft,
      });
      // Reload to show the saved comment and updated timestamps.
      if (indexNumber) {
        await loadLogbook(indexNumber);
      }
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : 'Failed to save comment');
    } finally {
      setSubmittingWeekNumber(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Student E-Logbook</h1>
          <p className="mt-1 text-slate-500">Index: {data.index_number}</p>
        </div>
        <Link to="/supervisor/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      <Card>
        <CardHeader title={`Entries (${entries.length} weeks)`} />
        {commentError && (
          <p className="px-6 pb-2 text-sm text-red-600" role="alert">
            {commentError}
          </p>
        )}
        {entries.length === 0 ? (
          <p className="text-slate-500">No logbook entries yet.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.week_number} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-800">Week {entry.week_number}</h3>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-500">Monday job</dt><dd>{renderJobAssigned(entry.monday_job_assigned)}</dd></div>
                  <div><dt className="text-slate-500">Monday skill</dt><dd>{renderJobAssigned(entry.monday_skill_acquired)}</dd></div>
                  <div><dt className="text-slate-500">Tuesday job</dt><dd>{renderJobAssigned(entry.tuesday_job_assigned)}</dd></div>
                  <div><dt className="text-slate-500">Tuesday skill</dt><dd>{renderJobAssigned(entry.tuesday_skill_acquired)}</dd></div>
                  <div><dt className="text-slate-500">Wednesday job</dt><dd>{renderJobAssigned(entry.wednesday_job_assigned)}</dd></div>
                  <div><dt className="text-slate-500">Wednesday skill</dt><dd>{renderJobAssigned(entry.wednesday_skill_acquired)}</dd></div>
                  <div><dt className="text-slate-500">Thursday job</dt><dd>{renderJobAssigned(entry.thursday_job_assigned)}</dd></div>
                  <div><dt className="text-slate-500">Thursday skill</dt><dd>{renderJobAssigned(entry.thursday_skill_acquired)}</dd></div>
                  <div><dt className="text-slate-500">Friday job</dt><dd>{renderJobAssigned(entry.friday_job_assigned)}</dd></div>
                  <div><dt className="text-slate-500">Friday skill</dt><dd>{renderJobAssigned(entry.friday_skill_acquired)}</dd></div>
                </dl>
                {entry.updated_at && (
                  <p className="mt-2 text-xs text-slate-400">Updated: {entry.updated_at}</p>
                )}

                {entry.supervisor_comment && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500">
                      Comment by {entry.supervisor_commenter ?? 'Supervisor'}
                      {entry.supervisor_commented_at ? ` · ${entry.supervisor_commented_at}` : ''}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                      {entry.supervisor_comment}
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor={`sup-comment-${entry.week_number}`}>
                    Supervisor comment (Week {entry.week_number})
                  </label>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-500">Quick comments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUPERVISOR_ELOGBOOK_COMMENT_TEMPLATES.map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          title={template.text}
                          onClick={() => applyCommentTemplate(entry.week_number, template.text)}
                          className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id={`sup-comment-${entry.week_number}`}
                    value={commentDrafts[entry.week_number] ?? (entry.supervisor_comment ?? '')}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCommentDrafts((prev) => ({ ...prev, [entry.week_number]: v }));
                    }}
                    className="min-h-[96px] w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-800"
                    rows={4}
                    placeholder="Write your comment for the student for this week..."
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => submitSupervisorComment(entry.week_number)}
                      disabled={
                        submittingWeekNumber === entry.week_number ||
                        ((commentDrafts[entry.week_number] ?? (entry.supervisor_comment ?? '') ?? '') as string).trim().length === 0
                      }
                    >
                      {submittingWeekNumber === entry.week_number ? 'Saving…' : 'Send comment'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

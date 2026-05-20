import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

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

export function AdminViewLogbook() {
  const { indexNumber } = useParams<{ indexNumber: string }>();
  const [data, setData] = useState<ElogbookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!indexNumber) return;
    api
      .get<ElogbookResponse>(`/elogbook/${encodeURIComponent(indexNumber)}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [indexNumber]);

  if (!indexNumber) {
    return <p className="text-slate-500">Missing index number.</p>;
  }
  if (loading) return <p className="text-slate-500">Loading logbook...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const entries = data.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Student E-Logbook</h1>
          <p className="mt-1 text-slate-500">Index: {data.index_number}</p>
        </div>
        <Link to="/admin/elogbooks">
          <Button variant="outline">Back to E-Logbooks</Button>
        </Link>
      </div>
      <Card>
        <CardHeader title={`Entries (${entries.length} weeks)`} />
        {entries.length === 0 ? (
          <p className="text-slate-500">No logbook entries yet.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                      Supervisor comment
                      {entry.supervisor_commenter ? ` · ${entry.supervisor_commenter}` : ''}
                      {entry.supervisor_commented_at ? ` · ${entry.supervisor_commented_at}` : ''}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                      {entry.supervisor_comment}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

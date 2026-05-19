import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { api } from '@/services/api';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';
import { SupervisorMarkEntryCell } from '@/components/SupervisorMarkEntryCell';

interface ReportRow {
  name: string;
  size: number;
  modified: string;
  index_number: string;
  report_mark: number | null;
}

export function SupervisorReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get<ReportRow[]>('/supervisor/reports')
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onMarkSaved = useCallback(() => {
    setSuccess('Report mark saved.');
    load();
  }, [load]);

  const columns: Column<ReportRow>[] = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student',
        render: (row) => (
          <div>
            <Link
              to={`/supervisor/student/${encodeURIComponent(row.index_number)}`}
              className="font-medium text-primary-600 hover:underline"
            >
              {row.index_number}
            </Link>
            <p className="text-xs text-slate-500 break-all">{row.name}</p>
          </div>
        ),
      },
      {
        key: 'report_mark',
        header: 'Final report mark',
        align: 'center',
        render: (row) => (
          <SupervisorMarkEntryCell
            indexNumber={row.index_number}
            field="report_mark"
            initialMark={row.report_mark}
            onSaved={onMarkSaved}
          />
        ),
      },
      { key: 'size', header: 'Size (bytes)' },
      { key: 'modified', header: 'Modified' },
      {
        key: 'actions',
        header: 'View / download',
        align: 'center',
        render: (row) => (
          <ReportViewDownloadActions
            role="supervisor"
            storageFilename={row.name}
            displayLabel={row.name}
            layout="actions-only"
            onError={(msg) => setError(msg)}
          />
        ),
      },
    ],
    [onMarkSaved]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Student Reports</h1>
        <p className="mt-1 text-slate-500">
          View reports and enter the final report mark (0–100) for each assigned student.
        </p>
        <Link
          to="/supervisor/final-grades"
          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all final grades →
        </Link>
      </div>
      <Card>
        <CardHeader title="Reports" />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-2 text-sm text-emerald-700">{success}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            keyField="name"
            emptyMessage="No reports from your assigned students yet."
          />
        )}
      </Card>
    </div>
  );
}

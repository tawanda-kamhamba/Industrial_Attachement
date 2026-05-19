import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { api } from '@/services/api';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';
import { MarkCell } from '@/components/ClassGradeBadge';

interface ReportRow {
  name: string;
  index_number?: string;
  student_name?: string;
  size: number;
  modified: string;
  report_mark: number | null;
}

export function SubmittedReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: Column<ReportRow>[] = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.index_number || '—'}</p>
            {row.student_name && <p className="text-xs text-slate-500">{row.student_name}</p>}
          </div>
        ),
      },
      { key: 'name', header: 'File Name' },
      {
        key: 'report_mark',
        header: 'Final report mark',
        align: 'center',
        render: (row) => <MarkCell value={row.report_mark ?? null} />,
      },
      { key: 'size', header: 'Size (bytes)' },
      { key: 'modified', header: 'Modified' },
      {
        key: 'actions',
        header: 'View / download',
        align: 'center',
        render: (row) => (
          <ReportViewDownloadActions
            role="admin"
            storageFilename={row.name}
            displayLabel={row.name}
            layout="actions-only"
            onError={(msg) => setError(msg)}
          />
        ),
      },
    ],
    []
  );

  useEffect(() => {
    api
      .get<ReportRow[]>('/admin/reports')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">View Submitted Reports</h1>
        <p className="mt-1 text-slate-500">View and download student reports</p>
      </div>
      <Card>
        <CardHeader title="Reports" />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable columns={columns} data={rows} keyField="name" emptyMessage="No reports submitted yet." />
        )}
      </Card>
    </div>
  );
}

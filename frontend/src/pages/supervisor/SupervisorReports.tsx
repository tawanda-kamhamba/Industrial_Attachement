import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { api } from '@/services/api';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';

interface ReportRow {
  name: string;
  size: number;
  modified: string;
  index_number: string;
}

export function SupervisorReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: Column<ReportRow>[] = useMemo(
    () => [
      {
        key: 'student',
        header: 'Student index',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.index_number}</p>
            <p className="text-xs text-slate-500 break-all">{row.name}</p>
          </div>
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
    []
  );

  useEffect(() => {
    api
      .get<ReportRow[]>('/supervisor/reports')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Student Reports</h1>
        <p className="mt-1 text-slate-500">
          View and download reports uploaded by students assigned to you.
        </p>
      </div>
      <Card>
        <CardHeader title="Reports" />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
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


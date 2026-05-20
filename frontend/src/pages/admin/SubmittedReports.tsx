import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { api } from '@/services/api';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';
import { MarkCell } from '@/components/ClassGradeBadge';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface ReportRow {
  name: string;
  index_number?: string;
  student_name?: string;
  size: number;
  modified: string;
  report_mark: number | null;
}

const fieldGetters = {
  index_number: (r: ReportRow) => r.index_number,
  student_name: (r: ReportRow) => r.student_name,
  first_name: (r: ReportRow) => r.student_name,
  last_name: (r: ReportRow) => r.name,
  company_name: (r: ReportRow) => r.name,
};

export function SubmittedReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(
    () => filterRows(rows, search, filterBy, fieldGetters),
    [rows, search, filterBy]
  );

  return (
    <div className="page-stack min-w-0">
      <div>
        <h1 className="page-title">View Submitted Reports</h1>
        <p className="page-subtitle">View and download student reports</p>
      </div>
      <Card>
        <CardHeader title="Reports" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search reports…"
          resultCount={filtered.length}
          totalCount={rows.length}
        />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyField="name"
            emptyMessage={search.trim() ? 'No reports match your search.' : 'No reports submitted yet.'}
          />
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { api } from '@/services/api';
import { ReportViewDownloadActions } from '@/components/ReportViewDownloadActions';
import { SupervisorMarkEntryCell } from '@/components/SupervisorMarkEntryCell';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface ReportRow {
  name: string;
  size: number;
  modified: string;
  index_number: string;
  report_mark: number | null;
}

const fieldGetters = {
  index_number: (r: ReportRow) => r.index_number,
  student_name: (r: ReportRow) => r.name,
  first_name: (r: ReportRow) => r.name,
  last_name: (r: ReportRow) => r.name,
  company_name: (r: ReportRow) => r.name,
};

export function SupervisorReports() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

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
    load();
  }, [load]);

  const filtered = useMemo(
    () => filterRows(rows, search, filterBy, fieldGetters),
    [rows, search, filterBy]
  );

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
            <p className="break-all text-xs text-slate-500">{row.name}</p>
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
    <div className="page-stack min-w-0">
      <div>
        <h1 className="page-title">Student Reports</h1>
        <p className="page-subtitle">
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
            emptyMessage={search.trim() ? 'No reports match your search.' : 'No reports from your assigned students yet.'}
          />
        )}
      </Card>
    </div>
  );
}

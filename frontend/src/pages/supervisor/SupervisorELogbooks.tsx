import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { SupervisorMarkEntryCell } from '@/components/SupervisorMarkEntryCell';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface LogbookRow {
  index_number: string;
  student_name: string;
  total_weeks: number;
  first_submission: string | null;
  last_updated: string | null;
  elogbook_mark: number | null;
}

const fieldGetters = {
  index_number: (r: LogbookRow) => r.index_number,
  student_name: (r: LogbookRow) => r.student_name,
  first_name: (r: LogbookRow) => r.student_name,
  last_name: (r: LogbookRow) => r.student_name,
};

export function SupervisorELogbooks() {
  const [rows, setRows] = useState<LogbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get<LogbookRow[]>('/supervisor/elogbooks')
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

  const columns: Column<LogbookRow>[] = useMemo(
    () => [
      {
        key: 'student_name',
        header: 'Student',
        render: (row) => (
          <Link to={`/supervisor/student/${encodeURIComponent(row.index_number)}`} className="block hover:opacity-90">
            <p className="font-medium text-slate-900">{row.student_name || '—'}</p>
            <p className="text-xs text-slate-500">{row.index_number}</p>
          </Link>
        ),
      },
      { key: 'total_weeks', header: 'Weeks Completed', align: 'center' },
      {
        key: 'elogbook_mark',
        header: 'Final e-logbook mark',
        align: 'center',
        render: (row) => (
          <SupervisorMarkEntryCell
            indexNumber={row.index_number}
            field="elogbook_mark"
            initialMark={row.elogbook_mark}
            onSaved={onMarkSaved}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'center',
        render: (row) => (
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/supervisor/student/${encodeURIComponent(row.index_number)}`}>
              <Button variant="outline" size="sm">
                View profile
              </Button>
            </Link>
            <Link to={`/supervisor/logbook/${encodeURIComponent(row.index_number)}`}>
              <Button variant="outline" size="sm">
                View logbook
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [onMarkSaved]
  );

  return (
    <div className="page-stack min-w-0">
      <div>
        <h1 className="page-title">Students&apos; E-Logbooks</h1>
        <p className="page-subtitle">
          Review logbooks and enter the final e-logbook mark (0–100) for each assigned student.
        </p>
        <Link
          to="/supervisor/final-grades"
          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all final grades →
        </Link>
      </div>
      <Card>
        <CardHeader title="Logbooks" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search logbooks…"
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
            keyField="index_number"
            emptyMessage={
              search.trim() ? 'No logbooks match your search.' : 'No e-logbook entries yet for your assigned students.'
            }
          />
        )}
      </Card>
    </div>
  );
}

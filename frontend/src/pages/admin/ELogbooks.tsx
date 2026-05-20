import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { MarkCell } from '@/components/ClassGradeBadge';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface LogbookRow {
  index_number: string;
  student_name: string;
  total_weeks: number;
  first_submission: string | null;
  last_updated: string | null;
  elogbook_mark: number | null;
}

const columns: Column<LogbookRow>[] = [
  { key: 'index_number', header: 'Index Number' },
  { key: 'student_name', header: 'Student Name' },
  { key: 'total_weeks', header: 'Weeks Completed' },
  {
    key: 'elogbook_mark',
    header: 'Final e-logbook mark',
    align: 'center',
    render: (row) => <MarkCell value={row.elogbook_mark} />,
  },
  {
    key: 'view',
    header: 'View',
    align: 'center',
    render: (row) => (
      <Link to={`/admin/logbook/${encodeURIComponent(row.index_number)}`}>
        <Button variant="outline" size="sm">View logbook</Button>
      </Link>
    ),
  },
];

const fieldGetters = {
  index_number: (r: LogbookRow) => r.index_number,
  student_name: (r: LogbookRow) => r.student_name,
  first_name: (r: LogbookRow) => r.student_name,
  last_name: (r: LogbookRow) => r.student_name,
};

export function ELogbooks() {
  const [rows, setRows] = useState<LogbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<LogbookRow[]>('/admin/elogbooks')
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
        <h1 className="page-title">E-Logbooks</h1>
        <p className="page-subtitle">View student e-logbook submissions</p>
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
            emptyMessage={search.trim() ? 'No logbooks match your search.' : 'No e-logbook entries yet.'}
          />
        )}
      </Card>
    </div>
  );
}

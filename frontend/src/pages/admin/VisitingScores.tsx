import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { api } from '@/services/api';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface ScoreRow {
  index_number: string;
  first_name: string;
  last_name: string;
  programme: string;
  level: string;
  session: string;
  first_visit_grade: number | null;
  second_visit_grade: number | null;
}

const columns: Column<ScoreRow>[] = [
  { key: 'index_number', header: 'Index Number' },
  { key: 'first_name', header: 'First Name' },
  { key: 'last_name', header: 'Last Name' },
  { key: 'programme', header: 'Programme' },
  { key: 'level', header: 'Level' },
  { key: 'session', header: 'Session' },
  {
    key: 'first_visit_grade',
    header: 'First visit',
    align: 'center',
    render: (row) =>
      row.first_visit_grade != null ? (
        <span className="font-medium text-slate-800">{row.first_visit_grade}</span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    key: 'second_visit_grade',
    header: 'Second visit',
    align: 'center',
    render: (row) =>
      row.second_visit_grade != null ? (
        <span className="font-medium text-slate-800">{row.second_visit_grade}</span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
];

const fieldGetters = {
  index_number: (r: ScoreRow) => r.index_number,
  student_name: (r: ScoreRow) => `${r.first_name} ${r.last_name}`,
  first_name: (r: ScoreRow) => r.first_name,
  last_name: (r: ScoreRow) => r.last_name,
  programme: (r: ScoreRow) => r.programme,
  level: (r: ScoreRow) => r.level,
  session: (r: ScoreRow) => r.session,
};

export function VisitingScores() {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<ScoreRow[]>('/admin/visiting-scores')
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
        <h1 className="page-title">Visiting Supervisors Score</h1>
        <p className="page-subtitle">First and second visit scores from visiting supervisors</p>
      </div>
      <Card>
        <CardHeader title="Scores" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search scores…"
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
            emptyMessage={search.trim() ? 'No scores match your search.' : 'No visiting scores yet.'}
          />
        )}
      </Card>
    </div>
  );
}

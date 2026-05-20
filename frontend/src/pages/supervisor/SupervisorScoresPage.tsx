import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { TableFilters } from '@/components/ui/TableFilters';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface ScoreRow {
  student_index: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_region: string;
  company_supervisor_grade: number | null;
  my_first_visit_grade: number | null;
  my_second_visit_grade: number | null;
}

const gradeCell = (value: number | null) =>
  value != null ? (
    <span className="font-medium text-slate-800">{value}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );

export function SupervisorScoresPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<ScoreRow[]>('/supervisor/scores')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const fieldGetters = {
    index_number: (r: ScoreRow) => r.student_index,
    student_name: (r: ScoreRow) => `${r.first_name} ${r.last_name}`,
    first_name: (r: ScoreRow) => r.first_name,
    last_name: (r: ScoreRow) => r.last_name,
    company_name: (r: ScoreRow) => r.company_name,
    company_region: (r: ScoreRow) => r.company_region,
  };

  const filtered = useMemo(
    () => filterRows(rows, search, filterBy, fieldGetters),
    [rows, search, filterBy]
  );

  const columns: Column<ScoreRow>[] = [
    {
      key: 'student',
      header: 'Student',
      align: 'left',
      render: (row) => (
        <Link
          to={`/supervisor/student/${encodeURIComponent(row.student_index)}`}
          className="block text-left hover:opacity-90"
        >
          <p className="font-medium text-slate-900">{`${row.first_name} ${row.last_name}`.trim() || '—'}</p>
          <p className="text-xs text-slate-500">{row.student_index}</p>
        </Link>
      ),
    },
    { key: 'company_name', header: 'Company', align: 'center' },
    { key: 'company_region', header: 'Region', align: 'center' },
    {
      key: 'company_supervisor_grade',
      header: 'Company score',
      align: 'center',
      render: (row) => gradeCell(row.company_supervisor_grade),
    },
    {
      key: 'my_first_visit_grade',
      header: 'My 1st visit',
      align: 'center',
      render: (row) => gradeCell(row.my_first_visit_grade),
    },
    {
      key: 'my_second_visit_grade',
      header: 'My 2nd visit',
      align: 'center',
      render: (row) => gradeCell(row.my_second_visit_grade),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to={`/supervisor/student/${encodeURIComponent(row.student_index)}`}>
            <Button variant="outline" size="sm">
              View profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate('/supervisor/dashboard', {
                state: { gradeStudentIndex: row.student_index, visitNumber: 1 },
              })
            }
          >
            {row.my_first_visit_grade != null ? 'Update 1st' : 'Enter 1st'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate('/supervisor/dashboard', {
                state: { gradeStudentIndex: row.student_index, visitNumber: 2 },
              })
            }
          >
            {row.my_second_visit_grade != null ? 'Update 2nd' : 'Enter 2nd'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">All scores</h1>
        <p className="page-subtitle">
          Company supervisor scores (read-only) and your first/second visit scores for assigned students.
        </p>
        <Link
          to="/supervisor/final-grades"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Enter e-logbook & report marks and view final grades →
        </Link>
      </div>
      <Card>
        <CardHeader title="Scores by student" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search students…"
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
            keyField="student_index"
            emptyMessage={search.trim() ? 'No students match your search.' : 'No assigned students.'}
          />
        )}
      </Card>
    </div>
  );
}

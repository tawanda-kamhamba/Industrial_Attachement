import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { ClassGradeBadge, MarkCell } from '@/components/ClassGradeBadge';

interface StudentRow {
  index_number: string;
  first_name: string;
  last_name: string;
  programme: string;
  level: string;
  session: string;
  final_mark: number | null;
  letter_grade: string | null;
}

const columns: Column<StudentRow>[] = [
  {
    key: 'index_number',
    header: 'Index Number',
    render: (row) => (
      <Link
        to={`/admin/students/${encodeURIComponent(row.index_number)}`}
        className="font-medium text-primary-600 hover:underline"
      >
        {row.index_number}
      </Link>
    ),
  },
  {
    key: 'first_name',
    header: 'First Name',
    render: (row) => (
      <Link
        to={`/admin/students/${encodeURIComponent(row.index_number)}`}
        className="text-slate-800 hover:text-primary-600 hover:underline"
      >
        {row.first_name}
      </Link>
    ),
  },
  { key: 'last_name', header: 'Last Name' },
  { key: 'programme', header: 'Programme' },
  { key: 'level', header: 'Level' },
  { key: 'session', header: 'Session' },
  {
    key: 'final_mark',
    header: 'Final mark',
    align: 'center',
    render: (row) => <MarkCell value={row.final_mark} />,
  },
  {
    key: 'letter_grade',
    header: 'Class',
    align: 'center',
    render: (row) => <ClassGradeBadge grade={row.letter_grade} />,
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'center',
    render: (row) => (
      <Link to={`/admin/students/${encodeURIComponent(row.index_number)}`}>
        <Button variant="outline" size="sm">
          View profile
        </Button>
      </Link>
    ),
  },
];

export function RegisteredStudents() {
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (searchTerm) params.set('search', searchTerm);
    api
      .get<StudentRow[]>(`/admin/students?${params.toString()}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredRows = rows;

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Registered Students</h1>
        <p className="page-subtitle">View and search industrial registration records</p>
      </div>
      <Card>
        <CardHeader title="Students" />
        <div className="toolbar">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Filter by</option>
            <option value="first_name">First Name</option>
            <option value="last_name">Last Name</option>
            <option value="index_number">Index Number</option>
            <option value="programme">Programme</option>
            <option value="level">Level</option>
            <option value="session">Session</option>
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search term..."
            className="toolbar-input sm:min-w-[12rem]"
          />
          <Button variant="primary" size="sm" onClick={fetchStudents}>Search</Button>
        </div>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable columns={columns} data={filteredRows} keyField="index_number" emptyMessage="No students found." />
        )}
      </Card>
    </div>
  );
}

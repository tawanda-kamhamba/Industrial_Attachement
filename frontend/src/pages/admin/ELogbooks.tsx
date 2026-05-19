import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { MarkCell } from '@/components/ClassGradeBadge';

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

export function ELogbooks() {
  const [rows, setRows] = useState<LogbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<LogbookRow[]>('/admin/elogbooks')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">E-Logbooks</h1>
        <p className="mt-1 text-slate-500">View student e-logbook submissions</p>
      </div>
      <Card>
        <CardHeader title="Logbooks" />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable columns={columns} data={rows} keyField="index_number" emptyMessage="No e-logbook entries yet." />
        )}
      </Card>
    </div>
  );
}

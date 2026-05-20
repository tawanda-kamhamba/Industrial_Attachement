import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableFilters } from '@/components/ui/TableFilters';
import { api } from '@/services/api';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface AssumptionRow {
  index_number: string;
  first_name: string;
  last_name: string;
  programme: string;
  level: string;
  session: string;
  company_name: string;
  company_region: string;
}

const columns: Column<AssumptionRow>[] = [
  { key: 'index_number', header: 'Index Number' },
  { key: 'first_name', header: 'First Name' },
  { key: 'last_name', header: 'Last Name' },
  { key: 'company_name', header: 'Company Name' },
  { key: 'company_region', header: 'Region' },
  { key: 'programme', header: 'Programme' },
  { key: 'level', header: 'Level' },
  { key: 'session', header: 'Session' },
];

const fieldGetters = {
  index_number: (r: AssumptionRow) => r.index_number,
  student_name: (r: AssumptionRow) => `${r.first_name} ${r.last_name}`,
  first_name: (r: AssumptionRow) => r.first_name,
  last_name: (r: AssumptionRow) => r.last_name,
  company_name: (r: AssumptionRow) => r.company_name,
  company_region: (r: AssumptionRow) => r.company_region,
  programme: (r: AssumptionRow) => r.programme,
  level: (r: AssumptionRow) => r.level,
  session: (r: AssumptionRow) => r.session,
};

export function StudentAssumptions() {
  const [rows, setRows] = useState<AssumptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<AssumptionRow[]>('/admin/assumptions')
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
        <h1 className="page-title">Student Assumptions</h1>
        <p className="page-subtitle">Company and region assumptions per student</p>
      </div>
      <Card>
        <CardHeader title="Assumptions" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search assumptions…"
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
            emptyMessage={search.trim() ? 'No records match your search.' : 'No assumption records.'}
          />
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from 'react';
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
  supervisor_name: string;
  supervisor_contact: string;
  supervisor_email: string;
  company_address: string;
}

const columns: Column<AssumptionRow>[] = [
  {
    key: 'student',
    header: 'Student',
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">
          {row.first_name} {row.last_name}
        </p>
        <p className="text-xs text-slate-500">{row.index_number}</p>
      </div>
    ),
  },
  { key: 'company_name', header: 'Company', align: 'left' },
  { key: 'company_region', header: 'Region', align: 'left' },
  {
    key: 'company_supervisor',
    header: 'Company supervisor',
    align: 'left',
    render: (row) => (
      <div className="min-w-[160px]">
        <p className="font-medium text-slate-900">{row.supervisor_name || '—'}</p>
        {row.supervisor_contact ? (
          <p className="text-xs text-slate-500">Tel: {row.supervisor_contact}</p>
        ) : null}
        {row.supervisor_email ? (
          <a
            href={`mailto:${row.supervisor_email}`}
            className="truncate text-xs text-primary-600 hover:underline"
            title={`Email ${row.supervisor_email}`}
          >
            {row.supervisor_email}
          </a>
        ) : null}
      </div>
    ),
  },
  { key: 'programme', header: 'Programme', align: 'left' },
  { key: 'level', header: 'Level', align: 'center' },
  { key: 'session', header: 'Session', align: 'center' },
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

export function SupervisorStudentAssumptions() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<AssumptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<AssumptionRow[]>('/supervisor/assumptions')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterRows(rows, search, filterBy, fieldGetters),
    [rows, search, filterBy]
  );

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  return (
    <div className="page-stack min-w-0">
      <div>
        <h1 className="page-title">Student Assumptions</h1>
        <p className="page-subtitle">
          Company and company supervisor details for students assigned to you.
        </p>
      </div>

      {!loading && filtered.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Company supervisor information</h2>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Scroll left"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Scroll right"
              >
                →
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {filtered.map((row) => (
              <div
                key={row.index_number}
                className="w-44 shrink-0 snap-start rounded-xl border border-primary-200 bg-primary-50/50 p-3 shadow-sm"
              >
                <p className="mb-2 truncate text-xs font-medium text-slate-700" title={`${row.first_name} ${row.last_name} (${row.index_number})`}>
                  {row.first_name} {row.last_name}
                </p>
                <p className="mb-2 truncate text-[10px] text-slate-500">{row.index_number}</p>
                <dl className="space-y-1.5">
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Name</dt>
                    <dd className="truncate text-xs font-medium text-slate-900" title={row.supervisor_name || undefined}>
                      {row.supervisor_name || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Contact</dt>
                    <dd className="truncate text-xs font-medium text-slate-900">{row.supervisor_contact || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Email</dt>
                    <dd className="truncate text-xs font-medium" title={row.supervisor_email || undefined}>
                      {row.supervisor_email ? (
                        <a href={`mailto:${row.supervisor_email}`} className="text-primary-600 hover:underline">
                          {row.supervisor_email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

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
            emptyMessage={
              search.trim() ? 'No records match your search.' : 'No assumption records for your assigned students.'
            }
          />
        )}
      </Card>
    </div>
  );
}

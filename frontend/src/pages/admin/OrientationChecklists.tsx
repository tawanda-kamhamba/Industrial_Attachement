import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

interface ChecklistRow {
  id: number;
  index_number: string;
  student_name: string;
  completed_at: string | null;
  completed_items: number;
  total_items: number;
  completion_percent: number;
}

interface ChecklistSectionItem {
  field: string;
  label: string;
  completed: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistSectionItem[];
}

interface ChecklistDetail {
  id: number;
  student_name: string;
  index_number: string;
  host_institution: string;
  completed_at: string | null;
  completed_items: number;
  total_items: number;
  completion_percent: number;
  sections: ChecklistSection[];
  signatures: {
    student: { name: string; date: string | null };
    host_supervisor: { name: string; date: string | null };
    wrl_coordinator: { name: string; date: string | null };
  };
}

type FilterBy = 'all' | 'Student Name' | 'Index Number';

const columns: Column<ChecklistRow>[] = [
  {
    key: 'student_name',
    header: 'Student',
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.student_name || '-'}</p>
        <p className="text-xs text-slate-500">{row.index_number}</p>
      </div>
    ),
  },
  {
    key: 'completion',
    header: 'Completion',
    render: (row) => {
      const pct = row.completion_percent ?? 0;
      const color =
        pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-slate-400';
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {row.completed_items}/{row.total_items} items
            </span>
            <span className="font-semibold text-slate-700">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    },
  },
  {
    key: 'completed_at',
    header: 'Submitted',
    render: (row) =>
      row.completed_at
        ? new Date(row.completed_at).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
  },
];

export function OrientationChecklists() {
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ChecklistDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ChecklistRow[]>('/admin/orientation')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((row) => {
    if (!search.trim() || filterBy === 'all') return true;
    const q = search.toLowerCase();
    if (filterBy === 'Student Name') {
      return (
        row.student_name.toLowerCase().includes(q) ||
        row.index_number.toLowerCase().includes(q)
      );
    }
    if (filterBy === 'Index Number') {
      return row.index_number.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await api.get<ChecklistDetail>(`/admin/orientation-detail?id=${encodeURIComponent(id)}`);
      setSelected(data);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'Failed to load checklist details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Orientation Checklists</h1>
          <p className="mt-1 text-slate-500">
            Review students&apos; orientation status across host institutions.
          </p>
        </div>
        <div className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-slate-100 shadow-sm">
          <p className="font-semibold tracking-wide text-primary-200/90">Submitted</p>
          <p className="mt-0.5 text-lg font-display">
            {rows.length}
            <span className="ml-1 text-xs font-normal text-slate-300">checklists</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Student checklists" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> 100% complete
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-3" /> 60–99% complete
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 ml-3" /> &lt; 60% complete
          </div>
          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">Filter by…</option>
              <option value="Student Name">Student name</option>
              <option value="Index Number">Index number</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="h-9 w-40 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}

        <div className="px-4 pb-4 pt-3">
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : (
            <DataTable
              columns={[
                ...columns,
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (row) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(row.id)}
                    >
                      View details
                    </Button>
                  ),
                },
              ]}
              data={filtered}
              keyField="id"
              emptyMessage="No orientation checklists submitted yet."
            />
          )}
        </div>
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-slate-900/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600/80">
                  Orientation checklist
                </p>
                <h2 className="mt-1 text-lg font-display font-semibold text-slate-900">
                  {selected.student_name || 'Student'}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    ({selected.index_number})
                  </span>
                </h2>
                {selected.host_institution && (
                  <p className="mt-1 text-xs text-slate-500">
                    Host institution:{' '}
                    <span className="font-medium text-slate-700">
                      {selected.host_institution}
                    </span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-3 rounded-full border border-slate-300 bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="block leading-none text-lg">×</span>
              </button>
            </div>

            <div className="border-b border-slate-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10">
                    <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90 text-slate-200">
                      <path
                        className="stroke-current"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32z"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 36 36"
                      className="absolute inset-0 h-10 w-10 -rotate-90 text-emerald-500"
                      style={{
                        strokeDasharray: '100, 100',
                        strokeDashoffset: 100 - selected.completion_percent,
                      }}
                    >
                      <path
                        className="stroke-current"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32z"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-900">
                        {selected.completion_percent}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {selected.completed_items}/{selected.total_items} items completed
                    </p>
                    {selected.completed_at && (
                      <p className="mt-0.5">
                        Submitted{' '}
                        {new Date(selected.completed_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {detailError && (
                <p className="mt-2 text-xs text-red-600">{detailError}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <p className="text-sm text-slate-500">Loading details…</p>
              ) : (
                <div className="space-y-6">
                  {selected.sections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {section.items.map((item) => (
                          <div
                            key={item.field}
                            className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                                item.completed
                                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/40'
                                  : 'bg-slate-200/80 text-slate-500'
                              }`}
                            >
                              {item.completed ? '✓' : '•'}
                            </span>
                            <p className="text-xs text-slate-700">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Signatures
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        ['Student', selected.signatures.student],
                        ['Host supervisor', selected.signatures.host_supervisor],
                        ['WRL coordinator', selected.signatures.wrl_coordinator],
                      ].map(([role, sig]) => (
                        <div
                          key={String(role)}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {typeof role === 'string' ? role : (role as { name: string }).name}
                          </p>
                          <p className="mt-1 font-medium text-slate-800">
                            {(sig as { name: string }).name || <span className="text-slate-400">—</span>}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {((sig as { date: string | null }).date &&
                              new Date((sig as { date: string | null }).date as string).toLocaleDateString()) ||
                              'No date'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-3 text-right">
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

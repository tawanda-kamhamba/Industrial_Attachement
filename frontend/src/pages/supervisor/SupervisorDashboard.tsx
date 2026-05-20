import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { SupervisorScoreForm } from '@/pages/supervisor/SupervisorScoreForm';
import type { StudentSummary, SupervisorDashboardStats } from '@/types';
import type { ChartDataPoint } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { getTimeBasedGreeting } from '@/utils/greeting';
import { TableFilters } from '@/components/ui/TableFilters';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

const defaultStats: SupervisorDashboardStats = {
  totalStudents: 0,
  firstVisits: 0,
  secondVisits: 0,
  firstVisitWithScoresheet: 0,
  secondVisitWithScoresheet: 0,
};

const columns: Column<StudentSummary & { onGrade?: (student: StudentSummary) => void }>[] = [
  {
    key: 'student',
    header: 'Student',
    align: 'left',
    render: (row) => (
      <Link
        to={`/supervisor/student/${encodeURIComponent(row.student_index)}`}
        className="block text-left hover:opacity-90"
      >
        <p className="font-medium text-slate-900">{`${row.first_name} ${row.last_name}`.trim()}</p>
        <p className="text-xs text-slate-500">{row.student_index}</p>
      </Link>
    ),
  },
  { key: 'company_name', header: 'Company', align: 'center' },
  { key: 'company_region', header: 'Region', align: 'center' },
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
        <Link to={`/supervisor/logbook/${encodeURIComponent(row.student_index)}`}>
          <Button variant="outline" size="sm">
            View logbook
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          onClick={() => (row as StudentSummary & { onGrade?: (s: StudentSummary) => void }).onGrade?.(row)}
        >
          Enter score
        </Button>
      </div>
    ),
  },
];

export function SupervisorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<SupervisorDashboardStats | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingStudent, setGradingStudent] = useState<StudentSummary | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<SupervisorDashboardStats>('/supervisor/stats'),
      api.get<StudentSummary[]>('/supervisor/students'),
    ])
      .then(([s, st]) => {
        setStats(s);
        setStudents(st);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const [gradingVisitNumber, setGradingVisitNumber] = useState<1 | 2 | undefined>(undefined);

  const closeGradeModal = () => {
    setGradingStudent(null);
    setGradingVisitNumber(undefined);
  };

  useEffect(() => {
    const state = location.state as { gradeStudentIndex?: string; visitNumber?: 1 | 2 } | null;
    const idx = state?.gradeStudentIndex;
    if (idx && students.length > 0) {
      const found = students.find((s) => s.student_index === idx);
      if (found) {
        setGradingStudent(found);
        setGradingVisitNumber(state?.visitNumber ?? undefined);
      }
    }
  }, [location.state, students]);

  const s = stats ?? defaultStats;

  // Charts: assigned students only (from stats + students)
  const visitScoresData: ChartDataPoint[] = useMemo(
    () => [
      { name: 'First visit', value: s.firstVisitWithScoresheet },
      { name: 'Second visit', value: s.secondVisitWithScoresheet },
    ],
    [s.firstVisitWithScoresheet, s.secondVisitWithScoresheet]
  );

  const filteredStudents = useMemo(
    () =>
      filterRows(students, search, filterBy, {
        index_number: (s) => s.student_index,
        student_name: (s) => `${s.first_name} ${s.last_name}`,
        first_name: (s) => s.first_name,
        last_name: (s) => s.last_name,
        company_name: (s) => s.company_name,
        company_region: (s) => s.company_region ?? s.attachment_region ?? '',
      }),
    [students, search, filterBy]
  );

  const regionChartData: ChartDataPoint[] = useMemo(() => {
    const byRegion: Record<string, number> = {};
    students.forEach((st) => {
      const region = st.company_region?.trim() || st.attachment_region?.trim() || 'Unspecified';
      byRegion[region] = (byRegion[region] ?? 0) + 1;
    });
    return Object.entries(byRegion)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [students]);

  if (loading) {
    return (
      <div className="page-stack min-w-0">
        <div className="h-28 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
        <div className="stat-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-h-[7.5rem] rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
          ))}
        </div>
        <div className="chart-grid-2">
          <div className="h-64 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
          <div className="h-64 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
        </div>
        <div className="h-48 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse" />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="hero-banner bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
          <div className="relative">
            <h1 className="page-title text-white">Supervisor Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">Something went wrong</p>
          </div>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg text-amber-600" aria-hidden>!</span>
            <div>
              <h2 className="font-semibold text-amber-900">Could not load dashboard</h2>
              <p className="mt-1 text-sm text-amber-800">{error}</p>
              <p className="mt-2 text-xs text-amber-700">Check your connection and try refreshing the page.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack min-w-0">
      {/* Hero */}
      <div className="hero-banner bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-14 -bottom-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-100">Institutional Supervisor</p>
          <h1 className="mt-1 text-xl font-display font-bold tracking-tight sm:text-2xl md:text-3xl">
            {getTimeBasedGreeting()}, {user?.name ?? 'Supervisor'}!
          </h1>
          <p className="mt-2 text-sm text-primary-100">
            Your assigned students, visit summary and scoresheets.
          </p>
        </div>
      </div>

      {/* Summary stats — 1 primary, 3 light */}
      <section>
        <div className="section-heading mb-4">
          <h2 className="text-base font-semibold text-slate-800 font-display sm:text-lg">Visit summary</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Live stats
          </span>
        </div>
        <div className="stat-grid-compact">
          <StatCard
            title="Total Assigned Students"
            value={s.totalStudents}
            variant="primary"
            subtitle="In your list"
            cornerIcon={false}
            compact
          />
          <StatCard title="First Visits" value={s.firstVisits} variant="light" subtitle="Completed" compact />
          <StatCard title="Second Visits" value={s.secondVisits} variant="light" subtitle="Completed" compact />
          <StatCard
            title="Scoresheets (1st / 2nd)"
            value={`${s.firstVisitWithScoresheet} / ${s.secondVisitWithScoresheet}`}
            variant="light"
            subtitle="Submitted"
            compact
          />
        </div>
      </section>

      {/* Charts: assigned students only — side by side */}
      <section>
        <div className="section-heading mb-4">
          <h2 className="text-base font-semibold text-slate-800 font-display sm:text-lg">Assigned students overview</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Your students only
          </span>
        </div>
        <div className="chart-grid-2">
          <BarChartCard
            title="Visit scoresheets submitted"
            data={visitScoresData}
            barColor="#10b981"
          />
          <PieChartCard
            title="Students by region"
            data={regionChartData}
            showRegionList={true}
          />
        </div>
      </section>

      {/* Assigned students table */}
      <section>
        <div className="section-heading mb-4">
          <h2 className="text-base font-semibold text-slate-800 font-display sm:text-lg">Assigned Students</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {students.length} student{students.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="p-3 sm:p-5">
            <TableFilters
              filterBy={filterBy}
              onFilterByChange={setFilterBy}
              filterOptions={STUDENT_FILTER_FIELDS}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search assigned students…"
              resultCount={filteredStudents.length}
              totalCount={students.length}
            />
            <DataTable
              columns={columns}
              data={filteredStudents.map((st) => ({
                ...st,
                onGrade: (student: StudentSummary) => setGradingStudent(student),
              })) as (StudentSummary & { onGrade?: (s: StudentSummary) => void })[]}
              keyField="student_index"
              emptyMessage={
                search.trim() || filterBy !== 'all'
                  ? 'No students match your search.'
                  : 'No students have been assigned to you yet.'
              }
            />
          </div>
        </Card>
      </section>

      {gradingStudent && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-stretch sm:justify-end"
          onClick={(e) => e.target === e.currentTarget && closeGradeModal()}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-2xl animate-slide-up sm:h-full sm:max-h-none sm:rounded-none">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600/80">
                  Visiting score
                </p>
                <h2 className="mt-1 text-lg font-display font-semibold text-slate-900">
                  {gradingStudent.first_name} {gradingStudent.last_name}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    ({gradingStudent.student_index})
                  </span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter first or second visit scores using the same rubric as the student portal.
                </p>
              </div>
              <button
                type="button"
                onClick={closeGradeModal}
                className="ml-3 rounded-full border border-slate-300 bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="block leading-none text-lg">×</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 sm:px-6">
              <SupervisorScoreForm
                key={`${gradingStudent.student_index}-v${gradingVisitNumber ?? 0}`}
                indexNumber={gradingStudent.student_index}
                onClose={closeGradeModal}
                initialVisitNumber={gradingVisitNumber}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

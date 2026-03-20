import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { getTimeBasedGreeting } from '@/utils/greeting';

const PROFILE_PHOTO_CACHE_KEY = 'iasms_profile_photo_updated';

type DashboardLink = {
  to: string;
  label: string;
  description: string;
  external: boolean;
  category: 'Get started' | 'During attachment' | 'Finish up';
  keywords?: string[];
};

const quickLinks: DashboardLink[] = [
  {
    to: '/student/instructions',
    label: 'Instructions',
    description: 'What to do after login and how the portal works.',
    external: false,
    category: 'Get started',
    keywords: ['guide', 'help'],
  },
  {
    to: '/student/register',
    label: 'Register',
    description: 'Register for industrial attachment.',
    external: false,
    category: 'Get started',
    keywords: ['enroll', 'registration'],
  },
  {
    to: '/student/assumption',
    label: 'Submit Assumption',
    description: 'Submit assumption of duty (company & supervisor).',
    external: false,
    category: 'Get started',
    keywords: ['company', 'supervisor', 'assumption'],
  },
  {
    to: '/student/orientation',
    label: 'Orientation Checklist',
    description: 'Complete your orientation checklist.',
    external: false,
    category: 'During attachment',
    keywords: ['orientation', 'checklist'],
  },
  {
    to: '/student/elogbook',
    label: 'E-Logbook',
    description: 'Submit weekly logbook entries.',
    external: false,
    category: 'During attachment',
    keywords: ['weekly', 'logbook'],
  },
  {
    to: '/student/contract',
    label: 'Submit Contract',
    description: 'Upload your attachment contract.',
    external: false,
    category: 'During attachment',
    keywords: ['upload', 'contract'],
  },
  {
    to: '/student/report',
    label: 'Submit Report',
    description: 'Upload your final report.',
    external: false,
    category: 'Finish up',
    keywords: ['final', 'report', 'upload'],
  },
];

const supervisorAssessmentLinks = [
  {
    to: '/student/supervisor/visiting',
    label: 'Visiting Supervisor Assessment',
    description: 'Your visiting supervisor can log in here to assess you and enter marks.',
    external: false,
  },
  {
    to: '/student/supervisor/company',
    label: 'Company Supervisor Assessment',
    description: 'Your company supervisor can log in here to assess you and enter marks.',
    external: false,
  },
];

type StudentGradesResponse = {
  visitingSupervisorGrade: number | null;
  companySupervisorGrade: number | null;
  visitingDate?: string | null;
  companyDate?: string | null;
};

type StudentSupervisorResponse = {
  index_number: string;
  assigned: null | {
    lecturer_id: number;
    lecturer_name: string;
    lecturer_faculty: string;
    lecturer_department: string;
    lecturer_region_residence: string;
    staff_id: string | null;
    assigned_at?: string | null;
  };
  other_assigned?: null | {
    lecturer_id: number;
    lecturer_name: string;
    lecturer_faculty: string;
    lecturer_department: string;
    lecturer_region_residence: string;
    staff_id: string | null;
    assigned_at?: string | null;
  };
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [grades, setGrades] = useState<StudentGradesResponse | null>(null);
  const [assignedSupervisor, setAssignedSupervisor] = useState<StudentSupervisorResponse['assigned'] | null>(null);
  const [otherAssignedSupervisor, setOtherAssignedSupervisor] = useState<StudentSupervisorResponse['other_assigned'] | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const photoVersion = typeof localStorage !== 'undefined' ? localStorage.getItem(PROFILE_PHOTO_CACHE_KEY) ?? '' : '';
  const profilePhotoUrl = user?.role === 'student'
    ? `/api/student/profile/photo?t=${photoVersion}`
    : null;
  const initials = (user?.name ?? 'Student').trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    let cancelled = false;
    setCardsLoading(true);
    Promise.all([
      api.get<StudentGradesResponse>('/student/grades').catch(() => null),
      api.get<StudentSupervisorResponse>('/student/supervisor').catch(() => null),
    ])
      .then(([g, sup]) => {
        if (cancelled) return;
        setGrades(g);
        setAssignedSupervisor(sup?.assigned ?? null);
        setOtherAssignedSupervisor(sup?.other_assigned ?? null);
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickLinks;
    return quickLinks.filter((l) => {
      const hay = `${l.label} ${l.description} ${l.category} ${(l.keywords ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const groupedLinks = useMemo(() => {
    const order: DashboardLink['category'][] = ['Get started', 'During attachment', 'Finish up'];
    const groups = new Map<DashboardLink['category'], DashboardLink[]>();
    order.forEach((c) => groups.set(c, []));
    filteredLinks.forEach((l) => groups.get(l.category)?.push(l));
    return order
      .map((c) => ({ category: c, items: groups.get(c) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [filteredLinks]);

  const totalAssessmentsReceived = useMemo(() => {
    const v = grades?.visitingSupervisorGrade;
    const c = grades?.companySupervisorGrade;
    return (typeof v === 'number' ? 1 : 0) + (typeof c === 'number' ? 1 : 0);
  }, [grades]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-6 py-8 text-white shadow-lg">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-14 -bottom-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/30">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    const fallback = el.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="flex h-full w-full items-center justify-center bg-white/15 text-xl font-semibold"
                style={profilePhotoUrl ? { display: 'none' } : undefined}
              >
                {initials}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Student portal</p>
              <h1 className="mt-1 text-2xl font-display font-bold tracking-tight sm:text-3xl">
                {getTimeBasedGreeting()} {user?.name ?? 'Student'}!
              </h1>
              <p className="mt-1.5 text-sm text-primary-100">
                Everything you need for your industrial attachment, in one place.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative w-full sm:w-[360px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/80" aria-hidden>
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks (logbook, report, contract...)"
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/70 backdrop-blur focus:border-white/40 focus:bg-white/15"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks available"
          value={quickLinks.length}
          variant="primary"
          subtitle="Forms & pages you can access"
          className="!p-4"
        />

        <StatCard
          title="Assessments received"
          value={cardsLoading ? '—' : `${totalAssessmentsReceived} / 2`}
          variant="info"
          subtitle={cardsLoading ? 'Loading your grades…' : 'Visiting + company supervisor'}
          className="!p-4"
        />

        <Card className="border border-slate-200 bg-white" padding="sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Institutional supervisor</p>
              {cardsLoading ? (
                <p className="mt-1 text-xs text-slate-500">Loading assignment…</p>
              ) : assignedSupervisor ? (
                <>
                  <p className="mt-1 text-sm font-display font-semibold text-slate-900">
                    {assignedSupervisor.lecturer_name || 'Assigned supervisor'}
                  </p>
                  {otherAssignedSupervisor ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Also: {otherAssignedSupervisor.lecturer_name || 'Institutional supervisor'}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {[assignedSupervisor.lecturer_department, assignedSupervisor.lecturer_faculty]
                      .filter(Boolean)
                      .join(' • ') || 'Details available soon'}
                  </p>
                  {otherAssignedSupervisor ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Also: {[otherAssignedSupervisor.lecturer_department, otherAssignedSupervisor.lecturer_faculty]
                        .filter(Boolean)
                        .join(' • ') || 'Details available soon'}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {assignedSupervisor.lecturer_region_residence ? `Region: ${assignedSupervisor.lecturer_region_residence}` : 'Region: —'}
                  </p>
                  {otherAssignedSupervisor ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Also Region: {otherAssignedSupervisor.lecturer_region_residence ? otherAssignedSupervisor.lecturer_region_residence : '—'}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Not assigned yet.</p>
              )}
            </div>
            <div className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              Assigned
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white" padding="sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Quick info</p>
            <Link to="/student/instructions" aria-label="Help">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-400"
              >
                Help
              </Button>
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Index number</p>
          <p className="mt-0.5 font-display text-base font-semibold text-slate-900">{user?.indexNumber ?? '—'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/student/profile">
              <Button variant="outline" size="sm">Edit profile</Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Supervisor assessments – where supervisors enter marks */}
      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 font-display">Supervisor assessments</h2>
            <p className="mt-1 text-sm text-slate-500">
          Open an assessment so your supervisor can log in with their password and enter your marks using the same competency form.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {supervisorAssessmentLinks.map((link) => (
            <Card
              key={link.to}
              className="group flex flex-col border border-slate-200 bg-white transition-all hover:border-primary-200 hover:shadow-md"
            >
              <div className="flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  Secure access
                  <span className="text-primary-400" aria-hidden>•</span>
                  Supervisor login
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{link.label}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{link.description}</p>
              </div>
              <div className="mt-4">
                {link.external ? (
                  <a href={link.to} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Open <span className="text-slate-400" aria-hidden>↗</span>
                  </a>
                ) : (
                  <Link to={link.to}>
                    <Button variant="outline" size="sm">Open assessment</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Tasks & links */}
      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 font-display">Tasks & links</h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete your attachment requirements. Use the search above to find anything fast.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredLinks.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{quickLinks.length}</span>
          </p>
        </div>

        {groupedLinks.length === 0 ? (
          <Card className="border border-slate-200 bg-white">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900">No matches</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search like “logbook”, “report”, or “contract”.</p>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedLinks.map((group) => (
              <div key={group.category}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                    {group.category}
                  </h3>
                  <span className="text-xs text-slate-500">{group.items.length} item(s)</span>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((link) => (
                    <Card
                      key={link.to}
                      className="group flex flex-col border border-slate-200 bg-white transition-all hover:border-primary-200 hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {link.category}
                        </div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                          {link.label}
                        </h4>
                        <p className="mt-1.5 text-sm text-slate-500">{link.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {link.external ? (
                          <a
                            href={link.to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Open
                            <span className="text-slate-400" aria-hidden>↗</span>
                          </a>
                        ) : (
                          <Link to={link.to}>
                            <Button variant="outline" size="sm">Open</Button>
                          </Link>
                        )}
                        <span className="text-slate-300 group-hover:text-primary-300 transition-colors" aria-hidden>
                          →
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

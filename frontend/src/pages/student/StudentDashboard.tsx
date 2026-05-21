import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardCheck,
  ClipboardPen,
  FileBarChart,
  FileText,
  Flag,
  HelpCircle,
  LayoutGrid,
  ListChecks,
  MapPin,
  Rocket,
  ShieldCheck,
  UserCircle,
  UserPen,
  UserPlus,
} from 'lucide-react';
import { LinkIconBadge, type LinkIconTone } from '@/components/student/LinkIconBadge';
import { Card } from '@/components/ui/Card';
import { ProfilePhotoLightbox } from '@/components/ui/ProfilePhotoLightbox';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { SearchField } from '@/components/ui/SearchField';
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
  icon: LucideIcon;
  iconTone: LinkIconTone;
  keywords?: string[];
};

const categoryMeta: Record<
  DashboardLink['category'],
  { icon: LucideIcon; className: string }
> = {
  'Get started': { icon: Rocket, className: 'text-amber-700' },
  'During attachment': { icon: Briefcase, className: 'text-primary-700' },
  'Finish up': { icon: Flag, className: 'text-emerald-700' },
};

const quickLinks: DashboardLink[] = [
  {
    to: '/student/instructions',
    label: 'Instructions',
    description: 'What to do after login and how the portal works.',
    external: false,
    category: 'Get started',
    icon: BookMarked,
    iconTone: 'sky',
    keywords: ['guide', 'help'],
  },
  {
    to: '/student/register',
    label: 'Register',
    description: 'Register for industrial attachment.',
    external: false,
    category: 'Get started',
    icon: UserPlus,
    iconTone: 'primary',
    keywords: ['enroll', 'registration'],
  },
  {
    to: '/student/assumption',
    label: 'Submit Assumption',
    description: 'Submit assumption of duty (company & supervisor).',
    external: false,
    category: 'Get started',
    icon: ClipboardPen,
    iconTone: 'violet',
    keywords: ['company', 'supervisor', 'assumption'],
  },
  {
    to: '/student/orientation',
    label: 'Orientation Checklist',
    description: 'Complete your orientation checklist.',
    external: false,
    category: 'During attachment',
    icon: ClipboardCheck,
    iconTone: 'emerald',
    keywords: ['orientation', 'checklist'],
  },
  {
    to: '/student/elogbook',
    label: 'E-Logbook',
    description: 'Submit weekly logbook entries.',
    external: false,
    category: 'During attachment',
    icon: BookOpen,
    iconTone: 'primary',
    keywords: ['weekly', 'logbook'],
  },
  {
    to: '/student/contract',
    label: 'Submit Contract',
    description: 'Upload your attachment contract.',
    external: false,
    category: 'During attachment',
    icon: FileText,
    iconTone: 'amber',
    keywords: ['upload', 'contract'],
  },
  {
    to: '/student/report',
    label: 'Submit Report',
    description: 'Upload your final report.',
    external: false,
    category: 'Finish up',
    icon: FileBarChart,
    iconTone: 'rose',
    keywords: ['final', 'report', 'upload'],
  },
];

const supervisorAssessmentLinks: {
  to: string;
  label: string;
  description: string;
  external: boolean;
  icon: LucideIcon;
  iconTone: LinkIconTone;
}[] = [
  {
    to: '/student/supervisor/visiting',
    label: 'Visiting Supervisor Assessment',
    description: 'Your visiting supervisor can log in here to assess you and enter marks.',
    external: false,
    icon: MapPin,
    iconTone: 'sky',
  },
  {
    to: '/student/supervisor/company',
    label: 'Company Supervisor Assessment',
    description: 'Your company supervisor can log in here to assess you and enter marks.',
    external: false,
    icon: Building2,
    iconTone: 'violet',
  },
];

type StudentGradesResponse = {
  assessmentsReceived?: number;
  assessmentsExpected?: number;
  firstVisitReceived?: boolean;
  secondVisitReceived?: boolean;
  companyReceived?: boolean;
  firstVisitGrade?: number | null;
  secondVisitGrade?: number | null;
  companySupervisorGrade?: number | null;
  visitingSupervisorGrade?: number | null;
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

type StudentRegistrationStatus = { registered: boolean };
type StudentAssumptionStatus = { submitted?: boolean; registered?: boolean };

export function StudentDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [grades, setGrades] = useState<StudentGradesResponse | null>(null);
  const [assignedSupervisor, setAssignedSupervisor] = useState<StudentSupervisorResponse['assigned'] | null>(null);
  const [otherAssignedSupervisor, setOtherAssignedSupervisor] = useState<StudentSupervisorResponse['other_assigned'] | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [getStartedComplete, setGetStartedComplete] = useState(false);
  const photoVersion = typeof localStorage !== 'undefined' ? localStorage.getItem(PROFILE_PHOTO_CACHE_KEY) ?? '' : '';
  const profilePhotoUrl = user?.role === 'student'
    ? `/api/student/profile/photo?t=${photoVersion}`
    : null;
  const [profilePhotoLoaded, setProfilePhotoLoaded] = useState(false);
  const initials = (user?.name ?? 'Student').trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    setProfilePhotoLoaded(false);
  }, [profilePhotoUrl]);

  const refreshOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const [reg, asm] = await Promise.all([
        api.get<StudentRegistrationStatus>('/student/registration').catch(() => ({ registered: false })),
        api.get<StudentAssumptionStatus>('/student/assumption').catch(() => ({ submitted: false })),
      ]);
      setGetStartedComplete(Boolean(reg?.registered) && Boolean(asm?.submitted));
    } finally {
      setOnboardingLoading(false);
    }
  };

  const loadDashboardCards = async () => {
    setCardsLoading(true);
    try {
      const [g, sup] = await Promise.all([
        api.get<StudentGradesResponse>('/student/grades').catch(() => null),
        api.get<StudentSupervisorResponse>('/student/supervisor').catch(() => null),
      ]);
      setGrades(g);
      setAssignedSupervisor(sup?.assigned ?? null);
      setOtherAssignedSupervisor(sup?.other_assigned ?? null);
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardCards().catch(() => undefined);
    const onFocus = () => loadDashboardCards().catch(() => undefined);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshOnboarding().catch(() => undefined);
    const onUpdate = () => refreshOnboarding().catch(() => undefined);
    window.addEventListener('studentOnboardingUpdated', onUpdate);
    return () => window.removeEventListener('studentOnboardingUpdated', onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const assessmentsExpected = grades?.assessmentsExpected ?? 3;

  const totalAssessmentsReceived = useMemo(() => {
    if (typeof grades?.assessmentsReceived === 'number') {
      return grades.assessmentsReceived;
    }
    const first = grades?.firstVisitReceived ?? typeof grades?.firstVisitGrade === 'number';
    const second = grades?.secondVisitReceived ?? typeof grades?.secondVisitGrade === 'number';
    const company = grades?.companyReceived ?? typeof grades?.companySupervisorGrade === 'number';
    return (first ? 1 : 0) + (second ? 1 : 0) + (company ? 1 : 0);
  }, [grades]);

  const assessmentsSubtitle = useMemo(() => {
    if (cardsLoading) return 'Loading your grades…';
    const parts = [
      `1st institutional visit: ${grades?.firstVisitReceived ? 'received' : 'pending'}`,
      `2nd institutional visit: ${grades?.secondVisitReceived ? 'received' : 'pending'}`,
      `company supervisor: ${grades?.companyReceived ? 'received' : 'pending'}`,
    ];
    return parts.join(' · ');
  }, [cardsLoading, grades]);

  return (
    <div className="page-stack min-w-0">
      {/* Hero */}
      <div className="hero-banner bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-14 -bottom-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <ProfilePhotoLightbox
              src={profilePhotoLoaded ? profilePhotoUrl : null}
              className="shrink-0 cursor-zoom-in rounded-2xl border-0 bg-transparent p-0 ring-2 ring-white/30 ring-offset-0 transition hover:ring-white/50"
            >
              <div className="relative flex h-16 w-16 overflow-hidden rounded-2xl">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onLoad={() => setProfilePhotoLoaded(true)}
                    onError={(e) => {
                      setProfilePhotoLoaded(false);
                      const el = e.currentTarget;
                      el.style.display = 'none';
                      const fallback = el.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="flex h-full w-full items-center justify-center bg-white/15 text-xl font-semibold"
                  style={profilePhotoLoaded ? { display: 'none' } : undefined}
                >
                  {initials}
                </div>
              </div>
            </ProfilePhotoLightbox>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Student portal</p>
              <h1 className="mt-1 text-xl font-display font-bold tracking-tight sm:text-2xl md:text-3xl">
                {getTimeBasedGreeting()} {user?.name ?? 'Student'}!
              </h1>
              <p className="mt-1.5 text-sm text-primary-100">
                Everything you need for your industrial attachment, in one place.
              </p>
            </div>
          </div>
          <div className="w-full min-w-0 sm:max-w-[360px] sm:shrink-0">
            <SearchField
              variant="hero"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks (logbook, report, contract...)"
              aria-label="Search tasks"
            />
          </div>
        </div>
      </div>

      {/* Dashboard cards */}
      <section className="stat-grid-4">
        <StatCard
          title="Tasks available"
          value={quickLinks.length}
          variant="primary"
          subtitle="Forms & pages you can access"
          className="h-full !p-4"
          icon={<ListChecks className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />}
        />

        <StatCard
          title="Assessments received"
          value={cardsLoading ? '—' : `${totalAssessmentsReceived} / ${assessmentsExpected}`}
          variant="info"
          subtitle={assessmentsSubtitle}
          className="h-full !p-4 [&_p:last-child]:line-clamp-3"
          icon={<Award className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />}
        />

        <Card className="flex h-full min-h-[6.5rem] flex-col border border-slate-200 bg-white sm:min-h-[7.5rem]" padding="sm">
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <UserCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="text-sm font-semibold text-slate-800">Institutional supervisor</p>
              </div>
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

        <Card className="flex h-full min-h-[6.5rem] flex-col border border-slate-200 bg-white sm:min-h-[7.5rem]" padding="sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                <LayoutGrid className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-sm font-semibold text-slate-800">Quick info</p>
            </div>
            <Link to="/student/instructions" aria-label="Help">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-400"
              >
                <HelpCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Help
              </Button>
            </Link>
          </div>
          <div className="mt-auto">
          <p className="mt-1 text-xs text-slate-500">Index number</p>
          <p className="mt-0.5 font-display text-base font-semibold text-slate-900">{user?.indexNumber ?? '—'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/student/profile">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserPen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Edit profile
              </Button>
            </Link>
          </div>
          </div>
        </Card>
      </section>

      {/* Supervisor assessments – where supervisors enter marks */}
      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 font-display">
              <ShieldCheck className="h-5 w-5 text-primary-600" strokeWidth={1.75} aria-hidden />
              Supervisor assessments
            </h2>
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
                <LinkIconBadge icon={link.icon} tone={link.iconTone} size="lg" />
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
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
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Open assessment
                      <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </Button>
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

        {!onboardingLoading && !getStartedComplete ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Finish the <span className="font-semibold">Get started</span> steps (Registration + Assumption of Duty) to unlock the other sections.
          </div>
        ) : null}

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
          <div className="page-stack">
            {groupedLinks.map((group) => (
              <div key={group.category}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                    {(() => {
                      const CatIcon = categoryMeta[group.category].icon;
                      return (
                        <CatIcon
                          className={`h-4 w-4 ${categoryMeta[group.category].className}`}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      );
                    })()}
                    {group.category}
                  </h3>
                  <span className="text-xs text-slate-500">{group.items.length} item(s)</span>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((link) => (
                    (() => {
                      const locked = !onboardingLoading && !getStartedComplete && link.category !== 'Get started';
                      const cardClasses = locked
                        ? 'border-slate-200 bg-white opacity-60'
                        : 'border-slate-200 bg-white transition-all hover:border-primary-200 hover:shadow-md';

                      const CardInner = (
                        <>
                          <div className="flex-1">
                            <LinkIconBadge icon={link.icon} tone={link.iconTone} />
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {(() => {
                                const CatIcon = categoryMeta[link.category].icon;
                                return (
                                  <CatIcon className="h-3 w-3 opacity-70" strokeWidth={2} aria-hidden />
                                );
                              })()}
                              {link.category}
                              {locked ? (
                                <>
                                  <span className="text-slate-400" aria-hidden>•</span>
                                  <span className="text-amber-700">Locked</span>
                                </>
                              ) : null}
                            </div>
                            <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-primary-700">
                              {link.label}
                            </h4>
                            <p className="mt-1.5 text-sm text-slate-500">{link.description}</p>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                                locked
                                  ? 'border-slate-200 bg-slate-50 text-slate-500'
                                  : 'border-slate-300 bg-white text-slate-700 group-hover:border-primary-200 group-hover:bg-primary-50/50'
                              }`}
                            >
                              {locked ? 'Complete Get started' : 'Open'}
                            </span>
                            <ChevronRight
                              className={`h-5 w-5 shrink-0 transition-colors ${
                                locked ? 'text-slate-300' : 'text-slate-400 group-hover:text-primary-600'
                              }`}
                              strokeWidth={2}
                              aria-hidden
                            />
                          </div>
                        </>
                      );

                      return (
                        <Card
                          key={link.to}
                          className={`group flex flex-col ${cardClasses}`}
                        >
                          {locked ? (
                            <div
                              className="flex h-full flex-col"
                              aria-disabled="true"
                              title="Complete Get started first"
                            >
                              {CardInner}
                            </div>
                          ) : link.external ? (
                            <a href={link.to} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col">
                              {CardInner}
                            </a>
                          ) : (
                            <Link to={link.to} className="flex h-full flex-col">
                              {CardInner}
                            </Link>
                          )}
                        </Card>
                      );
                    })()
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

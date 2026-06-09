import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, Sparkles, Users } from 'lucide-react';
import { VisitScheduleCalendar } from '@/components/calendar/VisitScheduleCalendar';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { Card } from '@/components/ui/Card';
import { api } from '@/services/api';
import {
  formatShortDate,
  parseDateKey,
  toDateKey,
  type CalendarDayMeta,
} from '@/utils/visitScheduleCalendar';

type AvailabilityRow = {
  id: number;
  date: string;
  published_at: string | null;
};

type SelectionRow = {
  date: string;
  count: number;
  students: { student_index: string; student_name: string }[];
};

type ScheduleResponse = {
  supervisor_name: string;
  assigned_students_count: number;
  availability: AvailabilityRow[];
  selections_by_date: SelectionRow[];
};

export function SupervisorVisitSchedulePage() {
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [draftDates, setDraftDates] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ScheduleResponse>('/supervisor/visit-schedule');
      setData(res);
      setDraftDates(new Set(res.availability.map((a) => a.date)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dayMeta = useMemo(() => {
    const meta: Record<string, CalendarDayMeta> = {};
    draftDates.forEach((d) => {
      meta[d] = { ...(meta[d] ?? {}), available: true };
    });
    data?.selections_by_date.forEach((row) => {
      meta[row.date] = {
        ...(meta[row.date] ?? {}),
        available: true,
        studentCount: row.count,
        students: row.students,
      };
    });
    return meta;
  }, [draftDates, data]);

  const selectedDayDetail = useMemo(() => {
    const keys = [...draftDates].sort();
    const withStudents = data?.selections_by_date ?? [];
    return { keys, withStudents };
  }, [draftDates, data]);

  const onDayClick = (dateKey: string) => {
    setSuccess(null);
    setDraftDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const saveAvailability = async (notifyStudents: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/supervisor/visit-schedule', {
        dates: [...draftDates],
        sync: true,
        notify_students: notifyStudents,
      });
      setSuccess(
        notifyStudents
          ? 'Availability saved and students were notified.'
          : 'Availability saved.'
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const notifyOnly = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/supervisor/visit-schedule', { action: 'publish' });
      setSuccess('Reminder sent to all assigned students.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not notify students');
    } finally {
      setPublishing(false);
    }
  };

  const upcomingSelections = (data?.selections_by_date ?? []).filter(
    (r) => r.date >= toDateKey(new Date())
  );

  return (
    <div className="page-stack">
      <div className="hero-banner bg-gradient-to-br from-primary-700 via-primary-600 to-violet-600">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Google Calendar–style scheduling
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Visit availability
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Click days on the calendar to mark when you can visit students. Save and notify them;
              their chosen days appear highlighted with student names.
            </p>
          </div>
          <CalendarDays className="hidden h-16 w-16 text-white/30 sm:block" aria-hidden />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <SuccessModal
        open={!!success}
        message={success ?? ''}
        onClose={() => setSuccess(null)}
      />

      <div className="stat-grid-3">
        <Card className="flex items-center gap-3 p-4">
          <Users className="h-8 w-8 text-primary-600" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assigned students</p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? '…' : data?.assigned_students_count ?? 0}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <CalendarDays className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open visit days</p>
            <p className="text-2xl font-bold text-slate-900">{draftDates.size}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <BellRing className="h-8 w-8 text-violet-600" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Student bookings</p>
            <p className="text-2xl font-bold text-slate-900">
              {(data?.selections_by_date ?? []).reduce((n, r) => n + r.count, 0)}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => saveAvailability(false)} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save availability'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => saveAvailability(true)}
          disabled={saving || loading || draftDates.size === 0}
        >
          Save & notify students
        </Button>
        <Button variant="outline" onClick={notifyOnly} disabled={publishing || loading}>
          {publishing ? 'Sending…' : 'Notify again'}
        </Button>
      </div>

      <div className="visit-cal-legend flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary-100 ring-1 ring-primary-300" />
          Your available days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-violet-200 ring-1 ring-violet-400" />
          Student selected (highlighted)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary-600" />
          Today
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
          Loading calendar…
        </div>
      ) : (
        <VisitScheduleCalendar
          month={month}
          onMonthChange={setMonth}
          dayMeta={dayMeta}
          mode="supervisor-manage"
          activeDates={draftDates}
          onDayClick={onDayClick}
        />
      )}

      <p className="text-xs text-slate-500">
        Tip: click a day again to remove it before saving. Past days cannot be selected.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">Your open days</h2>
          <p className="mt-1 text-sm text-slate-500">Dates students can choose from after you notify them.</p>
          {selectedDayDetail.keys.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No days selected yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {selectedDayDetail.keys.map((d) => (
                <li
                  key={d}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <span>{formatShortDate(d)}</span>
                  <span className="text-xs text-slate-500">{parseDateKey(d).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">Student visit picks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Highlighted on the calendar — who chose which day.
          </p>
          {upcomingSelections.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No student selections yet.</p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {upcomingSelections.map((row) => (
                <li
                  key={row.date}
                  className="rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-3"
                >
                  <p className="font-medium text-violet-900">{formatShortDate(row.date)}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {row.students.map((s) => (
                      <li key={s.student_index}>
                        {s.student_name}{' '}
                        <span className="text-slate-400">({s.student_index})</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

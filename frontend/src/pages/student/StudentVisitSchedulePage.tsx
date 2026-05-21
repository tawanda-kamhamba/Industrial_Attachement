import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarHeart, CheckCircle2, MapPin } from 'lucide-react';
import { VisitScheduleCalendar } from '@/components/calendar/VisitScheduleCalendar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/services/api';
import {
  formatShortDate,
  normalizeDateKey,
  parseDateKey,
  type CalendarDayMeta,
} from '@/utils/visitScheduleCalendar';

type AvailabilityRow = { id: number; date: string; published_at: string | null };
type SelectionRow = { availability_id: number; date: string; selected_at: string | null };

type ScheduleResponse = {
  supervisor: {
    lecturer_name: string;
    lecturer_department: string;
  } | null;
  availability: AvailabilityRow[];
  my_selections: SelectionRow[];
  message?: string;
};

export function StudentVisitSchedulePage() {
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ScheduleResponse>('/student/visit-schedule');
      const availability = (res.availability ?? []).map((a) => ({
        ...a,
        date: normalizeDateKey(a.date),
      }));
      const my_selections = (res.my_selections ?? []).map((s) => ({
        ...s,
        date: normalizeDateKey(s.date),
      }));
      setData({ ...res, availability, my_selections });
      setPicked(new Set(my_selections.map((s) => s.date).filter(Boolean)));

      const firstOpen = availability.map((a) => a.date).filter(Boolean).sort()[0];
      if (firstOpen) {
        setMonth(parseDateKey(firstOpen));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load visit schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableDates = useMemo(
    () =>
      [...(data?.availability ?? [])]
        .map((a) => normalizeDateKey(a.date))
        .filter(Boolean)
        .sort(),
    [data]
  );

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const dayMeta = useMemo(() => {
    const meta: Record<string, CalendarDayMeta> = {};
    availableSet.forEach((d) => {
      meta[d] = { available: true, published: true };
    });
    picked.forEach((d) => {
      meta[d] = { ...(meta[d] ?? {}), selected: true };
    });
    return meta;
  }, [availableSet, picked]);

  const onDayClick = (dateKey: string) => {
    if (!availableSet.has(dateKey)) return;
    setSuccess(null);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const submitSelections = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/student/visit-schedule', { dates: [...picked].sort() });
      setSuccess('Your preferred visit day(s) were saved. Your supervisor has been notified.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save selections');
    } finally {
      setSaving(false);
    }
  };

  const noSupervisor = !loading && data?.supervisor == null;
  const noDates = !loading && (data?.availability.length ?? 0) === 0;

  return (
    <div className="page-stack">
      <div className="hero-banner bg-gradient-to-br from-violet-700 via-primary-600 to-cyan-600">
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <CalendarHeart className="h-3.5 w-3.5" aria-hidden />
            Pick your visit day
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Visit schedule
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/90">
            Choose from your supervisor&apos;s available days — shown on a calendar like Google
            Calendar. Your supervisor sees your picks highlighted.
          </p>
        </div>
      </div>

      {data?.supervisor ? (
        <Card className="flex flex-wrap items-center gap-3 border-primary-100 bg-primary-50/50 p-4">
          <MapPin className="h-8 w-8 shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Institutional supervisor: {data.supervisor.lecturer_name}
            </p>
            {data.supervisor.lecturer_department ? (
              <p className="text-sm text-slate-600">{data.supervisor.lecturer_department}</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      ) : null}

      {noSupervisor ? (
        <Card className="p-6 text-center text-slate-600">
          <p>{data?.message ?? 'No supervisor assigned yet. Contact your department admin.'}</p>
        </Card>
      ) : noDates ? (
        <Card className="p-6 text-center text-slate-600">
          <p>
            Your supervisor has not published visit days yet. You will get a notification when
            dates are available.
          </p>
        </Card>
      ) : (
        <>
          <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-cyan-950">
              Days you can book ({availableDates.length})
            </h2>
            <p className="mt-1 text-sm text-cyan-900/80">
              Highlighted in <strong className="text-cyan-700">cyan</strong> on the calendar — tap a
              date below or on the calendar to select it.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {availableDates.map((d) => {
                const selected = picked.has(d);
                return (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => onDayClick(d)}
                      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                          : 'border-cyan-500 bg-cyan-500 text-white shadow-md hover:bg-cyan-600 hover:border-cyan-600'
                      }`}
                    >
                      {formatShortDate(d)}
                      {selected ? (
                        <span className="rounded-full bg-white/25 px-1.5 text-[0.65rem] uppercase">
                          Selected
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/20 px-1.5 text-[0.65rem] uppercase">
                          Available
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="visit-cal-legend flex flex-wrap gap-4 text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded border-2 border-cyan-500 bg-cyan-100" />
                Available — tap to select
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded border-2 border-emerald-600 bg-emerald-100" />
                Your selection
              </span>
            </div>
            <Button onClick={submitSelections} disabled={saving || picked.size === 0}>
              {saving ? 'Saving…' : 'Confirm my visit day(s)'}
            </Button>
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
              mode="student-select"
              activeDates={picked}
              onDayClick={onDayClick}
            />
          )}

          <Card className="p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Your selections</h2>
            {picked.size === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Tap one or more open days on the calendar, then confirm.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {[...picked].sort().map((d) => (
                  <li
                    key={d}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900"
                  >
                    {formatShortDate(d)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  buildMonthGrid,
  formatMonthYear,
  type CalendarDayMeta,
  toDateKey,
  WEEKDAY_LABELS,
} from '@/utils/visitScheduleCalendar';

export type VisitScheduleCalendarMode =
  | 'supervisor-manage'
  | 'supervisor-view'
  | 'student-select';

type Props = {
  month: Date;
  onMonthChange: (next: Date) => void;
  dayMeta: Record<string, CalendarDayMeta>;
  mode: VisitScheduleCalendarMode;
  /** Dates the user is actively toggling (draft or confirmed selection). */
  activeDates?: Set<string>;
  onDayClick?: (dateKey: string, meta: CalendarDayMeta) => void;
  disabled?: boolean;
};

export function VisitScheduleCalendar({
  month,
  onMonthChange,
  dayMeta,
  mode,
  activeDates,
  onDayClick,
  disabled = false,
}: Props) {
  const todayKey = toDateKey(new Date());
  const cells = useMemo(() => buildMonthGrid(month), [month]);

  const goToday = () => onMonthChange(new Date());
  const goPrev = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  return (
    <div className="visit-cal overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-primary-50/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {formatMonthYear(month)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToday} disabled={disabled}>
            Today
          </Button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            onClick={goPrev}
            disabled={disabled}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            onClick={goNext}
            disabled={disabled}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2.5">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {cells.map(({ date, inMonth, key }) => {
          const meta = dayMeta[key] ?? {};
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const isActive = activeDates?.has(key);
          const hasStudents = (meta.studentCount ?? 0) > 0;
          const isStudentMode = mode === 'student-select';
          const isAvailable = Boolean(meta.available);
          const isStudentOpen = isStudentMode && isAvailable && !isPast;
          const isStudentPicked = isStudentMode && (isActive || meta.selected);
          const clickable =
            !disabled &&
            onDayClick &&
            ((mode === 'supervisor-manage' || mode === 'supervisor-view') && !isPast
              ? true
              : mode === 'student-select'
                ? meta.available && !isPast
                : false);

          let cellClass =
            'visit-cal-cell group relative flex min-h-[4.75rem] flex-col p-1.5 text-left transition sm:min-h-[6rem] sm:p-2 ';
          if (!inMonth) {
            cellClass += 'bg-slate-50/60 text-slate-400 ';
          } else if (isStudentPicked) {
            cellClass +=
              ' visit-cal-selected bg-emerald-100 text-emerald-950 ring-2 ring-inset ring-emerald-500 shadow-sm ';
          } else if (isStudentOpen) {
            cellClass +=
              ' visit-cal-open bg-cyan-100 text-cyan-950 ring-2 ring-inset ring-cyan-500 shadow-sm hover:bg-cyan-200 ';
          } else {
            cellClass += 'bg-white text-slate-800 ';
          }
          if (isToday) {
            cellClass += isStudentOpen || isStudentPicked
              ? ' ring-2 ring-primary-600 ring-offset-1 '
              : ' ring-2 ring-inset ring-primary-400/60 ';
          }
          const isSupervisor =
            mode === 'supervisor-manage' || mode === 'supervisor-view';
          if (isSupervisor && (isActive || meta.available)) {
            cellClass += isActive ? ' visit-cal-available-draft' : ' visit-cal-available';
          }
          if (isSupervisor && hasStudents) {
            cellClass += ' visit-cal-booked';
          }
          if (clickable) cellClass += ' cursor-pointer ';
          if (isPast && inMonth && !isStudentOpen && !isStudentPicked) {
            cellClass += ' opacity-60 ';
          }

          return (
            <button
              key={key}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onDayClick?.(key, meta)}
              className={cellClass}
            >
              <span
                className={`mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                  isToday && !isStudentOpen && !isStudentPicked
                    ? 'bg-primary-600 text-white'
                    : isStudentPicked
                      ? 'bg-emerald-600 text-white'
                      : isStudentOpen
                        ? 'bg-cyan-600 text-white'
                        : inMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                }`}
              >
                {date.getDate()}
              </span>

              {isStudentOpen && !isStudentPicked ? (
                <span className="mt-0.5 inline-flex w-fit max-w-full items-center gap-0.5 rounded-md bg-cyan-600 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white shadow-sm sm:text-[0.65rem]">
                  Available
                </span>
              ) : null}

              {isSupervisor && hasStudents && inMonth ? (
                <div className="mt-auto space-y-0.5">
                  <span className="inline-flex max-w-full truncate rounded-md bg-violet-600/90 px-1.5 py-0.5 text-[0.6rem] font-medium text-white sm:text-[0.65rem]">
                    {meta.studentCount} student{(meta.studentCount ?? 0) === 1 ? '' : 's'}
                  </span>
                  {meta.students && meta.students.length > 0 ? (
                    <ul className="hidden max-h-12 overflow-hidden text-[0.6rem] leading-tight text-violet-900 sm:block">
                      {meta.students.slice(0, 2).map((s) => (
                        <li key={s.student_index} className="truncate font-medium">
                          {s.student_name}
                        </li>
                      ))}
                      {meta.students.length > 2 ? (
                        <li className="text-violet-600">+{meta.students.length - 2} more</li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {isStudentPicked ? (
                <span className="mt-auto inline-flex w-fit rounded-md bg-emerald-700 px-1.5 py-0.5 text-[0.6rem] font-bold text-white shadow-sm sm:text-[0.65rem]">
                  Your pick
                </span>
              ) : null}

              {mode === 'supervisor-manage' && isActive && inMonth ? (
                <span className="mt-auto text-[0.6rem] font-medium text-primary-800">Available</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

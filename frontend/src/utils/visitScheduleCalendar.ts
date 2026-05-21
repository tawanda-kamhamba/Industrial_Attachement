export type CalendarDayMeta = {
  available?: boolean;
  published?: boolean;
  selected?: boolean;
  studentCount?: number;
  students?: { student_index: string; student_name: string }[];
};

/** Normalize API / DB date strings to YYYY-MM-DD for calendar matching. */
export function normalizeDateKey(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  const ts = Date.parse(s);
  if (!Number.isNaN(ts)) {
    return toDateKey(new Date(ts));
  }
  return s;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Sunday-start grid cells for month view (includes padding from prev/next month). */
export function buildMonthGrid(month: Date): { date: Date; inMonth: boolean; key: string }[] {
  const first = startOfMonth(month);
  const startPad = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  const cells: { date: Date; inMonth: boolean; key: string }[] = [];
  for (let i = 0; i < 42; i++) {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + i);
    cells.push({
      date: cell,
      inMonth: cell.getMonth() === month.getMonth(),
      key: toDateKey(cell),
    });
  }
  return cells;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isPastDateKey(key: string): boolean {
  const today = toDateKey(new Date());
  return key < today;
}

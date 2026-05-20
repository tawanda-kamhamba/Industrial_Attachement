/** Client-side table search across one or all string fields. */
export function filterRows<T>(
  rows: T[],
  search: string,
  filterBy: string,
  fieldGetters: Record<string, (row: T) => string | null | undefined>
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;

  const keys =
    filterBy && filterBy !== 'all' && fieldGetters[filterBy]
      ? [filterBy]
      : Object.keys(fieldGetters);

  return rows.filter((row) =>
    keys.some((key) => {
      const raw = fieldGetters[key]?.(row);
      return (raw ?? '').toString().toLowerCase().includes(q);
    })
  );
}

export const STUDENT_FILTER_FIELDS = [
  { value: 'all', label: 'All fields' },
  { value: 'index_number', label: 'Index number' },
  { value: 'student_name', label: 'Student name' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'company_name', label: 'Company' },
  { value: 'programme', label: 'Programme' },
  { value: 'level', label: 'Level' },
  { value: 'session', label: 'Session' },
  { value: 'company_region', label: 'Region' },
  { value: 'status', label: 'Status' },
] as const;

export const ORIENTATION_FILTER_FIELDS = [
  { value: 'all', label: 'All fields' },
  { value: 'student_name', label: 'Student name' },
  { value: 'index_number', label: 'Index number' },
] as const;

export const FINAL_GRADE_FILTER_FIELDS = [
  { value: 'all', label: 'All fields' },
  { value: 'student_name', label: 'Student name' },
  { value: 'index_number', label: 'Index number' },
  { value: 'company_name', label: 'Company' },
  { value: 'complete', label: 'Complete finals only' },
  { value: 'incomplete', label: 'Incomplete only' },
  { value: 'pending_marks', label: 'Pending my marks' },
] as const;

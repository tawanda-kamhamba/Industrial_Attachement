import type { ReactNode } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | string;
  emptyMessage?: string;
  className?: string;
  /** Max height for vertical scroll; header stays sticky. Defaults to 60vh on list tables. */
  maxHeight?: string | null;
}

export const DEFAULT_TABLE_MAX_HEIGHT = 'min(60vh, 32rem)';

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  emptyMessage = 'No data to display.',
  className = '',
  maxHeight = DEFAULT_TABLE_MAX_HEIGHT,
}: DataTableProps<T>) {
  const getValue = (row: T, key: keyof T | string): unknown =>
    (row as Record<string, unknown>)[key as string];

  if (data.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-slate-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const scrollWrapperStyle = maxHeight ? { maxHeight } : undefined;
  const scrollWrapperClass = `overflow-x-auto overscroll-x-contain ${
    maxHeight ? 'overflow-y-auto' : ''
  } rounded-lg`;

  return (
    <div className={`responsive-table-wrap min-w-0 overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <div className={scrollWrapperClass} style={scrollWrapperStyle}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`whitespace-nowrap px-2 py-2.5 text-xs font-medium text-slate-700 sm:px-4 sm:py-3 sm:text-sm ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((row, idx) => {
              const rawKey = getValue(row, keyField);
              // Ensure keys are unique even if the keyField contains duplicate or falsy values
              const safeKey =
                rawKey != null && rawKey !== '' ? `${String(rawKey)}-${idx}` : `row-${idx}`;
              return (
                <tr key={safeKey} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-2 py-2.5 text-xs text-slate-800 sm:px-4 sm:py-3 sm:text-sm ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : String(getValue(row, col.key) ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

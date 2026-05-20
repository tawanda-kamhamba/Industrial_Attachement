import type { ReactNode } from 'react';
import { SearchField } from '@/components/ui/SearchField';

export type TableFilterOption = { value: string; label: string };

type TableFiltersProps = {
  filterBy: string;
  onFilterByChange: (value: string) => void;
  filterOptions: readonly TableFilterOption[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra controls (e.g. status dropdown) shown before filter/search */
  leading?: ReactNode;
  resultCount?: number;
  totalCount?: number;
};

export function TableFilters({
  filterBy,
  onFilterByChange,
  filterOptions,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  leading,
  resultCount,
  totalCount,
}: TableFiltersProps) {
  const showCount =
    resultCount != null && totalCount != null && (search.trim() !== '' || filterBy !== 'all');

  return (
    <div className="toolbar">
      {leading}
      <select
        value={filterBy}
        onChange={(e) => onFilterByChange(e.target.value)}
        className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        aria-label="Filter by field"
      >
        {filterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <SearchField
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label="Search table"
        className="min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-md"
      />
      {showCount ? (
        <span className="text-xs text-slate-500 sm:ml-auto">
          Showing {resultCount} of {totalCount}
        </span>
      ) : null}
    </div>
  );
}

import type { InputHTMLAttributes } from 'react';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export type SearchFieldVariant = 'default' | 'hero';

export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> & {
  variant?: SearchFieldVariant;
  /** Wrapper (positions icon + width). */
  className?: string;
  inputClassName?: string;
};

const defaultInputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 sm:py-2 sm:pl-10 sm:pr-3';

const heroInputClass =
  'w-full min-w-0 rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/70 backdrop-blur focus:border-white/40 focus:bg-white/15 focus:ring-1 focus:ring-white/30';

export function SearchField({
  variant = 'default',
  className = '',
  inputClassName = '',
  placeholder,
  ...inputProps
}: SearchFieldProps) {
  const isHero = variant === 'hero';
  const iconClass = isHero ? 'text-white/80' : 'text-slate-400';

  return (
    <div className={`relative w-full min-w-0 ${className}`.trim()}>
      <span
        className={`pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center sm:left-3.5 ${iconClass}`}
        aria-hidden
      >
        <SearchIcon />
      </span>
      <input
        type="search"
        placeholder={placeholder}
        className={`${isHero ? heroInputClass : defaultInputClass} ${inputClassName}`.trim()}
        {...inputProps}
      />
    </div>
  );
}

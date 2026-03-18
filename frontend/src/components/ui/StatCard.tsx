import React from 'react';

type StatCardVariant = 'primary' | 'success' | 'info' | 'warning' | 'slate' | 'light';

const variantStyles: Record<StatCardVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-primary-600/20',
  success: 'bg-emerald-600 text-white shadow-emerald-600/20',
  info: 'bg-cyan-600 text-white shadow-cyan-600/20',
  warning: 'bg-amber-500 text-slate-900 shadow-amber-500/20',
  slate: 'bg-slate-700 text-white shadow-slate-700/20',
  light: 'border border-slate-200 bg-white text-slate-800 shadow-sm',
};

const ArrowUpRight = () => (
  <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7h-10M17 7v10" />
  </svg>
);

interface StatCardProps {
  title: string;
  value: string | number;
  variant?: StatCardVariant;
  subtitle?: string;
  /** Optional trend e.g. "+3.9%" - shown in green when positive, red when negative (only for light variant) */
  trend?: string;
  icon?: React.ReactNode;
  /** Show arrow icon in corner (default true for light variant) */
  cornerIcon?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  variant = 'primary',
  subtitle,
  trend,
  icon,
  cornerIcon,
  className = '',
}: StatCardProps) {
  const isLight = variant === 'light';
  const showCorner = cornerIcon ?? isLight;
  const corner = showCorner && !icon ? <ArrowUpRight /> : icon;

  return (
    <div
      className={`flex min-h-[7.5rem] flex-col justify-between rounded-2xl p-5 shadow-card transition-all hover:shadow-cardHover ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-snug ${isLight ? 'text-slate-600' : 'opacity-90'}`}>{title}</p>
        {corner && <div className={isLight ? 'text-slate-400' : 'opacity-90'}>{corner}</div>}
      </div>
      <div>
        <p className={`mt-2 text-2xl font-bold tracking-tight font-display md:text-[1.75rem] ${isLight ? 'text-slate-900' : ''}`}>{value}</p>
        {trend && isLight && (
          <span className={`mt-1 inline-block text-xs font-medium ${trend.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
            {trend}
          </span>
        )}
        {subtitle && (
          <p className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'opacity-85'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

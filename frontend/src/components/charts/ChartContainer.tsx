import type { ReactNode } from 'react';

/** Responsive height wrapper for Recharts (parent must have explicit height). */
export function ChartContainer({
  children,
  className = '',
  tall = false,
}: {
  children: ReactNode;
  className?: string;
  /** Taller variant for dashboard pie+legend layouts */
  tall?: boolean;
}) {
  return (
    <div
      className={`chart-container min-w-0 w-full ${tall ? 'chart-container-tall' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

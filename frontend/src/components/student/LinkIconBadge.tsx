import type { LucideIcon } from 'lucide-react';

export type LinkIconTone = 'primary' | 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';

const toneStyles: Record<LinkIconTone, string> = {
  primary: 'bg-primary-50 text-primary-600 ring-primary-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

interface LinkIconBadgeProps {
  icon: LucideIcon;
  tone?: LinkIconTone;
  size?: 'md' | 'lg';
}

export function LinkIconBadge({ icon: Icon, tone = 'primary', size = 'md' }: LinkIconBadgeProps) {
  const box = size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-10 w-10 rounded-xl';
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]';

  return (
    <div
      className={`mb-3 inline-flex shrink-0 items-center justify-center ring-1 ${box} ${toneStyles[tone]}`}
      aria-hidden
    >
      <Icon className={iconSize} strokeWidth={1.75} />
    </div>
  );
}

import { classGradeColor } from '@/lib/grading';

export function ClassGradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${classGradeColor(grade)}`}
    >
      {grade}
    </span>
  );
}

export function MarkCell({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-slate-400">—</span>;
  }
  return <span className="font-medium tabular-nums text-slate-800">{value}</span>;
}

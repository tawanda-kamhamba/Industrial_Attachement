export type FinalGradeWeights = {
  first_visit: number;
  second_visit: number;
  company: number;
  report: number;
  elogbook: number;
};

export type FinalGradeStudent = {
  student_index: string;
  first_name: string;
  last_name: string;
  company_name: string;
  first_visit_grade: number | null;
  second_visit_grade: number | null;
  company_supervisor_grade: number | null;
  elogbook_mark: number | null;
  report_mark: number | null;
  final_mark: number | null;
  letter_grade: string | null;
  is_complete: boolean;
  missing_components: string[];
};

export type FinalGradesResponse = {
  weights: FinalGradeWeights;
  students: FinalGradeStudent[];
};

const COMPONENT_LABELS: Record<string, string> = {
  first_visit: '1st institutional visit',
  second_visit: '2nd institutional visit',
  company: 'Company supervisor',
  report: 'Final report',
  elogbook: 'E-logbook',
};

export function componentLabel(key: string): string {
  return COMPONENT_LABELS[key] ?? key;
}

export function classGradeColor(grade: string | null): string {
  switch (grade) {
    case '1':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
    case '2.1':
      return 'bg-sky-100 text-sky-800 ring-sky-200';
    case '2.2':
      return 'bg-amber-100 text-amber-800 ring-amber-200';
    case '3':
      return 'bg-orange-100 text-orange-800 ring-orange-200';
    case 'F':
      return 'bg-red-100 text-red-800 ring-red-200';
    default:
      return 'bg-slate-100 text-slate-500 ring-slate-200';
  }
}

/** @deprecated use classGradeColor */
export const letterGradeColor = classGradeColor;

export function computePreviewFinal(
  row: Pick<
    FinalGradeStudent,
    | 'first_visit_grade'
    | 'second_visit_grade'
    | 'company_supervisor_grade'
    | 'report_mark'
    | 'elogbook_mark'
  >,
  weights: FinalGradeWeights
): number | null {
  const parts: [number | null, number][] = [
    [row.first_visit_grade, weights.first_visit],
    [row.second_visit_grade, weights.second_visit],
    [row.company_supervisor_grade, weights.company],
    [row.report_mark, weights.report],
    [row.elogbook_mark, weights.elogbook],
  ];
  let total = 0;
  for (const [score, w] of parts) {
    if (score == null) return null;
    total += (score * w) / 100;
  }
  return Math.round(total * 100) / 100;
}

/** Class grade from final mark: 1, 2.1, 2.2, 3, or F */
export function scoreToClassGrade(mark: number | null): string | null {
  if (mark == null) return null;
  if (mark >= 85) return '1';
  if (mark >= 70) return '2.1';
  if (mark >= 60) return '2.2';
  if (mark >= 50) return '3';
  return 'F';
}

/** @deprecated use scoreToClassGrade */
export const scoreToLetter = scoreToClassGrade;

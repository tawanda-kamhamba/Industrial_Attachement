export const ELOGBOOK_DAYS = [
  { day: 'Monday', jobKey: 'monday_job_assigned', skillKey: 'monday_skill_acquired' },
  { day: 'Tuesday', jobKey: 'tuesday_job_assigned', skillKey: 'tuesday_skill_acquired' },
  { day: 'Wednesday', jobKey: 'wednesday_job_assigned', skillKey: 'wednesday_skill_acquired' },
  { day: 'Thursday', jobKey: 'thursday_job_assigned', skillKey: 'thursday_skill_acquired' },
  { day: 'Friday', jobKey: 'friday_job_assigned', skillKey: 'friday_skill_acquired' },
] as const;

export type ElogbookDayFields = {
  monday_job_assigned: string;
  monday_skill_acquired: string;
  tuesday_job_assigned: string;
  tuesday_skill_acquired: string;
  wednesday_job_assigned: string;
  wednesday_skill_acquired: string;
  thursday_job_assigned: string;
  thursday_skill_acquired: string;
  friday_job_assigned: string;
  friday_skill_acquired: string;
};

export type ElogbookExportEntry = ElogbookDayFields & {
  week_number: number;
  supervisor_comment?: string | null;
  supervisor_commenter?: string | null;
  supervisor_commented_at?: string | null;
  updated_at?: string | null;
};

const bulletPrefixRegex = /^\s*([-*•])\s+/;

/** Split logbook field text into display lines (bullets). */
export function logbookFieldToLines(text: string | null | undefined): string[] {
  const raw = (text ?? '').replace(/\r\n/g, '\n');
  return raw
    .split('\n')
    .map((l) => l.replace(bulletPrefixRegex, '').trim())
    .filter(Boolean);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function linesToHtmlList(lines: string[]): string {
  if (lines.length === 0) {
    return '<span class="empty">—</span>';
  }
  return `<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`;
}

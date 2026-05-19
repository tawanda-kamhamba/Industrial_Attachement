/** Pre-written supervisor comments for weekly e-logbook feedback. */
export type ElogbookCommentTemplate = {
  label: string;
  text: string;
};

export const SUPERVISOR_ELOGBOOK_COMMENT_TEMPLATES: ElogbookCommentTemplate[] = [
  {
    label: 'Good work',
    text: 'Well done. Your logbook entry for this week is clear and shows good engagement with your assigned tasks. Keep up the good work.',
  },
  {
    label: 'More detail needed',
    text: 'Please provide more detail on the tasks you performed each day, including specific tools, processes, or responsibilities you were involved in.',
  },
  {
    label: 'Expand skills section',
    text: 'Your skills acquired section needs more depth. Describe the practical skills, techniques, or knowledge you gained and how you applied them during the week.',
  },
  {
    label: 'Improve formatting',
    text: 'Please revise this week’s entry. Use clear bullet points for daily job assignments and ensure each day’s work and skills are recorded separately.',
  },
  {
    label: 'Late / incomplete',
    text: 'This week’s logbook entry is incomplete or was submitted late. Please update and submit the full entry for all working days as soon as possible.',
  },
  {
    label: 'Excellent progress',
    text: 'Excellent progress this week. Your reflections demonstrate strong learning and professional growth. Continue documenting your experience in this manner.',
  },
  {
    label: 'Follow up required',
    text: 'I have reviewed your entry. Please see me during my next visit or contact me to discuss areas that need improvement before the next submission.',
  },
];

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

interface LogbookEntry {
  id: number;
  week_number: number;
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
}

interface ElogbookResponse {
  index_number: string;
  entries: LogbookEntry[];
}

const DAYS = [
  { day: 'Monday', jobKey: 'monday_job_assigned', skillKey: 'monday_skill_acquired' },
  { day: 'Tuesday', jobKey: 'tuesday_job_assigned', skillKey: 'tuesday_skill_acquired' },
  { day: 'Wednesday', jobKey: 'wednesday_job_assigned', skillKey: 'wednesday_skill_acquired' },
  { day: 'Thursday', jobKey: 'thursday_job_assigned', skillKey: 'thursday_skill_acquired' },
  { day: 'Friday', jobKey: 'friday_job_assigned', skillKey: 'friday_skill_acquired' },
] as const;

const emptyWeek = () => ({
  monday_job_assigned: '',
  monday_skill_acquired: '',
  tuesday_job_assigned: '',
  tuesday_skill_acquired: '',
  wednesday_job_assigned: '',
  wednesday_skill_acquired: '',
  thursday_job_assigned: '',
  thursday_skill_acquired: '',
  friday_job_assigned: '',
  friday_skill_acquired: '',
});

const bulletPrefixRegex = /^\s*([-*•])\s+/;
const bulletPrefix = '• ';

function stripBulletPrefixes(text: string): string {
  const raw = (text ?? '').replace(/\r\n/g, '\n');
  return raw
    .split('\n')
    .map((l) => l.replace(bulletPrefixRegex, '').trimEnd())
    .join('\n')
    .trimEnd();
}

function toBulletDisplay(text: string): string {
  const stripped = stripBulletPrefixes(text);
  const lines = stripped.split('\n');
  return lines
    .map((l) => {
      const trimmed = l.trimEnd();
      if (trimmed.trim().length === 0) return '';
      return `${bulletPrefix}${trimmed.replace(bulletPrefixRegex, '').trimStart()}`;
    })
    .join('\n');
}

export function ELogbookPage() {
  const { user } = useAuth();
  const indexNumber = user?.indexNumber ?? '';

  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentWeek, setCurrentWeek] = useState(1);
  const [form, setForm] = useState(emptyWeek());

  useEffect(() => {
    if (!indexNumber) return;
    api
      .get<ElogbookResponse>(`/elogbook/${encodeURIComponent(indexNumber)}`)
      .then((res) => {
        setEntries(res.entries ?? []);
        const maxWeek = res.entries?.length
          ? Math.max(...res.entries.map((e) => e.week_number))
          : 0;
        if (maxWeek >= 1) setCurrentWeek(maxWeek);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [indexNumber]);

  const currentEntry = entries.find((e) => e.week_number === currentWeek);

  useEffect(() => {
    if (currentEntry) {
      setForm({
        monday_job_assigned: toBulletDisplay(currentEntry.monday_job_assigned ?? ''),
        monday_skill_acquired: toBulletDisplay(currentEntry.monday_skill_acquired ?? ''),
        tuesday_job_assigned: toBulletDisplay(currentEntry.tuesday_job_assigned ?? ''),
        tuesday_skill_acquired: toBulletDisplay(currentEntry.tuesday_skill_acquired ?? ''),
        wednesday_job_assigned: toBulletDisplay(currentEntry.wednesday_job_assigned ?? ''),
        wednesday_skill_acquired: toBulletDisplay(currentEntry.wednesday_skill_acquired ?? ''),
        thursday_job_assigned: toBulletDisplay(currentEntry.thursday_job_assigned ?? ''),
        thursday_skill_acquired: toBulletDisplay(currentEntry.thursday_skill_acquired ?? ''),
        friday_job_assigned: toBulletDisplay(currentEntry.friday_job_assigned ?? ''),
        friday_skill_acquired: toBulletDisplay(currentEntry.friday_skill_acquired ?? ''),
      });
    } else {
      setForm(emptyWeek());
    }
  }, [currentWeek, currentEntry?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedForm: typeof form = {
      ...form,
      monday_job_assigned: stripBulletPrefixes(form.monday_job_assigned),
      tuesday_job_assigned: stripBulletPrefixes(form.tuesday_job_assigned),
      wednesday_job_assigned: stripBulletPrefixes(form.wednesday_job_assigned),
      thursday_job_assigned: stripBulletPrefixes(form.thursday_job_assigned),
      friday_job_assigned: stripBulletPrefixes(form.friday_job_assigned),
      monday_skill_acquired: stripBulletPrefixes(form.monday_skill_acquired),
      tuesday_skill_acquired: stripBulletPrefixes(form.tuesday_skill_acquired),
      wednesday_skill_acquired: stripBulletPrefixes(form.wednesday_skill_acquired),
      thursday_skill_acquired: stripBulletPrefixes(form.thursday_skill_acquired),
      friday_skill_acquired: stripBulletPrefixes(form.friday_skill_acquired),
    };

    const filled = DAYS.every(
      (d) =>
        (cleanedForm[d.jobKey as keyof typeof cleanedForm] as string)?.trim() &&
        (cleanedForm[d.skillKey as keyof typeof cleanedForm] as string)?.trim()
    );
    if (!filled) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post<{ success: boolean; error?: string }>('/student/elogbook', {
        week_number: currentWeek,
        ...cleanedForm,
      });
      if (res.success) {
        setMessage({ type: 'success', text: `Week ${currentWeek} ${(res as { updated?: boolean }).updated ? 'updated' : 'saved'} successfully!` });
        const updated = {
          id: 0,
          week_number: currentWeek,
          ...form,
        };
        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.week_number === currentWeek);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...form };
            return next;
          }
          return [...prev, updated];
        });
      } else {
        setMessage({ type: 'error', text: res.error ?? 'Save failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const addNewWeek = () => {
    const maxWeek = entries.length ? Math.max(...entries.map((e) => e.week_number)) : 0;
    setCurrentWeek(maxWeek + 1);
    setForm(emptyWeek());
    setMessage(null);
  };

  if (!indexNumber) {
    return (
      <p className="text-slate-500">You must be logged in as a student to use the e-logbook.</p>
    );
  }

  if (loading) {
    return <p className="text-slate-500">Loading e-logbook...</p>;
  }

  const weekNumbersFromEntries = entries.length
    ? Array.from(new Set(entries.map((e) => e.week_number))).sort((a, b) => a - b)
    : [];
  const weekNumbers = Array.from(new Set([...weekNumbersFromEntries, currentWeek])).sort((a, b) => a - b);
  const hasCurrentWeekData = !!currentEntry;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-slate-900">E-Logbook</h1>
        <Link to="/student">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 p-4 shadow-md">
        <span className="font-medium text-slate-700">Weeks:</span>
        {weekNumbers.length === 0 && <span className="text-slate-500">No weeks yet. Start with Week 1 below.</span>}
        {weekNumbers.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setCurrentWeek(w)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              w === currentWeek
                ? 'bg-primary-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Week {w}
          </button>
        ))}
        <Button variant="primary" size="sm" onClick={addNewWeek} className="ml-2">
          + Add new week
        </Button>
      </div>

      <Card className="p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Week {currentWeek}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-2 text-center font-medium text-slate-700">Day</th>
                  <th className="border border-slate-200 px-4 py-2 text-center font-medium text-slate-700">Job assigned</th>
                  <th className="border border-slate-200 px-4 py-2 text-center font-medium text-slate-700">Skill acquired</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(({ day, jobKey, skillKey }) => (
                  <tr key={day} className="border-b border-slate-200">
                    <td className="border border-slate-200 px-4 py-2 text-center font-medium text-slate-700">
                      {day}
                    </td>
                    <td className="border border-slate-200 p-2">
                      <textarea
                        value={form[jobKey as keyof typeof form] as string}
                        onChange={(e) => setForm((f) => ({ ...f, [jobKey]: e.target.value }))}
                        onFocus={(e) => {
                          const key = jobKey as keyof typeof form;
                          const current = (form[key] as string) ?? '';
                          if (current.trim().length === 0) {
                            const next = bulletPrefix;
                            setForm((f) => ({ ...f, [jobKey]: next }));
                            requestAnimationFrame(() => {
                              try {
                                e.currentTarget.selectionStart = next.length;
                                e.currentTarget.selectionEnd = next.length;
                              } catch {
                                // ignore
                              }
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            // Insert newline + bullet prefix at the caret position.
                            e.preventDefault();
                            const el = e.currentTarget;
                            const start = el.selectionStart ?? 0;
                            const end = el.selectionEnd ?? start;
                            const value = (form[jobKey as keyof typeof form] as string) ?? '';

                            const insert = `\n${bulletPrefix}`;
                            const nextValue = value.slice(0, start) + insert + value.slice(end);
                            const nextCaret = start + insert.length;

                            setForm((f) => ({ ...f, [jobKey]: nextValue }));
                            requestAnimationFrame(() => {
                              try {
                                el.selectionStart = nextCaret;
                                el.selectionEnd = nextCaret;
                              } catch {
                                // ignore
                              }
                            });
                            return;
                          }

                          // If user starts typing at the beginning of an empty line, ensure the bullet prefix exists.
                          if (
                            e.key.length === 1 &&
                            !e.ctrlKey &&
                            !e.metaKey &&
                            !e.altKey &&
                            !e.shiftKey
                          ) {
                            const el = e.currentTarget;
                            const start = el.selectionStart ?? 0;
                            const end = el.selectionEnd ?? start;
                            const value = (form[jobKey as keyof typeof form] as string) ?? '';

                            // Find current line start (after last newline).
                            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                            const atLineStart = start === lineStart;
                            const selectionIsEmpty = start === end;

                            if (atLineStart && selectionIsEmpty) {
                              const currentLine = value.slice(lineStart, start);
                              const nextTwo = value.slice(lineStart, lineStart + bulletPrefix.length);
                              if (currentLine.trim().length === 0 && !nextTwo.startsWith(bulletPrefix)) {
                                e.preventDefault();
                                const nextValue = value.slice(0, lineStart) + bulletPrefix + e.key + value.slice(end);
                                const nextCaret = lineStart + bulletPrefix.length + 1;
                                setForm((f) => ({ ...f, [jobKey]: nextValue }));
                                requestAnimationFrame(() => {
                                  try {
                                    el.selectionStart = nextCaret;
                                    el.selectionEnd = nextCaret;
                                  } catch {
                                    // ignore
                                  }
                                });
                                return;
                              }
                            }
                          }

                          // Let default behavior handle everything else.
                        }}
                        onBlur={(e) => {
                          const normalized = toBulletDisplay(stripBulletPrefixes(e.target.value));
                          setForm((f) => ({ ...f, [jobKey]: normalized }));
                        }}
                        className="min-h-[80px] w-full resize-y rounded border border-slate-300 px-2 py-1.5 text-sm leading-6 text-slate-800 focus:outline-none"
                        rows={4}
                        placeholder={`Add job points for ${day}...`}
                      />
                    </td>
                    <td className="border border-slate-200 p-2">
                      <textarea
                        value={form[skillKey as keyof typeof form] as string}
                        onChange={(e) => setForm((f) => ({ ...f, [skillKey]: e.target.value }))}
                        onFocus={(e) => {
                          const key = skillKey as keyof typeof form;
                          const current = (form[key] as string) ?? '';
                          if (current.trim().length === 0) {
                            const next = bulletPrefix;
                            setForm((f) => ({ ...f, [skillKey]: next }));
                            requestAnimationFrame(() => {
                              try {
                                e.currentTarget.selectionStart = next.length;
                                e.currentTarget.selectionEnd = next.length;
                              } catch {
                                // ignore
                              }
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const el = e.currentTarget;
                            const start = el.selectionStart ?? 0;
                            const end = el.selectionEnd ?? start;
                            const value = (form[skillKey as keyof typeof form] as string) ?? '';

                            const insert = `\n${bulletPrefix}`;
                            const nextValue = value.slice(0, start) + insert + value.slice(end);
                            const nextCaret = start + insert.length;

                            setForm((f) => ({ ...f, [skillKey]: nextValue }));
                            requestAnimationFrame(() => {
                              try {
                                el.selectionStart = nextCaret;
                                el.selectionEnd = nextCaret;
                              } catch {
                                // ignore
                              }
                            });
                            return;
                          }

                          if (
                            e.key.length === 1 &&
                            !e.ctrlKey &&
                            !e.metaKey &&
                            !e.altKey &&
                            !e.shiftKey
                          ) {
                            const el = e.currentTarget;
                            const start = el.selectionStart ?? 0;
                            const end = el.selectionEnd ?? start;
                            const value = (form[skillKey as keyof typeof form] as string) ?? '';

                            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                            const atLineStart = start === lineStart;
                            const selectionIsEmpty = start === end;

                            if (atLineStart && selectionIsEmpty) {
                              const currentLine = value.slice(lineStart, start);
                              const nextTwo = value.slice(lineStart, lineStart + bulletPrefix.length);
                              if (currentLine.trim().length === 0 && !nextTwo.startsWith(bulletPrefix)) {
                                e.preventDefault();
                                const nextValue =
                                  value.slice(0, lineStart) + bulletPrefix + e.key + value.slice(end);
                                const nextCaret = lineStart + bulletPrefix.length + 1;
                                setForm((f) => ({ ...f, [skillKey]: nextValue }));
                                requestAnimationFrame(() => {
                                  try {
                                    el.selectionStart = nextCaret;
                                    el.selectionEnd = nextCaret;
                                  } catch {
                                    // ignore
                                  }
                                });
                                return;
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const normalized = toBulletDisplay(stripBulletPrefixes(e.target.value));
                          setForm((f) => ({ ...f, [skillKey]: normalized }));
                        }}
                        className="min-h-[80px] w-full resize-y rounded border border-slate-300 px-2 py-1.5 text-sm leading-6 text-slate-800 focus:outline-none"
                        rows={3}
                        placeholder={`Add skills acquired for ${day}...`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {hasCurrentWeekData ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Saving...' : 'Save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

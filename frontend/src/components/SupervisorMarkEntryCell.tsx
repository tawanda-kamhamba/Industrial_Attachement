import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';

type MarkField = 'report_mark' | 'elogbook_mark';

export function SupervisorMarkEntryCell({
  indexNumber,
  field,
  initialMark,
  onSaved,
}: {
  indexNumber: string;
  field: MarkField;
  initialMark: number | null;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(initialMark != null ? String(initialMark) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialMark != null ? String(initialMark) : '');
  }, [initialMark, indexNumber]);

  const label = field === 'report_mark' ? 'Final report mark' : 'Final e-logbook mark';

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === '') {
      setError('Enter a mark (0–100).');
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      setError('Mark must be between 0 and 100.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await api.post<{ success: boolean; error?: string }>('/supervisor/final-grades', {
        index_number: indexNumber,
        [field]: n,
      });
      setSuccessMessage(`${label} saved successfully.`);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        placeholder="0–100"
        aria-label={`${label} for ${indexNumber}`}
        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-slate-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
      />
      <Button size="sm" variant="primary" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
      {error && <span className="max-w-[8rem] text-center text-[10px] text-red-600">{error}</span>}
      <SuccessModal
        open={!!successMessage}
        message={successMessage ?? ''}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}

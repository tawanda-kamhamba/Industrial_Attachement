import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ContractResubmitDialogProps {
  open: boolean;
  studentLabel?: string;
  submitting?: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function ContractResubmitDialog({
  open,
  studentLabel,
  submitting = false,
  onConfirm,
  onCancel,
}: ContractResubmitDialogProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(note.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!submitting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Allow contract resubmission</h2>
        {studentLabel ? (
          <p className="mt-1 text-sm text-slate-600">
            Student: <span className="font-medium text-slate-800">{studentLabel}</span>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          The student will be able to upload a new contract PDF. Status will be set to pending.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="contract-resubmit-note" className="block text-sm font-medium text-slate-700">
              Note to student (optional)
            </label>
            <textarea
              id="contract-resubmit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Please upload a version with all signatures…"
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Allow resubmission'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

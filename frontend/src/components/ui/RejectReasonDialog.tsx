import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface RejectReasonDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  subjectLabel?: string;
  confirmLabel?: string;
  submitting?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectReasonDialog({
  open,
  title = 'Reject',
  description = 'Provide a reason. The student will be notified.',
  subjectLabel,
  confirmLabel = 'Confirm rejection',
  submitting = false,
  onConfirm,
  onCancel,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please enter a reason.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-reason-title"
      onClick={() => {
        if (!submitting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reject-reason-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {subjectLabel ? (
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{subjectLabel}</span>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="reject-reason-input" className="block text-sm font-medium text-slate-700">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="reject-reason-input"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Explain why you cannot accept this request…"
              disabled={submitting}
              autoFocus
            />
            {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={submitting}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {submitting ? 'Submitting…' : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

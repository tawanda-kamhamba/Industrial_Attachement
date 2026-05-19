import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ContractRejectDialogProps {
  open: boolean;
  studentLabel?: string;
  submitting?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ContractRejectDialog({
  open,
  studentLabel,
  submitting = false,
  onConfirm,
  onCancel,
}: ContractRejectDialogProps) {
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
      setError('Please enter a reason for rejection.');
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
      aria-labelledby="contract-reject-title"
      onClick={() => {
        if (!submitting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="contract-reject-title" className="text-lg font-semibold text-slate-900">
          Reject contract
        </h2>
        {studentLabel ? (
          <p className="mt-1 text-sm text-slate-600">
            Student: <span className="font-medium text-slate-800">{studentLabel}</span>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Provide a reason. The student will see this on their contract status page.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="contract-reject-reason" className="block text-sm font-medium text-slate-700">
              Rejection reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="contract-reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Missing signatures, incorrect company details, wrong document version…"
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
              {submitting ? 'Rejecting…' : 'Reject contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

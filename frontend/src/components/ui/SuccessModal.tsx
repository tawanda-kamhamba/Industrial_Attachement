import { Button } from '@/components/ui/Button';

interface SuccessModalProps {
  open: boolean;
  message: string;
  title?: string;
  onClose: () => void;
}

export function SuccessModal({
  open,
  message,
  title = 'Success',
  onClose,
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600"
            aria-hidden
          >
            ✓
          </span>
          <h2 id="success-modal-title" className="mt-4 text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={onClose} className="min-w-[7rem]">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

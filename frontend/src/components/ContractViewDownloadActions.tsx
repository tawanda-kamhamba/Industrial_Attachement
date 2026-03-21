import { useState } from 'react';
import type { ContractRole } from '@/utils/openDownload';
import { loadContractIntoViewWindow, downloadContractPdf } from '@/utils/openDownload';

type Props = {
  role: ContractRole;
  contractId: number;
  /** Shown next to actions; used as download filename when server omits one */
  fileLabel: string;
  /** compact = one line; stacked = filename on top */
  layout?: 'compact' | 'stacked';
  onError: (message: string) => void;
};

export function ContractViewDownloadActions({
  role,
  contractId,
  fileLabel,
  layout = 'compact',
  onError,
}: Props) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  const handleViewClick = () => {
    // Open tab synchronously in the click stack (avoids pop-up block after async/React gaps).
    const w = window.open('about:blank', '_blank');
    if (!w) {
      onError('Pop-up blocked. Allow pop-ups for this site to view the contract.');
      return;
    }
    setBusy('view');
    void loadContractIntoViewWindow(w, role, contractId)
      .catch((e) => onError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => setBusy(null));
  };

  const runDownload = async () => {
    setBusy('download');
    try {
      await downloadContractPdf(role, contractId, fileLabel);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const linkClass =
    'text-primary-600 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed';

  const actions = (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        className={linkClass}
        disabled={busy !== null}
        onClick={handleViewClick}
      >
        {busy === 'view' ? 'Opening…' : 'View'}
      </button>
      <span className="text-slate-300 select-none" aria-hidden>
        |
      </span>
      <button
        type="button"
        className={linkClass}
        disabled={busy !== null}
        onClick={() => void runDownload()}
      >
        {busy === 'download' ? 'Downloading…' : 'Download'}
      </button>
    </span>
  );

  if (layout === 'stacked') {
    return (
      <div className="space-y-1">
        {fileLabel ? <span className="text-slate-800 font-medium block">{fileLabel}</span> : null}
        {actions}
      </div>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {actions}
      {fileLabel ? <span className="text-slate-600 text-sm">({fileLabel})</span> : null}
    </span>
  );
}

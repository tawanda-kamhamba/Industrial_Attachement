import { useState } from 'react';
import type { ReportRole } from '@/utils/openDownload';
import { loadReportIntoViewWindow, downloadReportFile } from '@/utils/openDownload';

type Props = {
  role: ReportRole;
  /** Stored filename on server (basename) */
  storageFilename: string;
  /** Human-friendly label (download filename only; not shown when layout is actions-only) */
  displayLabel: string;
  /** actions-only = View | Download only (no document name in the UI) */
  layout?: 'compact' | 'stacked' | 'actions-only';
  onError: (message: string) => void;
};

export function ReportViewDownloadActions({
  role,
  storageFilename,
  displayLabel,
  layout = 'compact',
  onError,
}: Props) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  const handleViewClick = () => {
    const w = window.open('about:blank', '_blank');
    if (!w) {
      onError('Pop-up blocked. Allow pop-ups for this site to view the report.');
      return;
    }
    setBusy('view');
    void loadReportIntoViewWindow(w, role, storageFilename)
      .catch((e) => onError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => setBusy(null));
  };

  const runDownload = async () => {
    setBusy('download');
    try {
      await downloadReportFile(role, storageFilename, displayLabel);
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

  if (layout === 'actions-only') {
    const a11yName = (displayLabel || storageFilename).trim() || 'Report file';
    return (
      <span
        className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
        aria-label={`View or download ${a11yName}`}
      >
        {actions}
      </span>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className="space-y-1">
        {displayLabel ? <span className="text-slate-800 font-medium block break-all">{displayLabel}</span> : null}
        {actions}
      </div>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {actions}
      {displayLabel ? <span className="text-slate-600 text-sm break-all">({displayLabel})</span> : null}
    </span>
  );
}

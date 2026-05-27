import { apiBaseUrl } from '@/services/api';

/**
 * Open PDFs/files that require the PHP session cookie.
 * Plain <a href="/api/..."> on the Vite dev server often returns the SPA HTML → React sends users to /login.
 */
const apiBase = apiBaseUrl;

function parseFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const star = /filename\*=UTF-8''([^;\s]+)/i.exec(cd);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/"/g, ''));
    } catch {
      return star[1];
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(cd);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;\s]+)/i.exec(cd);
  if (plain?.[1]) return plain[1].replace(/"/g, '');
  return null;
}

function safeDownloadFilename(name: string, fallback = 'download'): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '-').trim();
  return base || fallback;
}

export type ContractRole = 'admin' | 'supervisor';

async function fetchContractBlob(
  role: ContractRole,
  contractId: number | string
): Promise<{ blob: Blob; filename: string }> {
  const id = Number(contractId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Invalid contract id');
  }
  const path = `/${role}/contracts/download/${id}`;
  const url = `${apiBase}${path}`;
  const res = await fetch(url, { credentials: 'include' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error || `Request failed (${res.status})`);
    }
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Request failed (${res.status})`);
  }
  if (ct.includes('application/json')) {
    throw new Error('Unexpected JSON response');
  }
  const blob = await res.blob();
  const fromHeader = parseFilenameFromContentDisposition(res.headers.get('content-disposition'));
  const filename = fromHeader || 'contract.pdf';
  return { blob, filename };
}

const CONTRACT_VIEW_LOADING_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading…</title></head><body style="margin:0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;color:#64748b">Loading contract…</body></html>';

/**
 * Fetch the contract and show it in an **already-opened** window (e.g. opened synchronously in onClick).
 * Use this from React handlers so pop-up blockers do not run after async gaps.
 */
export async function loadContractIntoViewWindow(
  w: Window,
  role: ContractRole,
  contractId: number | string
): Promise<void> {
  const id = Number(contractId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Invalid contract id');
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  try {
    w.document.write(CONTRACT_VIEW_LOADING_HTML);
    w.document.close();
  } catch {
    /* tab may stay blank until navigation */
  }

  try {
    const { blob } = await fetchContractBlob(role, id);
    const typed =
      blob.type && blob.type !== 'application/octet-stream'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(typed);
    w.location.href = objectUrl;
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
  } catch (e) {
    try {
      w.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
}

/**
 * Open contract in a new tab. Prefer opening `about:blank` in the same synchronous click handler
 * and calling {@link loadContractIntoViewWindow} if pop-ups are still blocked here.
 */
export async function viewContractPdf(role: ContractRole, contractId: number | string): Promise<void> {
  const w = window.open('about:blank', '_blank');
  if (!w) {
    throw new Error('Pop-up blocked. Allow pop-ups for this site to view the contract.');
  }
  return loadContractIntoViewWindow(w, role, contractId);
}

/**
 * Save contract file via browser download. `preferredFilename` overrides server suggestion when set.
 */
export async function downloadContractPdf(
  role: ContractRole,
  contractId: number | string,
  preferredFilename?: string
): Promise<void> {
  const { blob, filename } = await fetchContractBlob(role, contractId);
  const name = safeDownloadFilename(preferredFilename?.trim() || filename, 'contract.pdf');
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** @deprecated Prefer viewContractPdf or downloadContractPdf */
export async function openContractPdf(role: ContractRole, contractId: number | string): Promise<void> {
  return viewContractPdf(role, contractId);
}

export type ReportRole = 'admin' | 'supervisor';

function reportMimeFromStorageName(storageFilename: string): string {
  const ext = storageFilename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/octet-stream';
}

async function fetchReportBlob(role: ReportRole, storageFilename: string): Promise<Blob> {
  const name = storageFilename.trim();
  if (!name || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid file name');
  }
  const enc = encodeURIComponent(name);
  const url = `${apiBase}/${role}/reports/download/${enc}`;
  const res = await fetch(url, { credentials: 'include' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error || `Request failed (${res.status})`);
    }
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Request failed (${res.status})`);
  }
  if (ct.includes('application/json')) {
    throw new Error('Unexpected JSON response');
  }
  return res.blob();
}

const REPORT_VIEW_LOADING_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading…</title></head><body style="margin:0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;color:#64748b">Loading report…</body></html>';

/**
 * Load report into a tab opened synchronously on click (avoids pop-up blockers).
 */
export async function loadReportIntoViewWindow(
  w: Window,
  role: ReportRole,
  storageFilename: string
): Promise<void> {
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  try {
    w.document.write(REPORT_VIEW_LOADING_HTML);
    w.document.close();
  } catch {
    /* ignore */
  }

  try {
    const blob = await fetchReportBlob(role, storageFilename);
    const mime = reportMimeFromStorageName(storageFilename);
    const typed =
      blob.type && blob.type !== 'application/octet-stream'
        ? blob
        : new Blob([blob], { type: mime });
    const objectUrl = URL.createObjectURL(typed);
    w.location.href = objectUrl;
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
  } catch (e) {
    try {
      w.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export async function downloadReportFile(
  role: ReportRole,
  storageFilename: string,
  preferredFilename?: string
): Promise<void> {
  const blob = await fetchReportBlob(role, storageFilename);
  const name = safeDownloadFilename(
    preferredFilename?.trim() || storageFilename,
    storageFilename.includes('.') ? storageFilename : 'report'
  );
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** e.g. path = "/some/endpoint?x=1" or "/admin/contracts/download/1" */
export async function openAuthenticatedApiDownload(pathAndQuery: string): Promise<void> {
  const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
  const url = `${apiBase}${path}`;

  const w = window.open('about:blank', '_blank');
  if (!w) {
    const res = await fetch(url, { credentials: 'include' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (ct.includes('application/json')) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error || `Download failed (${res.status})`);
      }
      const text = await res.text();
      throw new Error(text.slice(0, 200) || `Download failed (${res.status})`);
    }
    if (ct.includes('application/json')) {
      throw new Error('Unexpected JSON response from download');
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'download';
    a.rel = 'noopener noreferrer';
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
    return;
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }

  const res = await fetch(url, { credentials: 'include' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    try {
      w.close();
    } catch {
      /* ignore */
    }
    if (ct.includes('application/json')) {
      const j = (await res.json()) as { error?: string };
      throw new Error(j.error || `Download failed (${res.status})`);
    }
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Download failed (${res.status})`);
  }
  if (ct.includes('application/json')) {
    try {
      w.close();
    } catch {
      /* ignore */
    }
    throw new Error('Unexpected JSON response from download');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  w.location.href = objectUrl;
  setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}

/**
 * Legacy: open report via static /iasms path (no session). Prefer {@link loadReportIntoViewWindow} /
 * {@link downloadReportFile} with admin or supervisor API for staff views.
 */
export function openReportUpload(filename: string): void {
  const enc = encodeURIComponent(filename);
  const backendOrigin =
    typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : '';
  const url = backendOrigin
    ? `${backendOrigin}/iasms/submit_report/uploads/${enc}`
    : `/iasms/submit_report/uploads/${enc}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

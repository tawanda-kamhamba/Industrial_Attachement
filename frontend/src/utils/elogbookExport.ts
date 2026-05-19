import {
  ELOGBOOK_DAYS,
  type ElogbookExportEntry,
  escapeHtml,
  linesToHtmlList,
  logbookFieldToLines,
} from './elogbookFormat';

export type ElogbookExportMeta = {
  studentName: string;
  indexNumber: string;
  entries: ElogbookExportEntry[];
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function weekBlock(entry: ElogbookExportEntry): string {
  const rows = ELOGBOOK_DAYS.map(({ day, jobKey, skillKey }) => {
    const jobs = logbookFieldToLines(entry[jobKey as keyof ElogbookExportEntry] as string);
    const skills = logbookFieldToLines(entry[skillKey as keyof ElogbookExportEntry] as string);
    return `
      <tr>
        <th scope="row">${escapeHtml(day)}</th>
        <td>${linesToHtmlList(jobs)}</td>
        <td>${linesToHtmlList(skills)}</td>
      </tr>`;
  }).join('');
  const updated = entry.updated_at ? `<div class="week-meta">Last updated ${escapeHtml(formatDate(entry.updated_at))}</div>` : '';

  return `
  <section class="week-card">
    <header class="week-header">
      <span class="week-badge">Week ${entry.week_number}</span>
      ${updated}
    </header>
    <table class="week-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Job assigned</th>
          <th>Skill acquired</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>`;
}

/** Build a self-contained HTML document for print or download. */
export function buildElogbookExportHtml(meta: ElogbookExportMeta): string {
  const sorted = [...meta.entries].sort((a, b) => a.week_number - b.week_number);
  const generated = new Date().toLocaleString();
  const safeName = escapeHtml(meta.studentName || 'Student');
  const safeIndex = escapeHtml(meta.indexNumber);

  const weeksHtml =
    sorted.length > 0
      ? sorted.map(weekBlock).join('\n')
      : `<p class="no-weeks">No logbook weeks have been saved yet.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Industrial Attachment E-Logbook — ${safeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Outfit:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --primary-600: #0070c4;
      --primary-700: #01599f;
      --primary-800: #064b83;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-500: #64748b;
      --slate-700: #334155;
      --slate-900: #0f172a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem 1.5rem 3rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: var(--slate-900);
      background: var(--slate-50);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc {
      max-width: 920px;
      margin: 0 auto;
    }
    .cover {
      background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-600) 100%);
      color: #fff;
      border-radius: 16px;
      padding: 2rem 2.25rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(6, 75, 131, 0.25);
    }
    .cover-eyebrow {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.85;
      margin: 0 0 0.5rem;
    }
    .cover h1 {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      line-height: 1.2;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem 1.5rem;
    }
    .cover-item label {
      display: block;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.75;
      margin-bottom: 0.2rem;
    }
    .cover-item span {
      font-size: 0.95rem;
      font-weight: 600;
    }
    .toc {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 2rem;
    }
    .toc h2 {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 0.85rem;
      margin: 0 0 0.75rem;
      color: var(--slate-700);
    }
    .toc-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .toc-list li {
      background: var(--slate-100);
      border-radius: 999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-700);
    }
    .week-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 14px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      page-break-inside: avoid;
    }
    .week-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.85rem 1.25rem;
      background: var(--slate-100);
      border-bottom: 1px solid var(--slate-200);
    }
    .week-badge {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary-700);
    }
    .week-meta {
      font-size: 0.75rem;
      color: var(--slate-500);
    }
    .week-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .week-table thead th {
      text-align: left;
      padding: 0.65rem 1rem;
      background: var(--slate-50);
      font-weight: 600;
      color: var(--slate-700);
      border-bottom: 1px solid var(--slate-200);
    }
    .week-table th[scope="row"] {
      width: 88px;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--slate-700);
      vertical-align: top;
      border-bottom: 1px solid var(--slate-100);
      background: #fafbfc;
    }
    .week-table td {
      padding: 0.75rem 1rem;
      vertical-align: top;
      border-bottom: 1px solid var(--slate-100);
    }
    .week-table tbody tr:last-child th,
    .week-table tbody tr:last-child td {
      border-bottom: none;
    }
  .week-table ul {
      margin: 0;
      padding-left: 1.1rem;
    }
    .week-table li {
      margin-bottom: 0.25rem;
    }
    .week-table li:last-child {
      margin-bottom: 0;
    }
    .empty {
      color: var(--slate-500);
    }
    .no-weeks {
      text-align: center;
      color: var(--slate-500);
      padding: 3rem 1rem;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--slate-200);
      font-size: 0.75rem;
      color: var(--slate-500);
      text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .doc { max-width: none; }
      .cover { border-radius: 0; margin-bottom: 1.5rem; }
      .week-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <header class="cover">
      <p class="cover-eyebrow">Industrial Attachment Management System</p>
      <h1>Weekly E-Logbook</h1>
      <div class="cover-grid">
        <div class="cover-item">
          <label>Student</label>
          <span>${safeName}</span>
        </div>
        <div class="cover-item">
          <label>Index number</label>
          <span>${safeIndex}</span>
        </div>
        <div class="cover-item">
          <label>Weeks recorded</label>
          <span>${sorted.length}</span>
        </div>
        <div class="cover-item">
          <label>Generated</label>
          <span>${escapeHtml(generated)}</span>
        </div>
      </div>
    </header>
    ${
      sorted.length > 1
        ? `<nav class="toc" aria-label="Week list">
      <h2>Contents</h2>
      <ul class="toc-list">${sorted.map((e) => `<li>Week ${e.week_number}</li>`).join('')}</ul>
    </nav>`
        : ''
    }
    <main>
      ${weeksHtml}
    </main>
    <footer class="footer">
      IASMS · Industrial Attachment E-Logbook · ${escapeHtml(generated)}
    </footer>
  </div>
</body>
</html>`;
}

export function downloadElogbookHtml(meta: ElogbookExportMeta): void {
  const html = buildElogbookExportHtml(meta);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeIndex = meta.indexNumber.replace(/[^\w.-]+/g, '_') || 'student';
  const a = document.createElement('a');
  a.href = url;
  a.download = `elogbook_${safeIndex}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Print without opening a pop-up (uses a hidden iframe). */
export function printElogbook(meta: ElogbookExportMeta): void {
  const html = buildElogbookExportHtml(meta);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'E-logbook print');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error('Could not prepare print view.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  let printed = false;
  const runPrint = () => {
    if (printed || cleaned) return;
    printed = true;
    win.focus();
    win.print();
  };

  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 120_000);

  iframe.onload = () => {
    window.setTimeout(runPrint, 300);
  };
  // Fallback when onload does not fire reliably after document.write
  window.setTimeout(runPrint, 600);
}

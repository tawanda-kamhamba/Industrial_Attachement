import type { AdminChartsData } from '@/pages/admin/AdminDashboard';
import type { AdminDashboardStats, ChartDataPoint } from '@/types';

export type AdminDashboardPrintData = {
  stats: AdminDashboardStats;
  charts: AdminChartsData;
  generatedAt: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function logoUrl(): string {
  const origin = window.location.origin;
  const path = window.location.pathname;
  if (path.includes('/iasms/app')) {
    return `${origin}/iasms/img/header_log.png`;
  }
  return `${origin}/img/header_log.png`;
}

function dataTable(title: string, rows: ChartDataPoint[], extraCol?: { header: string; render: (row: ChartDataPoint, total: number) => string }) {
  if (!rows.length) {
    return `<section class="block"><h2>${escapeHtml(title)}</h2><p class="muted">No data</p></section>`;
  }
  const total = rows.reduce((sum, r) => sum + Number(r.value ?? 0), 0);
  const headExtra = extraCol ? `<th>${escapeHtml(extraCol.header)}</th>` : '';
  const body = rows
    .map((row) => {
      const name = escapeHtml(String(row.name ?? ''));
      const value = Number(row.value ?? 0);
      const extra = extraCol ? `<td>${escapeHtml(extraCol.render(row, total))}</td>` : '';
      return `<tr><td>${name}</td><td class="num">${value}</td>${extra}</tr>`;
    })
    .join('');
  const totalRow = extraCol
    ? `<tr class="total"><td>Total</td><td class="num">${total}</td><td>100%</td></tr>`
    : `<tr class="total"><td>Total</td><td class="num">${total}</td></tr>`;

  return `
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr><th>Name</th><th>Count</th>${headExtra}</tr></thead>
        <tbody>${body}${totalRow}</tbody>
      </table>
    </section>`;
}

function buildAdminDashboardPrintHtml({ stats, charts, generatedAt }: AdminDashboardPrintData): string {
  const s = stats;
  const metrics = [
    ['Registered Students', s.registeredStudents, 'Total in system'],
    ['Orientation Checklists', s.orientationChecklists, 'Submitted'],
    ['E-Logbooks Submitted', s.elogbooksSubmitted, 'Weekly entries'],
    ['Contracts Approved', s.contractsApproved, `${s.contractsPending} pending`],
    ['Reports Submitted', s.reportsSubmitted, 'Final reports'],
    ['Student Assumptions', s.assumptionsCount, 'Assumption of duty'],
    ['Visiting Scores', s.visitingScoresCount, 'Assessment count'],
    ['Company Scores', s.companyScoresCount, 'Assessment count'],
  ];

  const metricsHtml = metrics
    .map(
      ([title, value, sub]) => `
      <div class="metric">
        <p class="metric-label">${escapeHtml(String(title))}</p>
        <p class="metric-value">${escapeHtml(String(value))}</p>
        <p class="metric-sub">${escapeHtml(String(sub))}</p>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>IASMS Attachment Stats — ${escapeHtml(generatedAt)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 16px 20px;
      font-size: 11pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #0c8ee6;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header img { height: 48px; width: auto; object-fit: contain; }
    .header h1 { margin: 0; font-size: 18pt; font-weight: 700; }
    .header .tagline { margin: 2px 0 0; font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .header .date { font-size: 10pt; color: #475569; font-weight: 600; white-space: nowrap; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .metric {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .metric:nth-child(1) {
      background: #0c8ee6;
      color: #fff;
      border-color: #0a7acc;
    }
    .metric:nth-child(1) .metric-label,
    .metric:nth-child(1) .metric-sub { color: rgba(255,255,255,0.9); }
    .metric-label { margin: 0; font-size: 8pt; font-weight: 600; color: #64748b; }
    .metric-value { margin: 4px 0 0; font-size: 16pt; font-weight: 700; line-height: 1.1; }
    .metric-sub { margin: 4px 0 0; font-size: 8pt; color: #64748b; }
    .block { margin-bottom: 14px; page-break-inside: avoid; }
    .block h2 {
      margin: 0 0 8px;
      font-size: 11pt;
      font-weight: 700;
      color: #0c8ee6;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
    }
    th { background: #f1f5f9; font-weight: 600; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.total td { font-weight: 700; background: #f8fafc; }
    .muted { color: #64748b; font-size: 10pt; }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @page { size: A4; margin: 14mm; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-left">
      <img src="${escapeHtml(logoUrl())}" alt="University logo" />
      <div>
        <h1>Attachment Stats</h1>
        <p class="tagline">Industrial attachment overview</p>
      </div>
    </div>
    <p class="date">${escapeHtml(generatedAt)}</p>
  </header>

  <section class="metrics">${metricsHtml}</section>

  <div class="two-col">
    ${dataTable('Students by faculty', charts.studentsByFaculty)}
    ${dataTable('Students by region', charts.studentsByRegion, {
      header: 'Share',
      render: (row, total) => {
        const v = Number(row.value ?? 0);
        return total > 0 ? `${((v / total) * 100).toFixed(1)}%` : '—';
      },
    })}
  </div>

  <div class="two-col">
    ${dataTable('Registrations by month', charts.registrationsByMonth)}
    ${dataTable('Submissions trend', charts.submissionsTrend)}
  </div>
</body>
</html>`;
}

/** Print dashboard report in a hidden iframe (avoids sidebar/layout clipping). */
export function printAdminDashboard(data: AdminDashboardPrintData): void {
  const html = buildAdminDashboardPrintHtml(data);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Admin dashboard print');
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
  window.setTimeout(cleanup, 120_000);

  iframe.onload = () => {
    window.setTimeout(runPrint, 350);
  };
  if (doc.readyState === 'complete') {
    window.setTimeout(runPrint, 350);
  }
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ELOGBOOK_DAYS,
  logbookFieldToLines,
  type ElogbookExportEntry,
} from './elogbookFormat';
import type { ElogbookExportMeta } from './elogbookExport';

const PRIMARY_800: [number, number, number] = [6, 75, 131];
const PRIMARY_600: [number, number, number] = [0, 112, 196];
const PRIMARY_700: [number, number, number] = [1, 89, 159];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_500: [number, number, number] = [100, 116, 139];

type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function linesToCellText(lines: string[]): string {
  if (lines.length === 0) return '—';
  return lines.map((line) => `• ${line}`).join('\n');
}

function drawCoverHeader(doc: jsPDF, meta: ElogbookExportMeta, weekCount: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerHeight = 48;

  doc.setFillColor(...PRIMARY_800);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('INDUSTRIAL ATTACHMENT MANAGEMENT SYSTEM', margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Weekly E-Logbook', margin, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Student: ${meta.studentName}`, margin, 36);
  doc.text(`Index: ${meta.indexNumber}`, margin, 42);
  doc.text(`Weeks: ${weekCount}  ·  Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 42, {
    align: 'right',
  });

  return headerHeight + 10;
}

function addWeekTable(doc: JsPdfWithTable, entry: ElogbookExportEntry, startY: number): number {
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  const minSpace = 40;

  if (startY > pageHeight - minSpace) {
    doc.addPage();
    startY = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_700);
  doc.text(`Week ${entry.week_number}`, margin, startY);

  let tableStart = startY + 5;

  const body = ELOGBOOK_DAYS.map(({ day, jobKey, skillKey }) => [
    day,
    linesToCellText(logbookFieldToLines(entry[jobKey as keyof ElogbookExportEntry] as string)),
    linesToCellText(logbookFieldToLines(entry[skillKey as keyof ElogbookExportEntry] as string)),
  ]);

  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin },
    head: [['Day', 'Job assigned', 'Skill acquired']],
    body,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      valign: 'top',
      textColor: SLATE_900,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY_600,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', textColor: SLATE_900 },
      1: { cellWidth: 78 },
      2: { cellWidth: 78 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_500);
      doc.text(
        `IASMS E-Logbook — Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? tableStart + 20;
  return finalY + 10;
}

/** Build and download the student logbook as a PDF file. */
export function downloadElogbookPdf(meta: ElogbookExportMeta): void {
  const sorted = [...meta.entries].sort((a, b) => a.week_number - b.week_number);
  if (sorted.length === 0) {
    throw new Error('No logbook weeks to export.');
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }) as JsPdfWithTable;
  let y = drawCoverHeader(doc, meta, sorted.length);

  if (sorted.length > 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_900);
    doc.text(
      `Contents: ${sorted.map((e) => `Week ${e.week_number}`).join(' · ')}`,
      14,
      y + 2
    );
    y += 10;
  }

  for (const entry of sorted) {
    y = addWeekTable(doc, entry, y);
  }

  const safeIndex = meta.indexNumber.replace(/[^\w.-]+/g, '_') || 'student';
  doc.save(`elogbook_${safeIndex}.pdf`);
}

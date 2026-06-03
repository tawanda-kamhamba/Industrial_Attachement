/**
 * Converts CAPSTONE markdown to Word-friendly HTML.
 * Usage: node docs/scripts/md-to-word-html.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'CAPSTONE_Chapters_4_to_6_Abstract_Appendices.md');
const output = path.join(root, process.argv[2] || 'CAPSTONE_Chapters_4_to_6_Word.html');

const md = fs.readFileSync(input, 'utf8');

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(s) {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<span class="code">$1</span>');
  return t;
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && /^\|/.test(lines[i])) {
    const cells = lines[i]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (!/^\s*-+/.test(cells.join(''))) rows.push(cells);
    i++;
  }
  return { rows, next: i };
}

function tableHtml(rows) {
  if (!rows.length) return '';
  const [head, ...body] = rows;
  let h = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin:12pt 0;">';
  h += '<thead><tr>';
  for (const c of head) h += `<th style="background:#E8EEF4;font-weight:bold;">${inlineFormat(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (const row of body) {
    h += '<tr>';
    for (const c of row) h += `<td style="vertical-align:top;">${inlineFormat(c)}</td>`;
    h += '</tr>';
  }
  h += '</tbody></table>';
  return h;
}

const lines = md.split(/\r?\n/);
const parts = [];
let i = 0;
let inCode = false;
let codeBuf = [];

while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith('```')) {
    if (inCode) {
      parts.push(
        `<pre style="font-family:Consolas,monospace;font-size:10pt;background:#F5F5F5;padding:10pt;border:1px solid #CCC;">${escapeHtml(codeBuf.join('\n'))}</pre>`
      );
      codeBuf = [];
      inCode = false;
    } else inCode = true;
    i++;
    continue;
  }
  if (inCode) {
    codeBuf.push(line);
    i++;
    continue;
  }

  if (line.startsWith('|')) {
    const { rows, next } = parseTable(lines, i);
    parts.push(tableHtml(rows));
    i = next;
    continue;
  }

  if (/^---+$/.test(line.trim())) {
    parts.push('<hr style="margin:18pt 0;border:none;border-top:1px solid #999;" />');
    i++;
    continue;
  }

  if (line.startsWith('# ')) {
    parts.push(`<h1 style="font-size:18pt;margin-top:24pt;">${inlineFormat(line.slice(2))}</h1>`);
    i++;
    continue;
  }
  if (line.startsWith('## ')) {
    parts.push(`<h2 style="font-size:14pt;margin-top:18pt;">${inlineFormat(line.slice(3))}</h2>`);
    i++;
    continue;
  }
  if (line.startsWith('### ')) {
    parts.push(`<h3 style="font-size:12pt;margin-top:14pt;">${inlineFormat(line.slice(4))}</h3>`);
    i++;
    continue;
  }

  if (line.startsWith('> ')) {
    parts.push(
      `<p style="background:#FFF8E6;border-left:4px solid #E6A800;padding:8pt 12pt;margin:10pt 0;">${inlineFormat(line.slice(2))}</p>`
    );
    i++;
    continue;
  }

  if (/^\d+\.\s/.test(line)) {
    const items = [];
    while (i < lines.length && (/^\d+\.\s/.test(lines[i]) || (lines[i].trim() === '' && items.length))) {
      if (/^\d+\.\s/.test(lines[i])) items.push(lines[i].replace(/^\d+\.\s/, ''));
      i++;
      if (lines[i - 1] && lines[i]?.trim() === '' && !/^\d+\.\s/.test(lines[i])) break;
    }
    parts.push('<ol style="margin:8pt 0 8pt 24pt;">' + items.map((it) => `<li>${inlineFormat(it)}</li>`).join('') + '</ol>');
    continue;
  }

  if (/^[-*]\s/.test(line)) {
    const items = [];
    while (i < lines.length && /^[-*]\s/.test(lines[i])) {
      items.push(lines[i].replace(/^[-*]\s+/, ''));
      i++;
    }
    parts.push('<ul style="margin:8pt 0 8pt 24pt;">' + items.map((it) => `<li>${inlineFormat(it)}</li>`).join('') + '</ul>');
    continue;
  }

  if (line.trim() === '') {
    i++;
    continue;
  }

  parts.push(`<p style="margin:6pt 0;text-align:justify;line-height:1.35;">${inlineFormat(line)}</p>`);
  i++;
}

const body = parts.join('\n');

const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="IAMS Capstone Converter">
<title>IAMS Chapters 4-6 - Tawanda Kamhamba R223985C</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 1in; color: #000; }
h1 { page-break-before: always; }
h1:first-of-type { page-break-before: auto; }
.code { font-family: Consolas, monospace; font-size: 10pt; background: #f0f0f0; padding: 1px 4px; }
table { font-size: 11pt; }
th, td { border: 1px solid #000; }
</style>
</head>
<body>

<p style="text-align:center;font-size:14pt;"><strong>INDUSTRIAL ATTACHMENT MANAGEMENT SYSTEM (IAMS)</strong></p>
<p style="text-align:center;">Chapters 4, 5, 6, Abstract, and Appendices</p>
<p style="text-align:center;">Tawanda Kamhamba &nbsp;|&nbsp; R223985C &nbsp;|&nbsp; BSc Honours Computer Science</p>
<p style="text-align:center;">Supervisor: Mr. Gombiro &nbsp;|&nbsp; FCEIC, Department of Computer Science</p>
<p style="text-align:center;margin-bottom:24pt;">Submission: June 2026</p>

<p style="background:#E8F4FF;padding:10pt;border:1px solid #0066CC;margin-bottom:18pt;">
<strong>How to use this file in Microsoft Word:</strong><br>
1. Open Word → <strong>File → Open</strong> → select this .html file (or double-click it).<br>
2. Then <strong>File → Save As → Word Document (.docx)</strong> for editing.<br>
3. Insert screenshots at each [Figure X.X] placeholder.<br>
4. Apply your faculty heading styles and page numbers if required.
</p>

${body}

</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log('Written:', output);

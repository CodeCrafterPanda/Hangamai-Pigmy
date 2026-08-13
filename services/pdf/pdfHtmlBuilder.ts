import { PDF_FONT_FAMILY } from './pdfFonts';
import type { PdfAlignment, PdfDocumentContent, PdfMetaRow, ResolvedPdfLayout } from './pdfTypes';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHtmlLines(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br/>');
}

function alignmentClass(alignment: PdfAlignment): string {
  if (alignment === 'right') return 'num';
  if (alignment === 'center') return 'ctr';
  return 'lft';
}

function metaHtml(rows: PdfMetaRow[] | undefined): string {
  if (!rows?.length) {
    return '';
  }

  const items = rows
    .map(
      row =>
        `<div class="meta-item"><span class="meta-label">${toHtmlLines(row.label)}</span><span class="meta-value">${toHtmlLines(row.value)}</span></div>`,
    )
    .join('');

  return `<div class="meta-grid">${items}</div>`;
}

export function buildPdfHtml(options: {
  document: PdfDocumentContent;
  layout: ResolvedPdfLayout;
  columnLabels: string[];
  columnAlignments: PdfAlignment[];
  rows: string[][];
  footerRow?: string[] | null;
  fontCss: string;
  /** Android honors @page margin; iOS uses Print.margins instead. */
  pageCssMarginPt: number;
}): string {
  const {
    document,
    layout,
    columnLabels,
    columnAlignments,
    rows,
    footerRow,
    fontCss,
    pageCssMarginPt,
  } = options;

  const colgroup = layout.columnWidthsPt
    .map(width => `<col style="width:${width.toFixed(2)}pt"/>`)
    .join('');

  const headerCells = columnLabels
    .map((label, index) => {
      const cls = alignmentClass(columnAlignments[index] ?? 'left');
      return `<th class="${cls}">${toHtmlLines(label)}</th>`;
    })
    .join('');

  const bodyRows = rows
    .map((cells, rowIndex) => {
      const stripe = rowIndex % 2 === 1 ? ' class="alt"' : '';
      const tds = cells
        .map((cell, index) => {
          const cls = alignmentClass(columnAlignments[index] ?? 'left');
          return `<td class="${cls}">${toHtmlLines(cell)}</td>`;
        })
        .join('');
      return `<tr${stripe}>${tds}</tr>`;
    })
    .join('');

  const footer =
    footerRow && footerRow.length
      ? `<tfoot><tr class="total">${footerRow
          .map((cell, index) => {
            const cls = alignmentClass(columnAlignments[index] ?? 'left');
            return `<td class="${cls}">${toHtmlLines(cell)}</td>`;
          })
          .join('')}</tr></tfoot>`
      : '';

  const subtitle = document.subtitle
    ? `<p class="subtitle">${toHtmlLines(document.subtitle)}</p>`
    : '';
  const totalRecords = document.totalRecordsLabel
    ? `<p class="records">${toHtmlLines(document.totalRecordsLabel)}</p>`
    : '';
  const footerNote = document.footerNote ? toHtmlLines(document.footerNote) : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
${fontCss}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;color:#1a1a1a;background:#fff;font-family:${PDF_FONT_FAMILY};}
@page{size:${layout.widthPt}pt ${layout.heightPt}pt;margin:${pageCssMarginPt}pt;}
body{padding:0 0 16pt 0;}
.header{margin:0 0 10pt 0;}
.title{margin:0 0 3pt 0;font-size:14pt;font-weight:700;color:#047857;letter-spacing:0.01em;}
.subtitle{margin:0 0 6pt 0;font-size:9.5pt;color:#29483a;}
.generated{margin:0 0 4pt 0;font-size:8pt;color:#4a5c54;}
.records{margin:0 0 6pt 0;font-size:8pt;color:#4a5c54;}
.meta-grid{display:flex;flex-wrap:wrap;gap:4pt 16pt;margin:0 0 8pt 0;padding:6pt 8pt;background:#f3faf6;border:0.4pt solid #c5d4cc;border-radius:3pt;}
.meta-item{font-size:8pt;color:#29483a;}
.meta-label{font-weight:700;margin-right:4pt;}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:${layout.fontSizePt}pt;}
thead{display:table-header-group;}
tfoot{display:table-row-group;}
tr{page-break-inside:avoid;}
th,td{border:0.4pt solid #b7c9c0;padding:4pt 3.5pt;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;}
th{background:#047857;color:#fff;font-weight:700;}
td{background:#fff;}
tr.alt td{background:#f3faf6;}
tr.total td{background:#e6f4ee;font-weight:700;border-top:1.2pt solid #047857;}
.num{text-align:right;font-variant-numeric:tabular-nums;}
.ctr{text-align:center;}
.lft{text-align:left;}
.page-footer{position:fixed;left:0;right:0;bottom:0;padding-top:4pt;border-top:0.4pt solid #c5d4cc;font-size:8pt;color:#4a5c54;}
.page-no::after{content:counter(page);}
</style>
</head>
<body>
  <header class="header">
    <h1 class="title">${toHtmlLines(document.title)}</h1>
    ${subtitle}
    <p class="generated">${toHtmlLines(document.generatedOnLabel)}</p>
    ${totalRecords}
    ${metaHtml(document.meta)}
  </header>
  <table>
    <colgroup>${colgroup}</colgroup>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
    ${footer}
  </table>
  <div class="page-footer">
    <span>${footerNote}</span>
    <span style="float:right">${toHtmlLines(document.pageLabel)} <span class="page-no"></span></span>
  </div>
</body>
</html>`;
}

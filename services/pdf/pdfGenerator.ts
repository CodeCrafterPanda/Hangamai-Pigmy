import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import { isIos, isWeb } from '@/utils/deviceInfo';
import { getPdfFontCss } from './pdfFonts';
import { buildPdfHtml } from './pdfHtmlBuilder';
import { filterPdfColumns, selectPdfLayout } from './pdfLayout';
import type { GeneratedPdf, PdfAlignment, PdfColumn, PdfDocumentContent } from './pdfTypes';

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFileName(value: string): string {
  const cleaned = value
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');
  return (cleaned || 'Report').slice(0, 80);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildPdfFileName(reportName: string, now = new Date()): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${sanitizeFileName(reportName)}_${date}_${time}.pdf`;
}

function cellValue<T>(column: PdfColumn<T>, row: T): string {
  if (column.formatter) {
    return column.formatter(row);
  }
  const raw = row[column.key as keyof T];
  return raw == null ? '' : String(raw);
}

function columnAlignment<T>(column: PdfColumn<T>): PdfAlignment {
  if (column.alignment) {
    return column.alignment;
  }
  if (column.kind === 'numeric' || column.kind === 'currency') {
    return 'right';
  }
  if (column.kind === 'date') {
    return 'center';
  }
  return 'left';
}

export type GeneratePdfTableOptions<T> = {
  rows: T[];
  columns: PdfColumn<T>[];
  excludedColumns?: readonly string[];
  document: PdfDocumentContent;
  fileName: string;
  footerRow?: string[] | null;
};

function uniqueDestination(fileName: string): { file: File; fileName: string } {
  const primary = new File(Paths.cache, fileName);
  if (!primary.exists) {
    return { file: primary, fileName };
  }

  const withoutExt = fileName.replace(/\.pdf$/i, '');
  let attempt = 2;
  while (attempt < 50) {
    const nextName = `${withoutExt}_${attempt}.pdf`;
    const candidate = new File(Paths.cache, nextName);
    if (!candidate.exists) {
      return { file: candidate, fileName: nextName };
    }
    attempt += 1;
  }

  const fallbackName = `${withoutExt}_${Date.now()}.pdf`;
  return { file: new File(Paths.cache, fallbackName), fileName: fallbackName };
}

/**
 * Builds HTML off the React render path and writes a local PDF. The returned URI
 * is a cache file with a unique name so a later export cannot clobber this one
 * while the OS share sheet still holds it.
 */
export async function generatePdf<T>(options: GeneratePdfTableOptions<T>): Promise<GeneratedPdf> {
  const visibleColumns = filterPdfColumns(options.columns, options.excludedColumns);
  if (visibleColumns.length === 0) {
    throw new Error('PDF_NO_COLUMNS');
  }

  const layout = selectPdfLayout(visibleColumns, options.rows);
  const fontCss = await getPdfFontCss();
  const html = buildPdfHtml({
    document: options.document,
    layout,
    columnLabels: visibleColumns.map(column => column.label),
    columnAlignments: visibleColumns.map(columnAlignment),
    rows: options.rows.map(row => visibleColumns.map(column => cellValue(column, row))),
    footerRow: options.footerRow,
    fontCss,
    pageCssMarginPt: isIos ? 0 : layout.marginPt,
  });

  const printResult = await Print.printToFileAsync({
    html,
    width: layout.widthPt,
    height: layout.heightPt,
    ...(isIos
      ? {
          margins: {
            top: layout.marginPt,
            bottom: layout.marginPt,
            left: layout.marginPt,
            right: layout.marginPt,
          },
        }
      : {}),
  });

  const destination = uniqueDestination(options.fileName);
  if (!isWeb && printResult.uri) {
    const source = new File(printResult.uri);
    if (source.exists) {
      try {
        source.copy(destination.file);
      } catch {
        // Keep the print cache URI if the rename/copy is unavailable.
      }
    }
  }

  return {
    uri: !isWeb && destination.file.exists ? destination.file.uri : printResult.uri,
    fileName: destination.fileName,
    numberOfPages: printResult.numberOfPages,
  };
}

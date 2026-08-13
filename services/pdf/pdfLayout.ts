import type {
  PdfColumn,
  PdfColumnKind,
  PdfLayout,
  PdfOrientation,
  PdfPaperSize,
  ResolvedPdfLayout,
} from './pdfTypes';

/** ISO paper sizes in PostScript points (72 pt = 1 in), the unit expo-print uses. */
const PAPER_POINTS: Record<PdfPaperSize, { portrait: { width: number; height: number } }> = {
  A4: { portrait: { width: 595.28, height: 841.89 } },
  A3: { portrait: { width: 841.89, height: 1190.55 } },
};

const LAYOUT_CANDIDATES: PdfLayout[] = [
  { paperSize: 'A4', orientation: 'portrait' },
  { paperSize: 'A4', orientation: 'landscape' },
  { paperSize: 'A3', orientation: 'portrait' },
  { paperSize: 'A3', orientation: 'landscape' },
];

const PREFERRED_FONT_PT = 9;
const MINIMUM_FONT_PT = 8;
const CELL_PADDING_PT = 8;
const DEFAULT_MARGIN_PT = 28;

const KIND_MIN_WIDTH: Record<PdfColumnKind, number> = {
  text: 72,
  numeric: 28,
  currency: 40,
  date: 56,
};

const KIND_MAX_WIDTH: Record<PdfColumnKind, number> = {
  text: 150,
  numeric: 44,
  currency: 72,
  date: 88,
};

function paperDimensions(
  paperSize: PdfPaperSize,
  orientation: PdfOrientation,
): { width: number; height: number } {
  const portrait = PAPER_POINTS[paperSize].portrait;
  if (orientation === 'portrait') {
    return portrait;
  }
  return { width: portrait.height, height: portrait.width };
}

/**
 * Approximate rendered width so layout can choose paper before HTML exists.
 * Devanagari glyphs are wider than Latin; ASCII digits stay compact.
 */
export function measureTextWidth(text: string, fontSizePt: number, isBold = false): number {
  const lines = text.split('\n');
  let widest = 0;

  for (const line of lines) {
    let units = 0;
    for (const char of line) {
      const code = char.codePointAt(0) ?? 0;
      if (code >= 0x0900 && code <= 0x097f) {
        units += 1.05;
      } else if (code > 0xff) {
        units += 0.9;
      } else if (char === 'W' || char === 'M') {
        units += 0.7;
      } else {
        units += 0.52;
      }
    }
    widest = Math.max(widest, units);
  }

  return widest * fontSizePt * (isBold ? 1.12 : 1) + CELL_PADDING_PT;
}

function columnKind<T>(column: PdfColumn<T>): PdfColumnKind {
  return column.kind ?? (column.alignment === 'right' ? 'numeric' : 'text');
}

function estimateColumnWidth<T>(
  column: PdfColumn<T>,
  sampleValues: string[],
  fontSizePt: number,
): number {
  const kind = columnKind(column);
  if (column.width && column.width > 0) {
    return column.width;
  }

  const headerWidth = measureTextWidth(column.label, fontSizePt, true);
  let contentWidth = 0;
  for (const value of sampleValues) {
    contentWidth = Math.max(contentWidth, measureTextWidth(value, fontSizePt));
  }

  const raw = Math.max(headerWidth, contentWidth, KIND_MIN_WIDTH[kind]);
  return Math.min(raw, KIND_MAX_WIDTH[kind]);
}

function sampleValues<T>(column: PdfColumn<T>, rows: T[], sampleSize: number): string[] {
  const values: string[] = [];
  const limit = Math.min(rows.length, sampleSize);
  for (let index = 0; index < limit; index += 1) {
    const row = rows[index];
    if (column.formatter) {
      values.push(column.formatter(row));
      continue;
    }
    const raw = row[column.key as keyof T];
    values.push(raw == null ? '' : String(raw));
  }
  return values;
}

function fits(totalWidthPt: number, usableWidthPt: number): boolean {
  return totalWidthPt <= usableWidthPt + 0.5;
}

/**
 * Picks the smallest paper that can hold the visible columns at a readable size.
 * Falls back to A3 landscape and scales column widths if even that is tight.
 */
export function selectPdfLayout<T>(columns: PdfColumn<T>[], rows: T[]): ResolvedPdfLayout {
  const sampleSize = 24;
  const preferredWidths = columns.map(column =>
    estimateColumnWidth(column, sampleValues(column, rows, sampleSize), PREFERRED_FONT_PT),
  );
  const preferredTotal = preferredWidths.reduce((sum, width) => sum + width, 0);

  for (const candidate of LAYOUT_CANDIDATES) {
    const { width, height } = paperDimensions(candidate.paperSize, candidate.orientation);
    const usable = width - DEFAULT_MARGIN_PT * 2;
    if (fits(preferredTotal, usable)) {
      return {
        ...candidate,
        widthPt: width,
        heightPt: height,
        marginPt: DEFAULT_MARGIN_PT,
        fontSizePt: PREFERRED_FONT_PT,
        columnWidthsPt: preferredWidths,
      };
    }
  }

  const compactWidths = columns.map(column =>
    estimateColumnWidth(column, sampleValues(column, rows, sampleSize), MINIMUM_FONT_PT),
  );
  const compactTotal = compactWidths.reduce((sum, width) => sum + width, 0);
  const last = LAYOUT_CANDIDATES[LAYOUT_CANDIDATES.length - 1];
  const { width, height } = paperDimensions(last.paperSize, last.orientation);
  const usable = width - DEFAULT_MARGIN_PT * 2;
  const scale = compactTotal > usable ? usable / compactTotal : 1;

  return {
    ...last,
    widthPt: width,
    heightPt: height,
    marginPt: DEFAULT_MARGIN_PT,
    fontSizePt: MINIMUM_FONT_PT,
    columnWidthsPt: compactWidths.map(columnWidth => columnWidth * scale),
  };
}

export function filterPdfColumns<T>(
  columns: PdfColumn<T>[],
  excludedKeys: readonly string[] = [],
): PdfColumn<T>[] {
  const excluded = new Set(excludedKeys.map(key => key.trim().toLowerCase()));

  return columns.filter(column => {
    if (!column.include) {
      return false;
    }

    const keys = [String(column.key), ...(column.aliases ?? [])].map(key => key.toLowerCase());
    return !keys.some(key => excluded.has(key));
  });
}

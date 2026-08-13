/**
 * Reusable PDF table types. Report screens map their own rows into this shape;
 * generation never owns a parallel data model.
 */

export type PdfPaperSize = 'A4' | 'A3';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfAlignment = 'left' | 'center' | 'right';
export type PdfColumnKind = 'text' | 'numeric' | 'currency' | 'date';

export type PdfLayout = {
  paperSize: PdfPaperSize;
  orientation: PdfOrientation;
};

export type ResolvedPdfLayout = PdfLayout & {
  widthPt: number;
  heightPt: number;
  marginPt: number;
  fontSizePt: number;
  columnWidthsPt: number[];
};

export interface PdfColumn<T> {
  key: keyof T | string;
  label: string;
  include: boolean;
  width?: number;
  alignment?: PdfAlignment;
  formatter?: (row: T) => string;
  /** Used only for layout: numeric/currency prefer A4 landscape sooner than short text. */
  kind?: PdfColumnKind;
  /** Alternate keys that an exclusion list may use (e.g. inHand → cash). */
  aliases?: string[];
}

export type PdfMetaRow = {
  label: string;
  value: string;
};

export type PdfDocumentContent = {
  title: string;
  subtitle?: string;
  generatedOnLabel: string;
  totalRecordsLabel?: string;
  pageLabel: string;
  meta?: PdfMetaRow[];
  footerNote?: string;
};

export type GeneratedPdf = {
  uri: string;
  fileName: string;
  numberOfPages: number;
};

export type SavePdfResult = 'saved' | 'cancelled';

export class PdfShareUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfShareUnavailableError';
  }
}

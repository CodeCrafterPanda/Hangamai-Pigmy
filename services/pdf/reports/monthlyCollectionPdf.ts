import { formatDate, formatDateTime, formatNumber } from '@/i18n';
import type { Language, TranslationKey, TranslationParams } from '@/i18n';
import type { MonthlyCollectionReport, MonthlyCollectionRow } from '@/slices/reports.slice';
import { buildPdfFileName, generatePdf } from '../pdfGenerator';
import { filterPdfColumns } from '../pdfLayout';
import type { GeneratedPdf, PdfColumn, PdfDocumentContent } from '../pdfTypes';

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

const EMPTY_CELL = '—';

/**
 * PDF-only exclusions. The on-screen History table still shows these columns.
 * `inHand` is treated as an alias of the Cash column.
 */
export const MONTHLY_COLLECTION_PDF_EXCLUDED_COLUMNS = ['missedDays', 'inHand', 'upi'] as const;

function formatAmount(value: number | null | undefined): string {
  if (!value) {
    return EMPTY_CELL;
  }
  return formatNumber(value);
}

function weekdayLabel(year: number, month: number, day: number, language: Language): string {
  return formatDate(new Date(year, month - 1, day), language, { weekday: 'short' }).toUpperCase();
}

export function buildMonthlyCollectionPdfColumns(
  report: MonthlyCollectionReport,
  t: Translate,
  language: Language,
): PdfColumn<MonthlyCollectionRow>[] {
  const dayNumbers = Array.from({ length: report.daysInMonth }, (_, index) => index + 1);

  const columns: PdfColumn<MonthlyCollectionRow>[] = [
    {
      key: 'customerName',
      label: t('monthlyCollections.customer'),
      include: true,
      kind: 'text',
      formatter: row => `${row.customerName}\n${row.accountNumber}`,
    },
    {
      key: 'missedDays',
      label: t('monthlyCollections.missed'),
      include: true,
      kind: 'numeric',
      alignment: 'center',
      aliases: ['missed'],
      formatter: row => (row.missedDays > 0 ? String(row.missedDays) : EMPTY_CELL),
    },
    ...dayNumbers.map(day => ({
      key: `day:${day}`,
      label: `${String(day).padStart(2, '0')}\n${weekdayLabel(report.year, report.month, day, language)}`,
      include: true,
      kind: 'numeric' as const,
      alignment: 'right' as const,
      formatter: (row: MonthlyCollectionRow) => formatAmount(row.dailyCollections[day]),
    })),
    {
      key: 'cash',
      label: t('monthlyCollections.cash'),
      include: true,
      kind: 'currency',
      alignment: 'right',
      aliases: ['inHand', 'cashCollected', 'cashInHand'],
      formatter: row => formatAmount(row.cashCollected),
    },
    {
      key: 'upi',
      label: t('monthlyCollections.upi'),
      include: true,
      kind: 'currency',
      alignment: 'right',
      aliases: ['upiCollected'],
      formatter: row => formatAmount(row.upiCollected),
    },
    {
      key: 'monthlyTotal',
      label: t('monthlyCollections.total'),
      include: true,
      kind: 'currency',
      alignment: 'right',
      aliases: ['total'],
      formatter: row => formatAmount(row.monthlyTotal),
    },
  ];

  return columns;
}

function footerCell(
  column: PdfColumn<MonthlyCollectionRow>,
  report: MonthlyCollectionReport,
  t: Translate,
): string {
  const key = String(column.key);

  if (key === 'customerName' || key === 'customer') {
    return t('monthlyCollections.dailyTotal');
  }
  if (key === 'missedDays') {
    return formatAmount(report.totalMissedDays);
  }
  if (key.startsWith('day:')) {
    const day = Number(key.slice(4));
    return formatAmount(report.dailyTotals[day]);
  }
  if (key === 'cash') {
    return formatAmount(report.totalCashCollected);
  }
  if (key === 'upi') {
    return formatAmount(report.totalUpiCollected);
  }
  if (key === 'monthlyTotal') {
    return formatAmount(report.grandTotal);
  }
  return EMPTY_CELL;
}

export function generateMonthlyCollectionPdf(options: {
  report: MonthlyCollectionReport;
  t: Translate;
  language: Language;
  names?: { agentName?: string; routeName?: string; branchName?: string };
}): Promise<GeneratedPdf> {
  const { report, t, language, names } = options;
  const columns = buildMonthlyCollectionPdfColumns(report, t, language);
  const visibleColumns = filterPdfColumns(columns, MONTHLY_COLLECTION_PDF_EXCLUDED_COLUMNS);
  const generatedAt = formatDateTime(new Date(), language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const monthDate = new Date(report.year, report.month - 1, 1);
  const monthLabel = `${formatDate(monthDate, language, { month: 'long' })} ${report.year}`;
  const bookLabel = report.scope
    ? t(`settlementScope.${report.scope}` as TranslationKey)
    : t('reportExport.all');

  const document: PdfDocumentContent = {
    title: t('reportExport.title'),
    subtitle: names?.branchName
      ? `${names.branchName} · ${t('monthlyCollections.primaryBook')}`
      : t('monthlyCollections.primaryBook'),
    generatedOnLabel: t('pdf.generatedOn', { datetime: generatedAt }),
    totalRecordsLabel: t('pdf.totalRecords', { count: report.rows.length }),
    pageLabel: t('pdf.page'),
    footerNote: t('pdf.generatedOn', { datetime: generatedAt }),
    meta: [
      { label: t('reportExport.month'), value: monthLabel },
      { label: t('reportExport.businessDate'), value: report.currentBusinessDate },
      { label: t('reportExport.agent'), value: names?.agentName || t('reportExport.all') },
      { label: t('reportExport.book'), value: bookLabel },
      { label: t('reportExport.route'), value: names?.routeName || t('reportExport.all') },
      {
        label: t('reportExport.reconciled'),
        value: report.isAuditSuccessful ? t('reportExport.yes') : t('reportExport.no'),
      },
    ],
  };

  return generatePdf({
    rows: report.rows,
    columns,
    excludedColumns: MONTHLY_COLLECTION_PDF_EXCLUDED_COLUMNS,
    document,
    fileName: buildPdfFileName(`MonthlyReconciliation_${report.monthPrefix}`),
    footerRow: visibleColumns.map(column => footerCell(column, report, t)),
  });
}

/**
 * Report Export
 *
 * Formats an already-reconciled report model as CSV text. Every number written here is
 * read from the report projection — this file performs no financial calculation of its
 * own, so an export can never disagree with the report on screen.
 */

import type { MonthlyCollectionReport } from '@/slices/reports.slice';
import type { TranslationKey, TranslationParams } from '@/i18n';

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/**
 * Deterministic name derived from the report's own month, never a device clock, so the
 * same month always exports under the same name.
 */
export function buildMonthlyReportFileName(report: MonthlyCollectionReport): string {
  return `pigmy-reconciliation-${report.monthPrefix}.csv`;
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(cells: (string | number | undefined)[]): string {
  return cells.map(csvCell).join(',');
}

export function buildMonthlyReportCsv(
  report: MonthlyCollectionReport,
  t: Translate,
  names?: { agentName?: string; routeName?: string },
): string {
  const dayNumbers = Array.from({ length: report.daysInMonth }, (_, index) => index + 1);
  const lines: string[] = [];

  lines.push(csvRow([t('reportExport.title')]));
  lines.push(csvRow([t('reportExport.month'), report.monthPrefix]));
  lines.push(csvRow([t('reportExport.businessDate'), report.currentBusinessDate]));
  lines.push(csvRow([t('reportExport.agent'), names?.agentName || t('reportExport.all')]));
  lines.push(
    csvRow([
      t('reportExport.book'),
      report.scope
        ? t(`settlementScope.${report.scope}` as TranslationKey)
        : t('reportExport.all'),
    ]),
  );
  lines.push(csvRow([t('reportExport.route'), names?.routeName || t('reportExport.all')]));
  lines.push(
    csvRow([
      t('reportExport.reconciled'),
      report.isAuditSuccessful ? t('reportExport.yes') : t('reportExport.no'),
    ]),
  );
  report.auditErrors.forEach(error => lines.push(csvRow([t('reportExport.issue'), error])));
  lines.push('');

  lines.push(
    csvRow([
      t('reportExport.customer'),
      t('reportExport.account'),
      t('reportExport.installment'),
      t('reportExport.frequency'),
      ...dayNumbers.map(day => String(day)),
      t('reportExport.total'),
      t('reportExport.cash'),
      t('reportExport.upi'),
      t('reportExport.penalty'),
      t('reportExport.missedDays'),
      t('reportExport.ledgerBalance'),
      t('reportExport.accountBalance'),
    ]),
  );

  report.rows.forEach(row => {
    lines.push(
      csvRow([
        row.customerName,
        row.accountNumber,
        row.installmentAmount,
        row.frequency
          ? t(`schemeFrequency.${row.frequency}` as TranslationKey)
          : t('reportExport.unknown'),
        ...dayNumbers.map(day => row.dailyCollections[day] ?? 0),
        row.monthlyTotal,
        row.cashCollected,
        row.upiCollected,
        row.penaltyCollected,
        row.missedDays,
        row.hasLedgerData ? row.ledgerBalance : t('reportExport.notAvailable'),
        row.cachedBalance,
      ]),
    );
  });

  lines.push(
    csvRow([
      t('reportExport.totalRow'),
      '',
      '',
      '',
      ...dayNumbers.map(day => report.dailyTotals[day] ?? 0),
      report.grandTotal,
      report.totalCashCollected,
      report.totalUpiCollected,
      report.totalPenaltyCollected,
      report.totalMissedDays,
      '',
      '',
    ]),
  );

  if (report.settlement.isScoped) {
    const { settlement } = report;
    const scopeLabel = t(`settlementScope.${settlement.scope}` as TranslationKey);
    lines.push('');
    lines.push(csvRow([t('reportExport.cashReconciliation', { scope: scopeLabel })]));
    lines.push(
      csvRow([
        t('reportExport.businessDate'),
        t('reportExport.cashCollected'),
        t('reportExport.upiCollected'),
        t('reportExport.settledCash'),
        t('reportExport.cashInHand'),
        t('reportExport.settlement'),
      ]),
    );

    settlement.entries.forEach(entry => {
      lines.push(
        csvRow([
          entry.businessDate,
          entry.cashCollected,
          entry.upiCollected,
          entry.settledCash,
          entry.cashInHand,
          entry.settlementStatus
            ? t(`settlementStatus.${entry.settlementStatus}` as TranslationKey)
            : t('reportExport.notSettled'),
        ]),
      );
    });

    lines.push(
      csvRow([
        t('reportExport.monthTotal'),
        settlement.cashCollected,
        settlement.upiCollected,
        settlement.settledCash,
        settlement.cashInHand,
        '',
      ]),
    );
  }

  return lines.join('\n');
}

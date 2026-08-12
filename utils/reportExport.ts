/**
 * Report Export
 *
 * Formats an already-reconciled report model as CSV text. Every number written here is
 * read from the report projection — this file performs no financial calculation of its
 * own, so an export can never disagree with the report on screen.
 */

import type { MonthlyCollectionReport } from '@/slices/reports.slice';

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

export function buildMonthlyReportCsv(report: MonthlyCollectionReport): string {
  const dayNumbers = Array.from({ length: report.daysInMonth }, (_, index) => index + 1);
  const lines: string[] = [];

  lines.push(csvRow(['Monthly Reconciliation']));
  lines.push(csvRow(['Month', report.monthPrefix]));
  lines.push(csvRow(['Business date', report.currentBusinessDate]));
  lines.push(csvRow(['Agent', report.agentId ?? 'All']));
  lines.push(csvRow(['Book', report.scope ?? 'All']));
  lines.push(csvRow(['Route', report.routeId ?? 'All']));
  lines.push(csvRow(['Reconciled', report.isAuditSuccessful ? 'YES' : 'NO']));
  report.auditErrors.forEach(error => lines.push(csvRow(['Issue', error])));
  lines.push('');

  lines.push(
    csvRow([
      'Customer',
      'Account',
      'Installment',
      'Frequency',
      ...dayNumbers.map(day => String(day)),
      'Total',
      'Cash',
      'UPI',
      'Penalty',
      'Missed days',
      'Ledger balance',
      'Account balance',
    ]),
  );

  report.rows.forEach(row => {
    lines.push(
      csvRow([
        row.customerName,
        row.accountNumber,
        row.installmentAmount,
        row.frequency ?? 'UNKNOWN',
        ...dayNumbers.map(day => row.dailyCollections[day] ?? 0),
        row.monthlyTotal,
        row.cashCollected,
        row.upiCollected,
        row.penaltyCollected,
        row.missedDays,
        row.hasLedgerData ? row.ledgerBalance : 'NOT AVAILABLE',
        row.cachedBalance,
      ]),
    );
  });

  lines.push(
    csvRow([
      'TOTAL',
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
    lines.push('');
    lines.push(csvRow([`Cash reconciliation (${settlement.scope} book, all routes)`]));
    lines.push(
      csvRow([
        'Business date',
        'Cash collected',
        'UPI collected',
        'Settled cash',
        'Cash in hand',
        'Settlement',
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
          entry.settlementStatus ?? 'NOT SETTLED',
        ]),
      );
    });

    lines.push(
      csvRow([
        'MONTH',
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

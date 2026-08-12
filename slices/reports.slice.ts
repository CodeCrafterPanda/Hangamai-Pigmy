/**
 * Reports Slice
 *
 * Report projections over authoritative domain state. Reports own no financial rules of
 * their own: business dates, missed days, payment-method splits, ledger balances and
 * settlement/cash-in-hand figures all come from the same primitives the operational
 * screens use, so a report can never disagree with the screen it reports on.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { State } from '@/utils/store';
import type {
  Account,
  Collection,
  LedgerEntry,
  Scheme,
  Settlement,
  SettlementStatus,
} from '@/types';
import { SettlementScope } from '@/types';
import { getEntitiesArray } from '@/utils/storage';
import {
  calculateAccountBalance,
  calculateMissedDaysForMonth,
  calculateSettlementSummary,
  verifyMonthlyReportReconciliation,
  type MonthlyReportCrossChecks,
  type ReportBalanceCheck,
  type ReportSettlementCheck,
} from '@/utils/businessLogic';
import {
  calculateCashInHand,
  getCollectionSettlementScope,
  sumSettledCash,
} from '@/slices/settlements.slice';
import { selectBranchTimezone } from '@/slices/settings.slice';
import { getDaysInMonth, parseISO } from 'date-fns';

// ===========================
// TYPES
// ===========================

export interface MonthlyCollectionRow {
  accountId: string;
  accountNumber: string;
  accountStatus: Account['status'];
  customerId: string;
  customerName: string;
  /** Configured collection amount for the account */
  installmentAmount: number;
  /** Scheme frequency; undefined when the account's scheme record is missing */
  frequency?: Scheme['frequency'];
  dailyCollections: Record<number, number | null>; // day -> amount
  collectionCount: number;
  monthlyTotal: number;
  cashCollected: number;
  upiCollected: number;
  /** Penalty actually collected — kept separate from missedDays, which stays real at ₹0 penalty */
  penaltyCollected: number;
  /** Customer/account missed days for this calendar month (calculateMissedDaysForMonth) */
  missedDays: number;
  /** Authoritative ledger-derived balance */
  ledgerBalance: number;
  /** Balance cached on the Account record */
  cachedBalance: number;
  /** False when the account has no ledger entries to derive a balance from */
  hasLedgerData: boolean;
}

export interface MonthlySettlementEntry {
  businessDate: string;
  cashCollected: number;
  upiCollected: number;
  settledCash: number;
  cashInHand: number;
  settlementStatus?: SettlementStatus;
}

/**
 * Cash reconciliation for the month within one agent's book.
 * Always covers the whole book for that scope — a route filter narrows the collection
 * table but must never change how much physical cash the agent is holding.
 */
export interface MonthlySettlementReconciliation {
  /** False when no agent + scope was requested, so no single cash book applies */
  isScoped: boolean;
  scope?: SettlementScope;
  cashCollected: number;
  upiCollected: number;
  settledCash: number;
  /** Eligible unsettled cash, from the same rule Home and Settlement read */
  cashInHand: number;
  entries: MonthlySettlementEntry[];
}

export interface MonthlyCollectionReport {
  year: number;
  month: number; // 1-12
  monthPrefix: string; // YYYY-MM
  daysInMonth: number;
  /** Business date the report was projected against */
  currentBusinessDate: string;
  isCurrentMonth: boolean;
  agentId?: string;
  scope?: SettlementScope;
  routeId?: string;
  rows: MonthlyCollectionRow[];
  dailyTotals: Record<number, number>; // day -> total for that day
  grandTotal: number;
  totalCashCollected: number;
  totalUpiCollected: number;
  totalPenaltyCollected: number;
  totalMissedDays: number;
  collectionCount: number;
  settlement: MonthlySettlementReconciliation;
  isAuditSuccessful: boolean;
  auditErrors: string[];
}

export interface DailySummary {
  businessDate: string;
  totalCash: number;
  totalUpi: number;
  totalCollection: number;
  collectionCount: number;
  agentSummaries: Record<
    string,
    {
      agentId: string;
      agentName: string;
      cash: number;
      upi: number;
      total: number;
      count: number;
    }
  >;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get day from business date string (YYYY-MM-DD)
 */
function getDayFromBusinessDate(businessDate: string): number {
  return parseInt(businessDate.split('-')[2], 10);
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  items.forEach(item => {
    const key = keyOf(item);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  });

  return grouped;
}

function sumOf<T>(items: T[], valueOf: (item: T) => number): number {
  return items.reduce((sum, item) => sum + valueOf(item), 0);
}

/**
 * Per-business-date cash reconciliation for one agent's book.
 *
 * `scopedMonthCollections` must already be narrowed to the agent + scope and must NOT be
 * route-filtered: settled cash and cash in hand are physical facts about the agent's day
 * closure, not about a route selection.
 */
function buildSettlementReconciliation(
  scopedMonthCollections: Collection[],
  settlements: Settlement[],
  monthPrefix: string,
  agentId?: string,
  scope?: SettlementScope,
): MonthlySettlementReconciliation {
  if (!agentId || !scope) {
    return {
      isScoped: false,
      scope,
      cashCollected: 0,
      upiCollected: 0,
      settledCash: 0,
      cashInHand: 0,
      entries: [],
    };
  }

  // Settlement identity is agentId + businessDate + scope
  const monthSettlements = settlements.filter(
    s => s.agentId === agentId && s.scope === scope && s.businessDate.startsWith(monthPrefix),
  );

  const collectionsByDate = groupBy(scopedMonthCollections, c => c.businessDate);
  const settlementsByDate = groupBy(monthSettlements, s => s.businessDate);

  const businessDates = Array.from(
    new Set([...collectionsByDate.keys(), ...settlementsByDate.keys()]),
  ).sort();

  const entries: MonthlySettlementEntry[] = businessDates.map(businessDate => {
    const dayCollections = collectionsByDate.get(businessDate) ?? [];
    const daySettlements = settlementsByDate.get(businessDate) ?? [];
    const { cashTotal, upiTotal } = calculateSettlementSummary(dayCollections);

    return {
      businessDate,
      cashCollected: cashTotal,
      upiCollected: upiTotal,
      settledCash: sumSettledCash(daySettlements),
      // Settlement never erases collection history: cash collected stays as it was and
      // only the unsettled balance moves.
      cashInHand: calculateCashInHand(dayCollections, daySettlements),
      settlementStatus: daySettlements[0]?.status,
    };
  });

  return {
    isScoped: true,
    scope,
    cashCollected: sumOf(entries, e => e.cashCollected),
    upiCollected: sumOf(entries, e => e.upiCollected),
    settledCash: sumOf(entries, e => e.settledCash),
    cashInHand: sumOf(entries, e => e.cashInHand),
    entries,
  };
}

// ===========================
// BASE SELECTORS
// ===========================

/**
 * getEntitiesArray() builds a new array on every call, so it must never sit directly in a
 * createSelector input: Reselect compares inputs by reference and would warn about
 * unstable inputs and recompute on every read. Each array is built once in this memoized
 * layer and every derived selector below takes it from here.
 */
const selectCollectionsStore = (state: State) => state.collections.collections;
const selectAccountsStore = (state: State) => state.accounts.accounts;
const selectSchemesStore = (state: State) => state.accounts.schemes;
const selectCustomersStore = (state: State) => state.customers.customers;
const selectLedgerStore = (state: State) => state.ledger.ledgerEntries;
const selectSettlementsStore = (state: State) => state.settlements.settlements;
const selectAgentsStore = (state: State) => state.settings.agents;

const selectCollectionEntities = createSelector([selectCollectionsStore], store =>
  getEntitiesArray(store),
);

const selectAccountEntities = createSelector([selectAccountsStore], store =>
  getEntitiesArray(store),
);

const selectSchemeEntities = createSelector([selectSchemesStore], store => getEntitiesArray(store));

const selectCustomerEntities = createSelector([selectCustomersStore], store =>
  getEntitiesArray(store),
);

const selectLedgerEntities = createSelector([selectLedgerStore], store => getEntitiesArray(store));

const selectSettlementEntities = createSelector([selectSettlementsStore], store =>
  getEntitiesArray(store),
);

const selectAgentEntities = createSelector([selectAgentsStore], store => getEntitiesArray(store));

// ===========================
// SELECTORS
// ===========================

/**
 * The authoritative monthly reconciliation projection.
 *
 * Months are bucketed by Collection.businessDate (branch timezone), never by a device
 * clock. `currentBusinessDate` is passed in rather than read from the device inside the
 * selector, so the same state and the same arguments always produce the same report.
 *
 * @param year Calendar year
 * @param month Calendar month 1-12 (Date.getMonth() is 0-11 — add one at the call site)
 * @param currentBusinessDate Branch business date, from getCurrentBusinessDate
 * @param agentId Restricts the money columns to one agent's collections
 * @param scope PRIMARY or DELEGATED book; the two are never pooled
 * @param routeId Narrows rows to one route, using the persisted customer/route relationship
 */
export const selectMonthlyCollectionReport = createSelector(
  [
    selectCollectionEntities,
    selectAccountEntities,
    selectCustomerEntities,
    selectSchemeEntities,
    selectLedgerEntities,
    selectSettlementEntities,
    selectBranchTimezone,
    (_state: State, year: number) => year,
    (_state: State, _year: number, month: number) => month,
    (_state: State, _year: number, _month: number, currentBusinessDate: string) =>
      currentBusinessDate,
    (
      _state: State,
      _year: number,
      _month: number,
      _currentBusinessDate: string,
      agentId?: string,
    ) => agentId,
    (
      _state: State,
      _year: number,
      _month: number,
      _currentBusinessDate: string,
      _agentId?: string,
      scope?: SettlementScope,
    ) => scope,
    (
      _state: State,
      _year: number,
      _month: number,
      _currentBusinessDate: string,
      _agentId?: string,
      _scope?: SettlementScope,
      routeId?: string,
    ) => routeId,
  ],
  (
    collections,
    accounts,
    customers,
    schemes,
    ledgerEntries,
    settlements,
    timezone,
    year,
    month,
    currentBusinessDate,
    agentId,
    scope,
    routeId,
  ): MonthlyCollectionReport => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const isCurrentMonth = currentBusinessDate.startsWith(monthPrefix);

    const customerById = new Map(customers.map(customer => [customer.id, customer]));
    const schemeById = new Map(schemes.map(scheme => [scheme.id, scheme]));

    // Everything that really happened on these accounts this month, whoever collected it.
    // Missed days are a customer/account fact, so they must not be narrowed to one agent.
    const monthActivity = collections.filter(
      c => c.status !== 'REVERSED' && c.businessDate.startsWith(monthPrefix),
    );
    const activityByAccount = groupBy(monthActivity, c => c.accountId);

    // The money side: exactly the book a settlement of this scope would close.
    const scopedMonthCollections = monthActivity.filter(c => {
      if (agentId && c.collectedByAgentId !== agentId) return false;
      if (scope && getCollectionSettlementScope(c) !== scope) return false;
      return true;
    });

    // Route membership comes from the persisted customer record, not a report-only map
    const isOnRoute = (customerId: string) =>
      !routeId || customerById.get(customerId)?.routeId === routeId;

    const reportedCollections = scopedMonthCollections.filter(c => isOnRoute(c.customerId));
    const collectionsByAccount = groupBy(reportedCollections, c => c.accountId);

    const relevantAccounts = accounts.filter(account => {
      if (account.status !== 'ACTIVE') return false;
      if (!isOnRoute(account.customerId)) return false;

      if (scope === SettlementScope.DELEGATED) {
        // A delegated book has no ownership column of its own — the delegated collections
        // are what define which accounts belong to it.
        return collectionsByAccount.has(account.id);
      }

      if (agentId) {
        return customerById.get(account.customerId)?.primaryAgentId === agentId;
      }

      return true;
    });

    const ledgerByAccount = groupBy(ledgerEntries, entry => entry.accountId);

    // One CREDIT entry per collection is the expected financial effect
    const creditsByCollection = new Map<string, number>();
    ledgerEntries.forEach((entry: LedgerEntry) => {
      if (entry.entryType !== 'CREDIT' || !entry.collectionId) return;
      creditsByCollection.set(
        entry.collectionId,
        (creditsByCollection.get(entry.collectionId) ?? 0) + 1,
      );
    });

    const rows: MonthlyCollectionRow[] = relevantAccounts.map(account => {
      const customer = customerById.get(account.customerId);
      const scheme = schemeById.get(account.schemeId);
      const accountCollections = collectionsByAccount.get(account.id) ?? [];

      const dailyCollections: Record<number, number | null> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dailyCollections[day] = null;
      }

      let monthlyTotal = 0;
      let penaltyCollected = 0;

      accountCollections.forEach(collection => {
        const day = getDayFromBusinessDate(collection.businessDate);
        const amount = collection.amount + collection.penaltyAmount;
        dailyCollections[day] = (dailyCollections[day] ?? 0) + amount;
        monthlyTotal += amount;
        penaltyCollected += collection.penaltyAmount;
      });

      // Same Cash/UPI rule as the settlement screen, from the same function
      const { cashTotal, upiTotal } = calculateSettlementSummary(accountCollections);

      const accountLedger = ledgerByAccount.get(account.id) ?? [];

      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountStatus: account.status,
        customerId: account.customerId,
        customerName: customer?.fullName || 'Unknown',
        installmentAmount: account.installmentAmount,
        frequency: scheme?.frequency,
        dailyCollections,
        collectionCount: accountCollections.length,
        monthlyTotal,
        cashCollected: cashTotal,
        upiCollected: upiTotal,
        penaltyCollected,
        missedDays: scheme
          ? calculateMissedDaysForMonth(
              account,
              scheme,
              activityByAccount.get(account.id) ?? [],
              year,
              month,
              currentBusinessDate,
              timezone,
            )
          : 0,
        ledgerBalance: calculateAccountBalance(accountLedger),
        cachedBalance: account.currentBalance,
        hasLedgerData: accountLedger.length > 0,
      };
    });

    const dailyTotals: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dailyTotals[day] = sumOf(rows, row => row.dailyCollections[day] || 0);
    }

    const grandTotal = sumOf(rows, row => row.monthlyTotal);
    const totalCashCollected = sumOf(rows, row => row.cashCollected);
    const totalUpiCollected = sumOf(rows, row => row.upiCollected);

    const settlement = buildSettlementReconciliation(
      scopedMonthCollections,
      settlements,
      monthPrefix,
      agentId,
      scope,
    );

    const balanceChecks: ReportBalanceCheck[] = rows.map(row => ({
      accountNumber: row.accountNumber,
      ledgerBalance: row.ledgerBalance,
      cachedBalance: row.cachedBalance,
      hasLedgerData: row.hasLedgerData,
      collectedInMonth: row.monthlyTotal,
    }));

    const settlementChecks: ReportSettlementCheck[] = settlement.entries.map(entry => ({
      businessDate: entry.businessDate,
      cashCollected: entry.cashCollected,
      settledCash: entry.settledCash,
      cashInHand: entry.cashInHand,
    }));

    const receiptsWithoutLedgerEntry: string[] = [];
    const receiptsWithDuplicateLedgerEntry: string[] = [];
    reportedCollections.forEach(collection => {
      const credits = creditsByCollection.get(collection.id) ?? 0;
      if (credits === 0) {
        receiptsWithoutLedgerEntry.push(collection.receiptNo);
      } else if (credits > 1) {
        receiptsWithDuplicateLedgerEntry.push(collection.receiptNo);
      }
    });

    const crossChecks: MonthlyReportCrossChecks = {
      cashTotal: totalCashCollected,
      upiTotal: totalUpiCollected,
      inScopeCollectionTotal: sumOf(reportedCollections, c => c.amount + c.penaltyAmount),
      // A FAILED collection never reached storage. The rest of the app counts everything
      // except REVERSED, so the report keeps that one validity rule and surfaces this
      // condition instead of quietly applying a second rule of its own.
      failedCollectionCount: reportedCollections.filter(c => c.status === 'FAILED').length,
      receiptsWithoutLedgerEntry,
      receiptsWithDuplicateLedgerEntry,
      balanceChecks,
      settlementChecks,
    };

    const { isValid, errors } = verifyMonthlyReportReconciliation(
      rows.map(row => row.monthlyTotal),
      Object.values(dailyTotals),
      grandTotal,
      crossChecks,
    );

    return {
      year,
      month,
      monthPrefix,
      daysInMonth,
      currentBusinessDate,
      isCurrentMonth,
      agentId,
      scope,
      routeId,
      rows,
      dailyTotals,
      grandTotal,
      totalCashCollected,
      totalUpiCollected,
      totalPenaltyCollected: sumOf(rows, row => row.penaltyCollected),
      totalMissedDays: sumOf(rows, row => row.missedDays),
      collectionCount: sumOf(rows, row => row.collectionCount),
      settlement,
      isAuditSuccessful: isValid,
      auditErrors: errors,
    };
  },
);

/**
 * Generate daily summary report
 */
export const selectDailySummary = createSelector(
  [
    selectCollectionEntities,
    selectAgentEntities,
    (_state: State, businessDate: string) => businessDate,
  ],
  (collections, agents, businessDate): DailySummary => {
    const dayCollections = collections.filter(
      c => c.businessDate === businessDate && c.status !== 'REVERSED',
    );

    let totalCash = 0;
    let totalUpi = 0;
    const agentSummaries: DailySummary['agentSummaries'] = {};

    dayCollections.forEach(collection => {
      const amount = collection.amount + collection.penaltyAmount;
      const agentId = collection.collectedByAgentId;

      // Update totals
      if (collection.mode === 'CASH') {
        totalCash += amount;
      } else {
        totalUpi += amount;
      }

      // Update agent summary
      if (!agentSummaries[agentId]) {
        const agent = agents.find(a => a.id === agentId);
        agentSummaries[agentId] = {
          agentId,
          agentName: agent?.name || 'Unknown',
          cash: 0,
          upi: 0,
          total: 0,
          count: 0,
        };
      }

      if (collection.mode === 'CASH') {
        agentSummaries[agentId].cash += amount;
      } else {
        agentSummaries[agentId].upi += amount;
      }
      agentSummaries[agentId].total += amount;
      agentSummaries[agentId].count += 1;
    });

    return {
      businessDate,
      totalCash,
      totalUpi,
      totalCollection: totalCash + totalUpi,
      collectionCount: dayCollections.length,
      agentSummaries,
    };
  },
);

/**
 * Get collections summary for date range
 */
export const selectDateRangeSummary = createSelector(
  [
    selectCollectionEntities,
    (_state: State, startDate: string) => startDate,
    (_state: State, _startDate: string, endDate: string) => endDate,
    (_state: State, _startDate: string, _endDate: string, agentId?: string) => agentId,
  ],
  (collections, startDate, endDate, agentId) => {
    let filtered = collections.filter(
      c => c.businessDate >= startDate && c.businessDate <= endDate && c.status !== 'REVERSED',
    );

    if (agentId) {
      filtered = filtered.filter(c => c.collectedByAgentId === agentId);
    }

    const { cashTotal, upiTotal, totalCollection, collectionCount } =
      calculateSettlementSummary(filtered);

    return {
      startDate,
      endDate,
      totalCash: cashTotal,
      totalUpi: upiTotal,
      totalCollection,
      collectionCount,
    };
  },
);

/**
 * Get overdue customers (no collection in last N days)
 */
export const selectOverdueCustomers = createSelector(
  [
    selectCustomerEntities,
    selectAccountEntities,
    selectCollectionEntities,
    (_state: State, currentBusinessDate: string) => currentBusinessDate,
    (_state: State, _currentBusinessDate: string, overdueDays: number) => overdueDays,
  ],
  (customers, accounts, collections, currentBusinessDate, overdueDays) => {
    const activeAccounts = accounts.filter(a => a.status === 'ACTIVE');
    const overdueAccounts = activeAccounts.filter(account => {
      const accountCollections = collections
        .filter(c => c.accountId === account.id && c.status !== 'REVERSED')
        .sort((a, b) => b.businessDate.localeCompare(a.businessDate));

      const lastCollection = accountCollections[0];

      if (!lastCollection) {
        // No collection yet - check days since account opening
        const openedDate = parseISO(account.openedAt);
        const currentDate = parseISO(currentBusinessDate);
        const daysSinceOpening = Math.floor(
          (currentDate.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysSinceOpening > overdueDays;
      }

      const lastDate = parseISO(lastCollection.businessDate);
      const currentDate = parseISO(currentBusinessDate);
      const daysSinceLastCollection = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return daysSinceLastCollection > overdueDays;
    });

    return overdueAccounts.map(account => {
      const customer = customers.find(c => c.id === account.customerId);
      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        customerId: account.customerId,
        customerName: customer?.fullName || 'Unknown',
      };
    });
  },
);

/**
 * Get agent performance summary
 */
export const selectAgentPerformance = createSelector(
  [
    selectCollectionEntities,
    selectAgentEntities,
    (_state: State, startDate: string) => startDate,
    (_state: State, _startDate: string, endDate: string) => endDate,
  ],
  (collections, agents, startDate, endDate) => {
    const filtered = collections.filter(
      c => c.businessDate >= startDate && c.businessDate <= endDate && c.status !== 'REVERSED',
    );

    const agentPerformance = agents.map(agent => {
      const agentCollections = filtered.filter(c => c.collectedByAgentId === agent.id);
      const { cashTotal, upiTotal, totalCollection, collectionCount } =
        calculateSettlementSummary(agentCollections);

      return {
        agentId: agent.id,
        agentName: agent.name,
        agentCode: agent.agentCode,
        totalAmount: totalCollection,
        cashAmount: cashTotal,
        upiAmount: upiTotal,
        collectionCount,
      };
    });

    return agentPerformance.sort((a, b) => b.totalAmount - a.totalAmount);
  },
);

// ===========================
// EXPORTS
// ===========================

export default {
  selectMonthlyCollectionReport,
  selectDailySummary,
  selectDateRangeSummary,
  selectOverdueCustomers,
  selectAgentPerformance,
};

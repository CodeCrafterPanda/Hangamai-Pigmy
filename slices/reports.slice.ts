/**
 * Reports Slice
 * Provides computed selectors for reports (mostly selector-based, minimal state)
 */

import { createSelector } from '@reduxjs/toolkit';
import type { State } from '@/utils/store';
import type { Collection, Account, Customer } from '@/types';
import { getEntitiesArray } from '@/utils/storage';
import { verifyMonthlyReportReconciliation } from '@/utils/businessLogic';
import { format, getDaysInMonth, parseISO } from 'date-fns';

// ===========================
// TYPES
// ===========================

export interface MonthlyCollectionRow {
  accountId: string;
  accountNumber: string;
  customerName: string;
  dailyCollections: Record<number, number | null>; // day -> amount
  monthlyTotal: number;
}

export interface MonthlyCollectionReport {
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  rows: MonthlyCollectionRow[];
  dailyTotals: Record<number, number>; // day -> total for that day
  grandTotal: number;
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
 * Get collections for a specific month
 */
function getCollectionsForMonth(
  collections: Collection[],
  year: number,
  month: number
): Collection[] {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  
  return collections.filter(c => {
    if (c.status === 'REVERSED') return false;
    return c.businessDate.startsWith(prefix);
  });
}

/**
 * Get day from business date string (YYYY-MM-DD)
 */
function getDayFromBusinessDate(businessDate: string): number {
  return parseInt(businessDate.split('-')[2], 10);
}

// ===========================
// SELECTORS
// ===========================

/**
 * Generate monthly collection report
 */
export const selectMonthlyCollectionReport = createSelector(
  [
    (state: State) => getEntitiesArray(state.collections.collections),
    (state: State) => getEntitiesArray(state.accounts.accounts),
    (state: State) => getEntitiesArray(state.customers.customers),
    (state: State, year: number) => year,
    (state: State, year: number, month: number) => month,
    (state: State, year: number, month: number, routeId?: string) => routeId,
    (state: State, year: number, month: number, routeId?: string, agentId?: string) => agentId,
  ],
  (
    collections,
    accounts,
    customers,
    year,
    month,
    routeId,
    agentId
  ): MonthlyCollectionReport => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    
    // Filter collections for the month
    let monthCollections = getCollectionsForMonth(collections, year, month);
    
    // Apply filters
    if (agentId) {
      monthCollections = monthCollections.filter(c => c.collectedByAgentId === agentId);
    }
    
    // Get relevant accounts
    let relevantAccounts = accounts.filter(a => a.status === 'ACTIVE');
    
    if (routeId) {
      const routeCustomerIds = customers
        .filter(c => c.routeId === routeId)
        .map(c => c.id);
      relevantAccounts = relevantAccounts.filter(a =>
        routeCustomerIds.includes(a.customerId)
      );
    }
    
    if (agentId) {
      const agentCustomerIds = customers
        .filter(c => c.primaryAgentId === agentId)
        .map(c => c.id);
      relevantAccounts = relevantAccounts.filter(a =>
        agentCustomerIds.includes(a.customerId)
      );
    }
    
    // Build rows
    const rows: MonthlyCollectionRow[] = relevantAccounts.map(account => {
      const customer = customers.find(c => c.id === account.customerId);
      const accountCollections = monthCollections.filter(c => c.accountId === account.id);
      
      const dailyCollections: Record<number, number | null> = {};
      let monthlyTotal = 0;
      
      // Initialize all days as null
      for (let day = 1; day <= daysInMonth; day++) {
        dailyCollections[day] = null;
      }
      
      // Fill in collections
      accountCollections.forEach(collection => {
        const day = getDayFromBusinessDate(collection.businessDate);
        const amount = collection.amount + collection.penaltyAmount;
        dailyCollections[day] = (dailyCollections[day] || 0) + amount;
        monthlyTotal += amount;
      });
      
      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        customerName: customer?.fullName || 'Unknown',
        dailyCollections,
        monthlyTotal,
      };
    });
    
    // Calculate daily totals
    const dailyTotals: Record<number, number> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      dailyTotals[day] = rows.reduce(
        (sum, row) => sum + (row.dailyCollections[day] || 0),
        0
      );
    }
    
    // Calculate grand total
    const grandTotal = rows.reduce((sum, row) => sum + row.monthlyTotal, 0);
    
    // Verify reconciliation
    const customerTotals = rows.map(r => r.monthlyTotal);
    const dayTotals = Object.values(dailyTotals);
    const { isValid, errors } = verifyMonthlyReportReconciliation(
      customerTotals,
      dayTotals,
      grandTotal
    );
    
    return {
      year,
      month,
      daysInMonth,
      rows,
      dailyTotals,
      grandTotal,
      isAuditSuccessful: isValid,
      auditErrors: errors,
    };
  }
);

/**
 * Generate daily summary report
 */
export const selectDailySummary = createSelector(
  [
    (state: State) => getEntitiesArray(state.collections.collections),
    (state: State) => getEntitiesArray(state.settings.agents),
    (state: State, businessDate: string) => businessDate,
  ],
  (collections, agents, businessDate): DailySummary => {
    const dayCollections = collections.filter(
      c => c.businessDate === businessDate && c.status !== 'REVERSED'
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
  }
);

/**
 * Get collections summary for date range
 */
export const selectDateRangeSummary = createSelector(
  [
    (state: State) => getEntitiesArray(state.collections.collections),
    (state: State, startDate: string) => startDate,
    (state: State, startDate: string, endDate: string) => endDate,
    (state: State, startDate: string, endDate: string, agentId?: string) => agentId,
  ],
  (collections, startDate, endDate, agentId) => {
    let filtered = collections.filter(
      c =>
        c.businessDate >= startDate &&
        c.businessDate <= endDate &&
        c.status !== 'REVERSED'
    );
    
    if (agentId) {
      filtered = filtered.filter(c => c.collectedByAgentId === agentId);
    }
    
    const totalCash = filtered
      .filter(c => c.mode === 'CASH')
      .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
    
    const totalUpi = filtered
      .filter(c => c.mode === 'UPI')
      .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
    
    return {
      startDate,
      endDate,
      totalCash,
      totalUpi,
      totalCollection: totalCash + totalUpi,
      collectionCount: filtered.length,
    };
  }
);

/**
 * Get overdue customers (no collection in last N days)
 */
export const selectOverdueCustomers = createSelector(
  [
    (state: State) => getEntitiesArray(state.customers.customers),
    (state: State) => getEntitiesArray(state.accounts.accounts),
    (state: State) => getEntitiesArray(state.collections.collections),
    (state: State, currentBusinessDate: string) => currentBusinessDate,
    (state: State, currentBusinessDate: string, overdueDays: number) => overdueDays,
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
          (currentDate.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceOpening > overdueDays;
      }
      
      const lastDate = parseISO(lastCollection.businessDate);
      const currentDate = parseISO(currentBusinessDate);
      const daysSinceLastCollection = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
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
  }
);

/**
 * Get agent performance summary
 */
export const selectAgentPerformance = createSelector(
  [
    (state: State) => getEntitiesArray(state.collections.collections),
    (state: State) => getEntitiesArray(state.settings.agents),
    (state: State, startDate: string) => startDate,
    (state: State, startDate: string, endDate: string) => endDate,
  ],
  (collections, agents, startDate, endDate) => {
    const filtered = collections.filter(
      c =>
        c.businessDate >= startDate &&
        c.businessDate <= endDate &&
        c.status !== 'REVERSED'
    );
    
    const agentPerformance = agents.map(agent => {
      const agentCollections = filtered.filter(c => c.collectedByAgentId === agent.id);
      
      const totalAmount = agentCollections.reduce(
        (sum, c) => sum + c.amount + c.penaltyAmount,
        0
      );
      
      const cashAmount = agentCollections
        .filter(c => c.mode === 'CASH')
        .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
      
      const upiAmount = agentCollections
        .filter(c => c.mode === 'UPI')
        .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        agentCode: agent.agentCode,
        totalAmount,
        cashAmount,
        upiAmount,
        collectionCount: agentCollections.length,
      };
    });
    
    return agentPerformance.sort((a, b) => b.totalAmount - a.totalAmount);
  }
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


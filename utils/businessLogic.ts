/**
 * Business Logic Utilities
 * Core domain logic for pigmy collection system
 */

import { format, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import type {
  Account,
  LedgerEntry,
  Collection,
  LedgerType,
  CollectionMode,
  SchemeFrequency,
} from '@/types';

// ===========================
// DATE & TIMEZONE UTILITIES
// ===========================

/**
 * Get business date from timestamp in branch timezone
 * @param timestamp ISO timestamp
 * @param timezone IANA timezone string (e.g., "Asia/Kolkata")
 * @returns Business date string in YYYY-MM-DD format
 */
export function getBusinessDate(timestamp: string, timezone: string): string {
  try {
    const date = parseISO(timestamp);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('[BusinessLogic] Error getting business date:', error);
    // Fallback to local date
    return format(new Date(timestamp), 'yyyy-MM-dd');
  }
}

/**
 * Get current business date in branch timezone
 */
export function getCurrentBusinessDate(timezone: string): string {
  return getBusinessDate(new Date().toISOString(), timezone);
}

/**
 * Check if backdate is allowed
 * @param targetDate Business date to check (YYYY-MM-DD)
 * @param currentDate Current business date (YYYY-MM-DD)
 * @param allowBackdateDays Number of days allowed to backdate
 * @returns true if backdate is allowed
 */
export function isBackdateAllowed(
  targetDate: string,
  currentDate: string,
  allowBackdateDays: number
): boolean {
  const target = parseISO(targetDate);
  const current = parseISO(currentDate);
  const daysDiff = differenceInDays(current, target);
  
  return daysDiff >= 0 && daysDiff <= allowBackdateDays;
}

/**
 * Format timestamp for display in branch timezone
 */
export function formatTimestampInTimezone(
  timestamp: string,
  timezone: string,
  formatStr: string = 'PPpp'
): string {
  try {
    return formatInTimeZone(parseISO(timestamp), timezone, formatStr);
  } catch (error) {
    console.error('[BusinessLogic] Error formatting timestamp:', error);
    return timestamp;
  }
}

// ===========================
// RECEIPT NUMBER GENERATION
// ===========================

export interface ReceiptSeriesConfig {
  prefix: string;
  year: number;
  currentNumber: number;
}

/**
 * Generate next receipt number
 * Format: {PREFIX}-{YEAR}-{NUMBER}
 * Example: RCPT-2025-0001
 */
export function generateReceiptNumber(series: ReceiptSeriesConfig): {
  receiptNo: string;
  nextNumber: number;
} {
  const nextNumber = series.currentNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  const receiptNo = `${series.prefix}-${series.year}-${paddedNumber}`;
  
  return { receiptNo, nextNumber };
}

/**
 * Initialize receipt series for a new year
 */
export function initializeReceiptSeriesForYear(
  prefix: string,
  year: number
): ReceiptSeriesConfig {
  return {
    prefix,
    year,
    currentNumber: 0,
  };
}

// ===========================
// CUSTOMER CODE GENERATION
// ===========================

/**
 * Generate customer code
 * Format: CUST-{NUMBER}
 * Example: CUST-0001
 */
export function generateCustomerCode(lastNumber: number): string {
  const nextNumber = lastNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `CUST-${paddedNumber}`;
}

/**
 * Generate account number
 * Format: ACCT-{YEAR}-{NUMBER}
 * Example: ACCT-2025-0001
 */
export function generateAccountNumber(year: number, lastNumber: number): string {
  const nextNumber = lastNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  return `ACCT-${year}-${paddedNumber}`;
}

// ===========================
// IDEMPOTENCY KEY GENERATION
// ===========================

/**
 * Generate idempotency key for collections
 * Ensures uniqueness per device per transaction
 */
export function generateIdempotencyKey(
  deviceFingerprint: string,
  accountId: string,
  timestamp: string
): string {
  return `${deviceFingerprint}-${accountId}-${timestamp}`;
}

// ===========================
// DUE & PENALTY CALCULATIONS
// ===========================

export interface DueCalculationResult {
  dueAmount: number;
  missedDays: number;
  penaltyAmount: number;
  totalDue: number;
  lastCollectionDate?: string;
}

/**
 * Calculate due amount, missed days, and penalty for an account
 * @param account Account entity
 * @param ledgerEntries All ledger entries for the account (sorted by postedAt desc)
 * @param collections All collections for the account (sorted by collectedAt desc)
 * @param currentBusinessDate Current business date (YYYY-MM-DD)
 * @param frequency Scheme frequency
 * @param penaltyPerDay Penalty per day from scheme
 * @returns Calculation result
 */
export function calculateDueMissedPenalty(
  account: Account,
  ledgerEntries: LedgerEntry[],
  collections: Collection[],
  currentBusinessDate: string,
  frequency: SchemeFrequency,
  penaltyPerDay: number
): DueCalculationResult {
  // Get last collection date
  const lastCollection = collections.find(c => c.status !== 'REVERSED');
  const lastCollectionDate = lastCollection?.businessDate;
  
  // Calculate missed days based on frequency
  let missedDays = 0;
  if (lastCollectionDate) {
    const daysSinceLastCollection = differenceInDays(
      parseISO(currentBusinessDate),
      parseISO(lastCollectionDate)
    );
    
    switch (frequency) {
      case 'DAILY':
        missedDays = Math.max(0, daysSinceLastCollection - 1);
        break;
      case 'WEEKLY':
        missedDays = Math.max(0, Math.floor(daysSinceLastCollection / 7) - 1) * 7;
        break;
      case 'MONTHLY':
        missedDays = Math.max(0, Math.floor(daysSinceLastCollection / 30) - 1) * 30;
        break;
    }
  } else {
    // No collection yet - calculate from account opening
    const daysSinceOpening = differenceInDays(
      parseISO(currentBusinessDate),
      parseISO(account.openedAt)
    );
    
    switch (frequency) {
      case 'DAILY':
        missedDays = Math.max(0, daysSinceOpening);
        break;
      case 'WEEKLY':
        missedDays = Math.max(0, Math.floor(daysSinceOpening / 7)) * 7;
        break;
      case 'MONTHLY':
        missedDays = Math.max(0, Math.floor(daysSinceOpening / 30)) * 30;
        break;
    }
  }
  
  // Calculate due amount (installment * missed cycles + today's installment)
  const dueAmount = account.installmentAmount * (missedDays + 1);
  
  // Calculate penalty
  const penaltyAmount = missedDays > 0 ? missedDays * penaltyPerDay : 0;
  
  const totalDue = dueAmount + penaltyAmount;
  
  return {
    dueAmount,
    missedDays,
    penaltyAmount,
    totalDue,
    lastCollectionDate,
  };
}

// ===========================
// LEDGER OPERATIONS
// ===========================

/**
 * Calculate account balance from ledger entries
 * CREDIT and PENALTY add to balance
 * REVERSAL subtracts from balance
 */
export function calculateAccountBalance(ledgerEntries: LedgerEntry[]): number {
  return ledgerEntries.reduce((balance, entry) => {
    switch (entry.entryType) {
      case 'CREDIT':
      case 'PENALTY':
      case 'ADJUSTMENT':
        return balance + entry.amount;
      case 'REVERSAL':
        return balance - Math.abs(entry.amount);
      default:
        return balance;
    }
  }, 0);
}

/**
 * Create ledger entries for a collection
 */
export function createLedgerEntriesForCollection(
  accountId: string,
  collectionId: string,
  amount: number,
  penaltyAmount: number,
  postedAt: string
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  
  // Credit entry for collection amount
  entries.push({
    id: `${collectionId}-CREDIT`,
    accountId,
    collectionId,
    entryType: 'CREDIT',
    amount,
    narration: `Collection of ₹${amount}`,
    postedAt,
    createdAt: new Date().toISOString(),
  });
  
  // Penalty entry if applicable
  if (penaltyAmount > 0) {
    entries.push({
      id: `${collectionId}-PENALTY`,
      accountId,
      collectionId,
      entryType: 'PENALTY',
      amount: penaltyAmount,
      narration: `Penalty of ₹${penaltyAmount}`,
      postedAt,
      createdAt: new Date().toISOString(),
    });
  }
  
  return entries;
}

/**
 * Create reversal ledger entry
 */
export function createReversalLedgerEntry(
  originalCollection: Collection,
  reversalId: string,
  postedAt: string
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  
  // Reverse the collection amount
  entries.push({
    id: `${reversalId}-REVERSAL-CREDIT`,
    accountId: originalCollection.accountId,
    collectionId: originalCollection.id,
    entryType: 'REVERSAL',
    amount: originalCollection.amount,
    narration: `Reversal of receipt ${originalCollection.receiptNo}`,
    postedAt,
    createdAt: new Date().toISOString(),
  });
  
  // Reverse the penalty if applicable
  if (originalCollection.penaltyAmount > 0) {
    entries.push({
      id: `${reversalId}-REVERSAL-PENALTY`,
      accountId: originalCollection.accountId,
      collectionId: originalCollection.id,
      entryType: 'REVERSAL',
      amount: originalCollection.penaltyAmount,
      narration: `Reversal of penalty for receipt ${originalCollection.receiptNo}`,
      postedAt,
      createdAt: new Date().toISOString(),
    });
  }
  
  return entries;
}

// ===========================
// SETTLEMENT CALCULATIONS
// ===========================

export interface SettlementSummary {
  cashTotal: number;
  upiTotal: number;
  totalCollection: number;
  collectionCount: number;
}

/**
 * Calculate settlement summary from collections
 * @param collections Collections for the business date
 * @returns Settlement summary
 */
export function calculateSettlementSummary(
  collections: Collection[]
): SettlementSummary {
  const validCollections = collections.filter(c => c.status !== 'REVERSED');
  
  const cashTotal = validCollections
    .filter(c => c.mode === 'CASH')
    .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  
  const upiTotal = validCollections
    .filter(c => c.mode === 'UPI')
    .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  
  return {
    cashTotal,
    upiTotal,
    totalCollection: cashTotal + upiTotal,
    collectionCount: validCollections.length,
  };
}

/**
 * Calculate variance
 */
export function calculateVariance(cashInHand: number, cashTotal: number): number {
  return cashInHand - cashTotal;
}

// ===========================
// DELEGATION CHECKS
// ===========================

export interface DelegationEligibility {
  isEligible: boolean;
  reason?: string;
  delegationId?: string;
}

/**
 * Check if agent can collect for a customer/account via delegation
 */
export function checkDelegationEligibility(
  agentId: string,
  customerId: string,
  accountId: string,
  delegations: any[], // Active delegations
  currentTimestamp: string,
  todayCollectionCount: number,
  todayCollectionAmount: number
): DelegationEligibility {
  // Find applicable delegation
  const applicableDelegation = delegations.find(d => {
    // Check customer match
    if (d.customerId !== customerId) return false;
    
    // Check account match (null means all accounts)
    if (d.accountId && d.accountId !== accountId) return false;
    
    // Check agent match
    if (d.secondaryAgentId !== agentId) return false;
    
    // Check time window
    const now = new Date(currentTimestamp).getTime();
    const start = new Date(d.startAt).getTime();
    const end = new Date(d.endAt).getTime();
    if (now < start || now > end) return false;
    
    // Check status
    if (d.status !== 'ACTIVE') return false;
    
    return true;
  });
  
  if (!applicableDelegation) {
    return {
      isEligible: false,
      reason: 'No active delegation found',
    };
  }
  
  // Check collection count limit
  if (
    applicableDelegation.maxCollectionsPerDay &&
    todayCollectionCount >= applicableDelegation.maxCollectionsPerDay
  ) {
    return {
      isEligible: false,
      reason: `Max collections per day (${applicableDelegation.maxCollectionsPerDay}) reached`,
      delegationId: applicableDelegation.id,
    };
  }
  
  // Check amount limit
  if (
    applicableDelegation.maxAmountPerDay &&
    todayCollectionAmount >= applicableDelegation.maxAmountPerDay
  ) {
    return {
      isEligible: false,
      reason: `Max amount per day (₹${applicableDelegation.maxAmountPerDay}) reached`,
      delegationId: applicableDelegation.id,
    };
  }
  
  return {
    isEligible: true,
    delegationId: applicableDelegation.id,
  };
}

// ===========================
// DUPLICATE DETECTION
// ===========================

/**
 * Check if collection is likely a duplicate
 */
export function isDuplicateCollection(
  accountId: string,
  businessDate: string,
  amount: number,
  collectedByAgentId: string,
  existingCollections: Collection[],
  timeWindowMinutes: number = 5
): boolean {
  const currentTime = new Date().getTime();
  const timeWindow = timeWindowMinutes * 60 * 1000;
  
  return existingCollections.some(c => {
    if (c.status === 'REVERSED') return false;
    if (c.accountId !== accountId) return false;
    if (c.businessDate !== businessDate) return false;
    if (c.amount !== amount) return false;
    if (c.collectedByAgentId !== collectedByAgentId) return false;
    
    // Check time window
    const collectionTime = new Date(c.collectedAt).getTime();
    return currentTime - collectionTime < timeWindow;
  });
}

// ===========================
// MONTHLY REPORT RECONCILIATION
// ===========================

/**
 * Verify monthly report totals match
 */
export function verifyMonthlyReportReconciliation(
  customerTotals: number[],
  dayTotals: number[],
  grandTotal: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Sum of all customer totals should equal grand total
  const customerSum = customerTotals.reduce((sum, total) => sum + total, 0);
  if (Math.abs(customerSum - grandTotal) > 0.01) {
    // Allow 1 paisa difference for rounding
    errors.push(
      `Customer totals sum (₹${customerSum}) does not match grand total (₹${grandTotal})`
    );
  }
  
  // Sum of all day totals should equal grand total
  const daySum = dayTotals.reduce((sum, total) => sum + total, 0);
  if (Math.abs(daySum - grandTotal) > 0.01) {
    errors.push(`Day totals sum (₹${daySum}) does not match grand total (₹${grandTotal})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================
// VALIDATION UTILITIES
// ===========================

/**
 * Validate phone number (basic Indian mobile)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Normalize phone number for duplicate checking
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '').trim();
}

/**
 * Mask KYC number for display
 */
export function maskKYCNumber(kycNumber: string, visibleDigits: number = 4): string {
  if (kycNumber.length <= visibleDigits) return kycNumber;
  
  const masked = 'X'.repeat(kycNumber.length - visibleDigits);
  const visible = kycNumber.slice(-visibleDigits);
  
  return `${masked}${visible}`;
}

// ===========================
// EXPONENTIAL BACKOFF
// ===========================

/**
 * Calculate next retry time with exponential backoff
 * @param retryCount Current retry count
 * @param baseDelayMs Base delay in milliseconds (default 1000 = 1 second)
 * @param maxDelayMs Maximum delay in milliseconds (default 3600000 = 1 hour)
 * @returns ISO timestamp for next retry
 */
export function calculateNextRetryTime(
  retryCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 3600000
): string {
  const delayMs = Math.min(baseDelayMs * Math.pow(2, retryCount), maxDelayMs);
  const nextRetryTime = new Date(Date.now() + delayMs);
  return nextRetryTime.toISOString();
}

// ===========================
// EXPORTS
// ===========================

export default {
  getBusinessDate,
  getCurrentBusinessDate,
  isBackdateAllowed,
  formatTimestampInTimezone,
  generateReceiptNumber,
  initializeReceiptSeriesForYear,
  generateCustomerCode,
  generateAccountNumber,
  generateIdempotencyKey,
  calculateDueMissedPenalty,
  calculateAccountBalance,
  createLedgerEntriesForCollection,
  createReversalLedgerEntry,
  calculateSettlementSummary,
  calculateVariance,
  checkDelegationEligibility,
  isDuplicateCollection,
  verifyMonthlyReportReconciliation,
  validatePhone,
  normalizePhone,
  maskKYCNumber,
  calculateNextRetryTime,
};


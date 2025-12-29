/**
 * Type definitions for Offline Queue screen data
 */

export type TransactionStatus = 'pending' | 'failed' | 'synced';

export interface OfflineTransaction {
  id: string;
  receiptNumber: string;
  customerName: string;
  amount: number;
  time: string;
  status: TransactionStatus;
  errorMessage?: string;
  timestamp: Date;
}

export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  lastSyncTime: string;
  totalAmount: number;
}


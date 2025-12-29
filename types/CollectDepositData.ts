/**
 * Type definitions for Collect Deposit screen data
 */

export type PaymentMode = 'cash' | 'upi';

export interface CustomerInfo {
  id: string;
  name: string;
  accountNumber: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface DepositInfo {
  dueAmount: number;
  missedDays: number;
  penaltyAmount: number;
}

export interface CollectDepositData {
  customer: CustomerInfo;
  depositInfo: DepositInfo;
}


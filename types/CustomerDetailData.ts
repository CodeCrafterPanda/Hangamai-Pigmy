/**
 * Type definitions for Customer Detail screen data
 */

export type AccountType = 'pigmy' | 'loan';
export type AccountStatus = 'pending' | 'paid' | 'overdue';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface CustomerAccount {
  id: string;
  accountType: AccountType;
  accountNumber: string;
  label: string; // Display label for `amount`, e.g. "Account Balance"
  amount: number; // Ledger-derived account balance
  dueToday: number; // 0 when nothing is due today (already collected, or account not active)
  status: AccountStatus;
  progress?: number; // 0-100 for progress bar
}

export interface CustomerDetailData {
  customer: CustomerProfile;
  accounts: CustomerAccount[];
}


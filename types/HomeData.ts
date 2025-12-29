/**
 * Type definitions for Home screen data
 */

export interface UserProfile {
  name: string;
  branch: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface DailyStats {
  collectedToday: number;
  pendingCount: number;
  inHandAmount: number;
}

export interface AttentionAlert {
  overdueCustomers: number;
  pendingSync: number;
}

export interface Customer {
  id: string;
  name: string;
  accountNumber: string;
  location: string;
  initials: string;
}


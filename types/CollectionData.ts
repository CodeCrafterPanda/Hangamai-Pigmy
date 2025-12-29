/**
 * Type definitions for Collection/Customer data in routes
 */

export type CollectionStatus = 'pending' | 'overdue' | 'collected';

export interface CustomerCollection {
  id: string;
  customerId: string;
  customerName: string;
  accountType: string; // "Pigmy"
  accountNumber: string;
  status: CollectionStatus;
  dailyDueAmount?: number;
  totalOverdue?: number;
  collectedAmount?: number;
  initials: string;
}

export interface RouteDetailsHeader {
  routeName: string;
  routeNumber: string;
  totalStops: number;
  isOnline: boolean;
}

export interface CollectionFilters {
  dueToday: number;
  overdue: number;
  collected: number;
}


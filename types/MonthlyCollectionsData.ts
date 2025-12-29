/**
 * Type definitions for Monthly Collections screen data
 */

export interface CustomerMonthlyData {
  accountNumber: string;
  name: string;
  dailyCollections: { [day: string]: number | null };
  monthlyTotal: number;
}

export interface MonthlyCollectionsData {
  month: string;
  year: number;
  branch: string;
  selectedRoute?: string;
  selectedAgent?: string;
  status: string;
  daysInMonth: number;
  customers: CustomerMonthlyData[];
  dailyTotals: { [day: string]: number };
  grandTotal: number;
  isAuditSuccessful: boolean;
}

export interface FilterOption {
  agent: string;
  route: string | null;
  status: string;
}


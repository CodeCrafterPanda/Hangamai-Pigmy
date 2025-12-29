/**
 * Type definitions for Settlement screen data
 */

export interface DailySummary {
  totalCash: number;
  upiDigital: number;
  totalCollection: number;
}

export interface ReconciliationData {
  expectedCash: number;
  actualCash: number;
  variance: number;
  notes?: string;
}

export interface SettlementData {
  businessDate: string;
  dailySummary: DailySummary;
  isOffline: boolean;
}


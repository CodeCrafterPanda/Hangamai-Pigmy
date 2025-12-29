/**
 * Type definitions for Routes screen data
 */

export type RouteStatus = 'in_progress' | 'completed' | 'not_started';

export interface Route {
  id: string;
  routeId: string;
  name: string;
  status: RouteStatus;
  progress: number;
  totalCustomers: number;
  pendingCustomers: number;
}

export interface RoutesHeader {
  date: string;
  isOnline: boolean;
}


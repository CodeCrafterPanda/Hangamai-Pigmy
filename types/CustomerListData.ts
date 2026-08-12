/**
 * Type definitions for the Customers listing screen
 */

import type { CustomerStatus } from './entities';

export interface CustomerListItem {
  id: string;
  customerCode: string;
  name: string;
  routeName: string;
  status: CustomerStatus;
}

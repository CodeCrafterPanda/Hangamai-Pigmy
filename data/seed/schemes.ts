import { SchemeFrequency } from '@/types';
import { DEMO_BRANCH_ID, DEMO_SCHEME_DAILY_ID } from './ids';
import type { SeedScheme } from './types';

export const seedSchemes: SeedScheme[] = [
  {
    id: DEMO_SCHEME_DAILY_ID,
    branchId: DEMO_BRANCH_ID,
    name: 'Pigmy Daily 1 Year',
    frequency: SchemeFrequency.DAILY,
    minAmount: 100,
    // MVP policy: missed days stay real but the effective penalty is ₹0.
    penaltyPerDay: 0,
    penaltyType: 'NONE',
  },
];

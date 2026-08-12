import { DEMO_BRANCH_ID, DEMO_COOP_ID } from './ids';
import type { SeedBranch } from './types';

/** The single branch every other seed entity belongs to. */
export const seedBranch: SeedBranch = {
  id: DEMO_BRANCH_ID,
  coopId: DEMO_COOP_ID,
  code: 'HANGA',
  name: 'Hangamai Main Branch',
  address: 'Hanga, Maharashtra',
  // Drives the business date every collection is booked against.
  timezone: 'Asia/Kolkata',
};

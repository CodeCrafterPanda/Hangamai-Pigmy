import { DEMO_AGENT_ID, DEMO_AGENT_THREE_ID, DEMO_AGENT_TWO_ID, SEED_CUSTOMER_REF } from './ids';
import type { SeedDelegation } from './types';

/**
 * Customers handed to the logged-in agent as secondary collector. `primaryAgentId` must match
 * the customer's own `primaryAgentId` in `customers.ts`, otherwise the delegated scope and the
 * ownership check disagree. `accountId` is left out so the delegation covers all the customer's
 * accounts.
 */
export const seedDelegations: SeedDelegation[] = [
  {
    customerRef: SEED_CUSTOMER_REF.RAMESH_GENERAL_STORES,
    primaryAgentId: DEMO_AGENT_TWO_ID,
    secondaryAgentId: DEMO_AGENT_ID,
    durationDays: 30,
    createdBy: DEMO_AGENT_TWO_ID,
  },
  {
    customerRef: SEED_CUSTOMER_REF.PRIYA_TEXTILES,
    primaryAgentId: DEMO_AGENT_THREE_ID,
    secondaryAgentId: DEMO_AGENT_ID,
    durationDays: 30,
    createdBy: DEMO_AGENT_THREE_ID,
  },
];

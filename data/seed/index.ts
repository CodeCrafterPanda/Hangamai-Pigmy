/**
 * The seed dataset, assembled from one file per entity.
 *
 * The content files here are a sample: replacing them wholesale with a different valid dataset
 * is supported and requires no change under `utils/`, `slices/`, `scenes/` or `app/`. `types.ts`
 * is the contract that decides whether a replacement is valid; everything else in this folder is
 * data. Read `SEED-DATA.md` before editing — ids and handles are load-bearing references.
 */

import { seedAccounts } from './accounts';
import { seedAgents } from './agents';
import { seedBranch } from './branch';
import { seedCustomers } from './customers';
import { seedDelegations } from './delegations';
import { DEMO_AGENT_ID, DEMO_BRANCH_ID } from './ids';
import { seedLedgerEntries } from './ledgerEntries';
import { seedRoutes } from './routes';
import { seedSchemes } from './schemes';
import type { SeedDataset } from './types';

export const seedDataset: SeedDataset = {
  session: {
    agentId: DEMO_AGENT_ID,
    branchId: DEMO_BRANCH_ID,
    deviceFingerprint: 'demo-device',
  },
  branch: seedBranch,
  agents: seedAgents,
  routes: seedRoutes,
  schemes: seedSchemes,
  customers: seedCustomers,
  accounts: seedAccounts,
  delegations: seedDelegations,
  ledgerEntries: seedLedgerEntries,
};

export * from './ids';
export * from './types';
export {
  seedAccounts,
  seedAgents,
  seedBranch,
  seedCustomers,
  seedDelegations,
  seedLedgerEntries,
  seedRoutes,
  seedSchemes,
};

export default seedDataset;

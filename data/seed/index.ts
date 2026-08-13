/**
 * The seed dataset, loaded from the single JSON source of truth.
 *
 * `seed-data.json` is the sample content: replacing it wholesale with a different valid
 * dataset is supported and requires no change under `utils/`, `slices/`, `scenes/` or `app/`.
 * `types.ts` is the contract that decides whether a replacement is valid. Read `SEED-DATA.md`
 * before editing — ids and handles are load-bearing references.
 */

import rawSeedData from './seed-data.json';
import type { SeedDataset } from './types';

export const seedDataset: SeedDataset = rawSeedData as SeedDataset;

export * from './types';

/**
 * Convenience ids derived from the JSON so existing test imports keep compiling.
 * They are not a second dataset — they always read from `seedDataset`.
 */
export const DEMO_COOP_ID = seedDataset.branch.coopId;
export const DEMO_BRANCH_ID = seedDataset.branch.id;
export const DEMO_AGENT_ID = seedDataset.session.agentId;
export const DEMO_ROUTE_SUPA = seedDataset.routes[0]?.id ?? '';
export const DEMO_SCHEME_DAILY_ID = seedDataset.schemes[0]?.id ?? '';

export default seedDataset;

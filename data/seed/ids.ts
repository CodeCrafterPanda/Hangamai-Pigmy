/**
 * Fixed identifiers and handles for the sample dataset — sample content, not contract. A
 * replacement dataset declares its own names and values here; only `types.ts` is fixed.
 *
 * The ids below are written into the store verbatim and every foreign key in the dataset points
 * at one of them. Changing a value orphans every reference to it, so treat them as immutable
 * once a build has shipped.
 *
 * Only branch/agent/route/scheme/ledger-entry reducers accept a caller-supplied id. Customers,
 * accounts and delegations are given ids by their reducers, so the dataset links them through
 * the `SEED_CUSTOMER_REF` / `SEED_ACCOUNT_REF` handles below, which the loader resolves at seed
 * time. Handle values are internal to the dataset and never reach the store.
 */

export const DEMO_COOP_ID = 'coop-hangamai';
export const DEMO_BRANCH_ID = 'branch-hangamai';

export const DEMO_AGENT_ID = 'agent-demo-001';
export const DEMO_AGENT_TWO_ID = 'agent-other-001';
export const DEMO_AGENT_THREE_ID = 'agent-other-002';

export const DEMO_ROUTE_SUPA = 'route-supa';
export const DEMO_ROUTE_PARNER = 'route-parner';
export const DEMO_ROUTE_HANGA = 'route-hanga';

export const DEMO_SCHEME_DAILY_ID = 'scheme-pigmy-daily-1yr';

/**
 * Stable handles for seeded customers. Accounts and delegations reference a customer by
 * handle; the loader maps each handle to the id the customers reducer actually assigned.
 */
export const SEED_CUSTOMER_REF = {
  SURESH_PATIL: 'seed-customer-suresh-patil',
  ANITA_DESAI: 'seed-customer-anita-desai',
  RAJESH_KUMAR: 'seed-customer-rajesh-kumar',
  RAMESH_GENERAL_STORES: 'seed-customer-ramesh-general-stores',
  PRIYA_TEXTILES: 'seed-customer-priya-textiles',
} as const;

/**
 * Stable handles for seeded accounts. Opening ledger entries reference an account by handle;
 * the loader maps each handle to the id the accounts reducer actually assigned.
 */
export const SEED_ACCOUNT_REF = {
  SURESH_PATIL_PIGMY: 'seed-account-suresh-patil-pigmy',
  ANITA_DESAI_PIGMY: 'seed-account-anita-desai-pigmy',
  RAJESH_KUMAR_PIGMY: 'seed-account-rajesh-kumar-pigmy',
  RAMESH_GENERAL_STORES_PIGMY: 'seed-account-ramesh-general-stores-pigmy',
  PRIYA_TEXTILES_PIGMY: 'seed-account-priya-textiles-pigmy',
} as const;

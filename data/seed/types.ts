/**
 * Seed dataset contract.
 *
 * This file is the stable contract, derived from `types/entities.ts` — not from the sample
 * content sitting beside it. A replacement dataset is valid exactly when it type-checks against
 * `SeedDataset`. The dataset is pure data: it carries no timestamps and no reducer-generated
 * ids, because both are produced at seed time. See `SEED-DATA.md` for the field-by-field format.
 *
 * Customer/account `ref` handles are free-form strings declared in the JSON. Replacing
 * `seed-data.json` with another dataset that follows this schema does not require a code change.
 */

import type {
  Account,
  Agent,
  Branch,
  Customer,
  Delegation,
  LedgerEntry,
  Route,
  Scheme,
} from '@/types';

/** Dataset-internal handle for a customer. Never written to the store. */
export type SeedCustomerRef = string;

/** Dataset-internal handle for an account. Never written to the store. */
export type SeedAccountRef = string;

// Fixed-id entities: written with the id the dataset declares, and re-applied (upserted)
// unchanged on a recovery re-seed. `createdAt` is stamped by the loader.
export type SeedBranch = Omit<Branch, 'createdAt'>;
export type SeedAgent = Omit<Agent, 'createdAt'>;
export type SeedRoute = Omit<Route, 'createdAt'>;
export type SeedScheme = Omit<Scheme, 'createdAt'>;

/** Customer ids are assigned by the customers reducer. `customerCode` may be supplied. */
export type SeedCustomer = Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt'> & {
  ref: SeedCustomerRef;
  /** Optional override; omit to let the generated CUST-NNNN series assign one. */
  customerCode?: string;
};

/** Account ids and account numbers are assigned by the accounts reducer. */
export type SeedAccount = Omit<
  Account,
  'id' | 'customerId' | 'accountNumber' | 'currentBalance' | 'openedAt'
> & {
  ref: SeedAccountRef;
  customerRef: SeedCustomerRef;
  /** Optional override; omit to let the generated ACCT-YYYY-NNNN series assign one. */
  accountNumber?: string;
};

/** Delegation ids, status and window timestamps are assigned at seed time. */
export type SeedDelegation = Omit<
  Delegation,
  'id' | 'customerId' | 'status' | 'startAt' | 'endAt' | 'createdAt' | 'revokedAt'
> & {
  customerRef: SeedCustomerRef;
  /** Length of the delegation window in days, counted from the seed run. */
  durationDays: number;
};

/**
 * An opening ledger entry, e.g. an `ADJUSTMENT` that carries a balance over from a previous
 * system. The id is dataset-supplied and upserted, so re-seeding never duplicates an entry.
 * Only post what actually happened: a deposit an agent never collected does not belong here,
 * and there is deliberately no way to seed a `Collection` record.
 */
export type SeedLedgerEntry = Omit<LedgerEntry, 'accountId' | 'createdAt'> & {
  accountRef: SeedAccountRef;
};

/** The session the app starts in. Both ids must exist in the dataset. */
export interface SeedSession {
  agentId: string;
  branchId: string;
  deviceFingerprint: string;
}

export interface SeedDataset {
  session: SeedSession;
  branch: SeedBranch;
  agents: SeedAgent[];
  routes: SeedRoute[];
  schemes: SeedScheme[];
  customers: SeedCustomer[];
  accounts: SeedAccount[];
  delegations: SeedDelegation[];
  /** Opening balances only; omit or leave empty for a dataset that starts from zero. */
  ledgerEntries?: SeedLedgerEntry[];
}

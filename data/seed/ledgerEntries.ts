import type { SeedLedgerEntry } from './types';

/**
 * Opening ledger entries, e.g. balances carried over from a previous system.
 *
 * Empty on purpose: this sample starts every account at zero and lets the app write the ledger
 * itself, so it stays a truthful record of collections that actually happened. A dataset that
 * does need opening balances posts them here as `ADJUSTMENT` entries with dataset-supplied ids.
 */
export const seedLedgerEntries: SeedLedgerEntry[] = [];

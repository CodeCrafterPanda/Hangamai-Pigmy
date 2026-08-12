/**
 * Seed loader
 *
 * Reads the dataset from `data/seed` and dispatches it into the store. This file owns the
 * *how* (dispatch order, id resolution, idempotency, persistence); `data/seed` owns the *what*.
 * The dataset shipped there is a sample: swapping it for any other dataset that satisfies
 * `SeedDataset` must never require a change here, so nothing below may name a specific record,
 * id or count from it.
 *
 * Seed-once is decided by the caller (`app/_layout.tsx`) through
 * `hasCompletedSeed()` / `markSeedCompleted()`. This function is also the recovery path for a
 * device whose seed marker survived but whose domain baseline did not hydrate, so every step
 * has to be safe to run against a store that already holds records.
 */

import type { Dispatch, State } from '@/utils/store';
import { addCustomer, persistCustomers, selectAllCustomers } from '@/slices/customers.slice';
import {
  addAccount,
  addScheme,
  persistAccounts,
  selectAllAccounts,
} from '@/slices/accounts.slice';
import {
  updateSession,
  addRoute,
  addBranch,
  addAgent,
  persistSettings,
} from '@/slices/settings.slice';
import {
  createDelegation,
  persistDelegations,
  selectAllDelegations,
} from '@/slices/delegations.slice';
import { addLedgerEntries, persistLedger } from '@/slices/ledger.slice';
import { DelegationStatus } from '@/types';
import { seedDataset } from '@/data/seed';
import type { SeedAccountRef, SeedCustomerRef } from '@/data/seed';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Content key for a seeded customer.
 *
 * Customers, accounts and delegations are given generated ids by their reducers, so a seeded
 * customer cannot be recognised by id on a later run. Name + phone is the identity used to
 * decide what already exists, which is also why an agent-created customer is never touched:
 * they will not match any key in the dataset.
 */
const seedKey = (customer: { fullName: string; phone?: string }) =>
  `${customer.fullName}|${customer.phone ?? ''}`;

export async function seedDummyData(dispatch: Dispatch, getState: () => State) {
  console.log('[SeedData] Starting to seed dummy data...');

  const now = new Date().toISOString();
  const {
    session,
    branch,
    agents,
    routes,
    schemes,
    customers,
    accounts,
    delegations,
    ledgerEntries,
  } = seedDataset;

  // Set up logged-in session
  dispatch(
    updateSession({
      agentId: session.agentId,
      branchId: session.branchId,
      deviceFingerprint: session.deviceFingerprint,
      loggedInAt: now,
    }),
  );

  // Fixed-id entities upsert, so re-applying them is harmless
  dispatch(addBranch({ ...branch, createdAt: now }));
  agents.forEach(agent => dispatch(addAgent({ ...agent, createdAt: now })));
  routes.forEach(route => dispatch(addRoute({ ...route, createdAt: now })));
  schemes.forEach(scheme => dispatch(addScheme({ ...scheme, createdAt: now })));

  // Add only the customers that are not already present
  const existingSeedKeys = new Set(selectAllCustomers(getState()).map(seedKey));

  customers
    .filter(customer => !existingSeedKeys.has(seedKey(customer)))
    .forEach(({ ref, ...customer }) => {
      dispatch(addCustomer(customer));
    });

  // Resolve every dataset handle to the customer record now in the store, so accounts and
  // delegations can be wired to real ids.
  const customersBySeedKey = new Map(selectAllCustomers(getState()).map(c => [seedKey(c), c]));
  const customerIdByRef = new Map<SeedCustomerRef, string>();
  customers.forEach(customer => {
    const stored = customersBySeedKey.get(seedKey(customer));
    if (stored) {
      customerIdByRef.set(customer.ref, stored.id);
    }
  });

  // Create the dataset's accounts for any seeded customer that does not have one yet —
  // accounts must not be created for customers an agent added themselves.
  console.log('[SeedData] Creating accounts for customers...');
  const customerIdsWithAccounts = new Set(selectAllAccounts(getState()).map(a => a.customerId));
  let accountsCreated = 0;

  accounts.forEach(({ ref, customerRef, ...account }) => {
    const customerId = customerIdByRef.get(customerRef);
    if (!customerId || customerIdsWithAccounts.has(customerId)) {
      return;
    }

    dispatch(addAccount({ ...account, customerId }));
    customerIdsWithAccounts.add(customerId);
    accountsCreated += 1;
  });
  console.log('[SeedData] Accounts created:', accountsCreated);

  // Resolve account handles the same way customer handles resolve: re-read the store and match
  // on the key the guard above uses — the account held by the resolved customer. Handles
  // therefore point at real ids whether the account was created just now or on an earlier run.
  const storedAccounts = selectAllAccounts(getState());
  const accountIdByRef = new Map<SeedAccountRef, string>();
  accounts.forEach(({ ref, customerRef }) => {
    const customerId = customerIdByRef.get(customerRef);
    if (!customerId) {
      return;
    }

    const stored = storedAccounts.find(account => account.customerId === customerId);
    if (stored) {
      accountIdByRef.set(ref, stored.id);
    }
  });

  // Opening ledger entries, if the dataset supplies any. Their ids come from the dataset and
  // upsert, so a recovery re-seed rewrites the same rows rather than posting duplicates.
  const openingEntries = (ledgerEntries ?? []).flatMap(({ accountRef, ...entry }) => {
    const accountId = accountIdByRef.get(accountRef);
    return accountId ? [{ ...entry, accountId, createdAt: now }] : [];
  });

  if (openingEntries.length > 0) {
    dispatch(addLedgerEntries(openingEntries));
  }

  // Delegate the dataset's customers to the logged-in agent, unless an equivalent live
  // delegation already exists.
  const existingDelegations = selectAllDelegations(getState());
  const hasDelegation = (customerId: string, primaryAgentId: string, secondaryAgentId: string) =>
    existingDelegations.some(
      d =>
        d.customerId === customerId &&
        d.primaryAgentId === primaryAgentId &&
        d.secondaryAgentId === secondaryAgentId &&
        d.status !== DelegationStatus.REVOKED,
    );

  let delegationsCreated = 0;

  delegations.forEach(({ customerRef, durationDays, ...delegation }) => {
    const customerId = customerIdByRef.get(customerRef);
    if (
      !customerId ||
      hasDelegation(customerId, delegation.primaryAgentId, delegation.secondaryAgentId)
    ) {
      return;
    }

    dispatch(
      createDelegation({
        ...delegation,
        customerId,
        startAt: now,
        endAt: new Date(new Date(now).getTime() + durationDays * DAY_IN_MS).toISOString(),
      }),
    );
    delegationsCreated += 1;
  });

  // Persist seeded domain state — a Redux-only seed previously left AsyncStorage empty, so
  // subsequent launches hydrated empty stores when the seed guard skipped re-seed.
  console.log('[SeedData] Persisting seeded domain data...');
  const persistOperations: Promise<unknown>[] = [
    dispatch(persistSettings()).unwrap(),
    dispatch(persistCustomers()).unwrap(),
    dispatch(persistAccounts()).unwrap(),
    dispatch(persistDelegations()).unwrap(),
  ];

  // Only when the dataset opened balances — a dataset without them must not touch the ledger.
  if (openingEntries.length > 0) {
    persistOperations.push(dispatch(persistLedger()).unwrap());
  }

  await Promise.all(persistOperations);

  console.log('[SeedData] Dummy data seeded and persisted successfully');
  console.log('[SeedData] Branch:', `${branch.name} (${branch.code})`);
  console.log('[SeedData] Session agent:', session.agentId);
  console.log('[SeedData] Routes:', routes.map(route => route.routeCode).join(', '));
  console.log(
    '[SeedData] Dataset customers resolved:',
    `${customerIdByRef.size}/${customers.length}`,
  );
  console.log('[SeedData] Accounts created this run:', accountsCreated);
  console.log('[SeedData] Delegations created this run:', delegationsCreated);
  console.log('[SeedData] Opening ledger entries applied:', openingEntries.length);
}

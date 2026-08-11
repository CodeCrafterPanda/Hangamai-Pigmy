import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { State } from '@/utils/store';
import { AccountStatus, CollectionMode, CollectionStatus } from '@/types/entities';
import { STORAGE_KEYS } from '@/utils/storage';
import collections, {
  commitCollection,
  hydrateCollections,
  selectAllCollections,
  selectCollectionByIdempotencyKey,
  type CommitCollectionResult,
  type CreateCollectionPayload,
} from './collections.slice';
import ledger, {
  hydrateLedger,
  selectAccountBalance,
  selectLedgerEntriesByAccount,
} from './ledger.slice';
import accounts, { addAccount, hydrateAccounts, selectAccountById } from './accounts.slice';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The slices only use react-redux for their view hooks, which this suite does not exercise.
// Stubbing it keeps the untransformed ESM build of react-redux out of the module graph.
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const AMOUNT = 500;
const PENALTY = 20;
const COLLECTED_AT = '2026-08-11T09:30:00.000Z';

function createTestStore() {
  return configureStore({ reducer: { collections, ledger, accounts } });
}

type TestStore = ReturnType<typeof createTestStore>;

/** The test store holds only the three slices this thunk spans, hence the cast */
function thunks(store: TestStore) {
  return store.dispatch as unknown as ThunkDispatch<State, unknown, UnknownAction>;
}

function stateOf(store: TestStore) {
  return store.getState() as unknown as State;
}

function seedAccount(store: TestStore) {
  store.dispatch(
    addAccount({
      customerId: 'customer-1',
      schemeId: 'scheme-1',
      installmentAmount: AMOUNT,
      status: AccountStatus.ACTIVE,
    }),
  );

  return stateOf(store).accounts.accounts.allIds[0];
}

function buildPayload(accountId: string): CreateCollectionPayload {
  return {
    branchId: 'branch-1',
    customerId: 'customer-1',
    accountId,
    primaryAgentId: 'agent-1',
    collectedByAgentId: 'agent-1',
    amount: AMOUNT,
    penaltyAmount: PENALTY,
    mode: CollectionMode.CASH,
    collectedAt: COLLECTED_AT,
    timezone: 'Asia/Kolkata',
    deviceFingerprint: 'device-1',
  };
}

describe('commitCollection', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('creates one collection, its ledger entries and the balance cache in a single write', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store);

    const result = await thunks(store)(commitCollection(buildPayload(accountId)));

    expect(commitCollection.fulfilled.match(result)).toBe(true);
    expect((result.payload as CommitCollectionResult).alreadyExists).toBe(false);

    const state = stateOf(store);
    const allCollections = selectAllCollections(state);
    expect(allCollections).toHaveLength(1);
    expect(allCollections[0].mode).toBe(CollectionMode.CASH);
    expect(allCollections[0].status).toBe(CollectionStatus.CREATED);

    const entries = selectLedgerEntriesByAccount(state, accountId);
    expect(entries.map(entry => entry.entryType).sort()).toEqual(['CREDIT', 'PENALTY']);
    expect(entries.every(entry => entry.collectionId === allCollections[0].id)).toBe(true);

    // Ledger-derived balance is authoritative, the account field only caches it
    expect(selectAccountBalance(state, accountId)).toBe(AMOUNT + PENALTY);
    expect(selectAccountById(state, accountId)?.currentBalance).toBe(AMOUNT + PENALTY);

    expect(AsyncStorage.multiSet).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    const writtenKeys = (AsyncStorage.multiSet as jest.Mock).mock.calls[0][0].map(
      ([key]: [string, string]) => key,
    );
    expect(writtenKeys).toEqual([
      STORAGE_KEYS.COLLECTIONS,
      STORAGE_KEYS.RECEIPT_SERIES,
      STORAGE_KEYS.LEDGER_ENTRIES,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.SCHEMES,
    ]);
  });

  test('a second commit dispatched before the first resolves does not create a second record', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store);
    const payload = buildPayload(accountId);

    // No await between the dispatches: this is the double tap window
    const firstAttempt = thunks(store)(commitCollection(payload));
    const secondAttempt = thunks(store)(commitCollection(payload));
    const [first, second] = await Promise.all([firstAttempt, secondAttempt]);

    expect((first.payload as CommitCollectionResult).alreadyExists).toBe(false);
    expect((second.payload as CommitCollectionResult).alreadyExists).toBe(true);
    expect((first.payload as CommitCollectionResult).collection.id).toBe(
      (second.payload as CommitCollectionResult).collection.id,
    );

    const state = stateOf(store);
    expect(selectAllCollections(state)).toHaveLength(1);
    expect(selectLedgerEntriesByAccount(state, accountId)).toHaveLength(2);
    expect(selectAccountBalance(state, accountId)).toBe(AMOUNT + PENALTY);
  });

  test('replaying the same idempotency key resolves to the existing collection', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store);
    const payload = buildPayload(accountId);

    await thunks(store)(commitCollection(payload));
    const replay = await thunks(store)(commitCollection(payload));

    expect((replay.payload as CommitCollectionResult).alreadyExists).toBe(true);
    expect(selectAllCollections(stateOf(store))).toHaveLength(1);
    expect(selectAccountBalance(stateOf(store), accountId)).toBe(AMOUNT + PENALTY);
    // The replay resolves from state alone, it must not write again
    expect(AsyncStorage.multiSet).toHaveBeenCalledTimes(1);
  });

  test('a failed write reports failure, and a retry persists without creating a second record', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.multiSet as jest.Mock).mockRejectedValueOnce(new Error('storage unavailable'));

    const store = createTestStore();
    const accountId = seedAccount(store);
    const payload = buildPayload(accountId);

    const failed = await thunks(store)(commitCollection(payload));

    expect(commitCollection.rejected.match(failed)).toBe(true);
    const failedState = stateOf(store);
    expect(selectAllCollections(failedState)).toHaveLength(1);
    expect(selectAllCollections(failedState)[0].status).toBe(CollectionStatus.FAILED);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS)).toBeNull();

    const retried = await thunks(store)(commitCollection(payload));

    expect(commitCollection.fulfilled.match(retried)).toBe(true);
    const retriedState = stateOf(store);
    expect(selectAllCollections(retriedState)).toHaveLength(1);
    expect(selectAllCollections(retriedState)[0].status).toBe(CollectionStatus.CREATED);
    expect(selectLedgerEntriesByAccount(retriedState, accountId)).toHaveLength(2);
    expect(selectAccountBalance(retriedState, accountId)).toBe(AMOUNT + PENALTY);
    expect(AsyncStorage.multiSet).toHaveBeenCalledTimes(2);

    consoleError.mockRestore();
  });

  test('collection, ledger and balance survive a restart and stay in agreement', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store);
    const payload = buildPayload(accountId);

    await thunks(store)(commitCollection(payload));

    const restarted = createTestStore();
    await thunks(restarted)(hydrateCollections());
    await thunks(restarted)(hydrateLedger());
    await thunks(restarted)(hydrateAccounts());

    const state = stateOf(restarted);
    expect(selectAllCollections(state)).toHaveLength(1);
    expect(selectAllCollections(state)[0].mode).toBe(CollectionMode.CASH);
    expect(selectAccountBalance(state, accountId)).toBe(AMOUNT + PENALTY);
    expect(selectAccountById(state, accountId)?.currentBalance).toBe(AMOUNT + PENALTY);

    // The same key is still recognised after a restart, so a replay cannot duplicate
    const idempotencyKey = selectAllCollections(state)[0].idempotencyKey;
    expect(selectCollectionByIdempotencyKey(state, idempotencyKey)).toBeDefined();
  });
});

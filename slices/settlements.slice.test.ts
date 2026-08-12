import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { State } from '@/utils/store';
import { AccountStatus, CollectionMode, SettlementScope } from '@/types/entities';
import collections, { commitCollection, type CreateCollectionPayload } from './collections.slice';
import ledger from './ledger.slice';
import accounts, { addAccount } from './accounts.slice';
import settlements, {
  createSettlement,
  submitSettlement,
  hydrateSettlements,
  persistSettlements,
  selectCashInHand,
  selectEligibleCashCollected,
  selectSettlementByAgentAndDate,
} from './settlements.slice';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The slices only use react-redux for their view hooks, which this suite does not exercise.
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const AGENT = 'agent-1';
const BRANCH = 'branch-1';
const TIMEZONE = 'Asia/Kolkata';
/** 09:30 UTC is 15:00 in Asia/Kolkata, so the business date is unambiguous. */
const BUSINESS_DATE = '2026-08-11';
const AT = (minute: number) => `2026-08-11T09:${String(minute).padStart(2, '0')}:00.000Z`;

function createTestStore() {
  return configureStore({ reducer: { collections, ledger, accounts, settlements } });
}

type TestStore = ReturnType<typeof createTestStore>;

/** The test store holds only the slices these flows span, hence the casts */
function thunks(store: TestStore) {
  return store.dispatch as unknown as ThunkDispatch<State, unknown, UnknownAction>;
}

function stateOf(store: TestStore) {
  return store.getState() as unknown as State;
}

function seedAccount(store: TestStore, customerId: string) {
  store.dispatch(
    addAccount({
      customerId,
      schemeId: 'scheme-1',
      installmentAmount: 500,
      status: AccountStatus.ACTIVE,
    }),
  );

  const ids = stateOf(store).accounts.accounts.allIds;
  return ids[ids.length - 1];
}

function buildPayload(
  accountId: string,
  overrides: Partial<CreateCollectionPayload> = {},
): CreateCollectionPayload {
  return {
    branchId: BRANCH,
    customerId: 'customer-1',
    accountId,
    primaryAgentId: AGENT,
    collectedByAgentId: AGENT,
    amount: 500,
    penaltyAmount: 0,
    mode: CollectionMode.CASH,
    collectedAt: AT(30),
    timezone: TIMEZONE,
    deviceFingerprint: 'device-1',
    ...overrides,
  };
}

/** Closes a scope's day using the same figures the dashboard derives. */
function closeDay(store: TestStore, scope: SettlementScope, declaredCash?: number) {
  const cashTotal = selectEligibleCashCollected(stateOf(store), AGENT, BUSINESS_DATE, scope);

  store.dispatch(
    createSettlement({
      agentId: AGENT,
      branchId: BRANCH,
      businessDate: BUSINESS_DATE,
      scope,
      cashTotal,
      upiTotal: 0,
      totalCollection: cashTotal,
      cashInHand: declaredCash ?? cashTotal,
      notes: declaredCash !== undefined && declaredCash !== cashTotal ? 'short by count' : undefined,
    }),
  );

  const settlement = selectSettlementByAgentAndDate(stateOf(store), AGENT, BUSINESS_DATE, scope);
  return settlement!.id;
}

describe('cash in hand', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('counts collected CASH only — UPI never moves the cash balance', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store, 'customer-1');

    await thunks(store)(commitCollection(buildPayload(accountId, { amount: 500 })));
    await thunks(store)(
      commitCollection(
        buildPayload(accountId, {
          amount: 700,
          mode: CollectionMode.UPI,
          collectedAt: AT(35),
        }),
      ),
    );

    expect(selectCashInHand(stateOf(store), AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(
      500,
    );
  });

  test('PRIMARY and DELEGATED books stay separate', async () => {
    const store = createTestStore();
    const ownAccount = seedAccount(store, 'customer-1');
    const delegatedAccount = seedAccount(store, 'customer-2');

    await thunks(store)(commitCollection(buildPayload(ownAccount, { amount: 500 })));
    await thunks(store)(
      commitCollection(
        buildPayload(delegatedAccount, {
          customerId: 'customer-2',
          primaryAgentId: 'agent-2',
          delegationId: 'delegation-1',
          amount: 300,
          collectedAt: AT(40),
        }),
      ),
    );

    const state = stateOf(store);
    expect(selectCashInHand(state, AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(500);
    expect(selectCashInHand(state, AGENT, BUSINESS_DATE, SettlementScope.DELEGATED)).toBe(300);
  });

  test('a DRAFT settlement does not reduce it; submitting does', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store, 'customer-1');

    await thunks(store)(commitCollection(buildPayload(accountId, { amount: 500 })));

    const settlementId = closeDay(store, SettlementScope.PRIMARY);
    expect(selectCashInHand(stateOf(store), AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(
      500,
    );

    store.dispatch(submitSettlement(settlementId));
    expect(selectCashInHand(stateOf(store), AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(0);
  });

  test('closing PRIMARY leaves the DELEGATED balance untouched', async () => {
    const store = createTestStore();
    const ownAccount = seedAccount(store, 'customer-1');
    const delegatedAccount = seedAccount(store, 'customer-2');

    await thunks(store)(commitCollection(buildPayload(ownAccount, { amount: 500 })));
    await thunks(store)(
      commitCollection(
        buildPayload(delegatedAccount, {
          customerId: 'customer-2',
          primaryAgentId: 'agent-2',
          delegationId: 'delegation-1',
          amount: 300,
          collectedAt: AT(40),
        }),
      ),
    );

    store.dispatch(submitSettlement(closeDay(store, SettlementScope.PRIMARY)));

    const state = stateOf(store);
    expect(selectCashInHand(state, AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(0);
    expect(selectCashInHand(state, AGENT, BUSINESS_DATE, SettlementScope.DELEGATED)).toBe(300);
  });

  test('a collection taken after the day was closed raises it again', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store, 'customer-1');

    await thunks(store)(commitCollection(buildPayload(accountId, { amount: 500 })));
    store.dispatch(submitSettlement(closeDay(store, SettlementScope.PRIMARY)));

    await thunks(store)(
      commitCollection(buildPayload(accountId, { amount: 200, collectedAt: AT(50) })),
    );

    expect(selectCashInHand(stateOf(store), AGENT, BUSINESS_DATE, SettlementScope.PRIMARY)).toBe(
      200,
    );
  });

  test('stays reduced after a restart, and the declared variance is preserved', async () => {
    const store = createTestStore();
    const accountId = seedAccount(store, 'customer-1');

    await thunks(store)(commitCollection(buildPayload(accountId, { amount: 500 })));
    store.dispatch(submitSettlement(closeDay(store, SettlementScope.PRIMARY, 450)));
    await thunks(store)(persistSettlements());

    const restarted = createTestStore();
    await thunks(restarted)(hydrateSettlements());
    // Replaying the collection reproduces the same record: the idempotency key is derived
    // from device + account + timestamp, so this is the restart the agent would see.
    await thunks(restarted)(commitCollection(buildPayload(accountId, { amount: 500 })));

    const settlement = selectSettlementByAgentAndDate(
      stateOf(restarted),
      AGENT,
      BUSINESS_DATE,
      SettlementScope.PRIMARY,
    );

    expect(settlement?.status).toBe('SUBMITTED');
    expect(settlement?.variance).toBe(-50);
    expect(
      selectCashInHand(stateOf(restarted), AGENT, BUSINESS_DATE, SettlementScope.PRIMARY),
    ).toBe(0);
  });
});

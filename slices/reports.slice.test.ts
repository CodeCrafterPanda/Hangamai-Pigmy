import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { State } from '@/utils/store';
import {
  AccountStatus,
  CollectionMode,
  CustomerStatus,
  SchemeFrequency,
  SettlementScope,
} from '@/types/entities';
import collections, { commitCollection, type CreateCollectionPayload } from './collections.slice';
import ledger from './ledger.slice';
import accounts, { addAccount, addScheme } from './accounts.slice';
import customers, { addCustomer, selectAllCustomers } from './customers.slice';
import settings from './settings.slice';
import settlements from './settlements.slice';
import { selectMonthlyCollectionReport } from './reports.slice';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The slices only use react-redux for their view hooks, which this suite does not exercise.
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const AGENT = 'agent-1';
const OTHER_AGENT = 'agent-2';
const BRANCH = 'branch-1';
const TIMEZONE = 'Asia/Kolkata';
const SCHEME_ID = 'scheme-daily';
const YEAR = 2026;
const MONTH = 8;
const CURRENT_BUSINESS_DATE = '2026-08-05';
const ACCOUNT_OPENED_AT = '2026-08-01T04:00:00.000Z';

/** 06:00 UTC is 11:30 in Asia/Kolkata, so the business date is the same calendar day. */
const onDay = (day: number) => `2026-08-${String(day).padStart(2, '0')}T06:00:00.000Z`;

function createTestStore() {
  return configureStore({
    reducer: { collections, ledger, accounts, customers, settings, settlements },
  });
}

type TestStore = ReturnType<typeof createTestStore>;

/** The test store holds only the slices the report spans, hence the casts */
function thunks(store: TestStore) {
  return store.dispatch as unknown as ThunkDispatch<State, unknown, UnknownAction>;
}

function stateOf(store: TestStore) {
  return store.getState() as unknown as State;
}

function addCustomerWithAccount(store: TestStore, fullName: string, primaryAgentId: string) {
  store.dispatch(
    addCustomer({
      branchId: BRANCH,
      routeId: 'route-1',
      primaryAgentId,
      fullName,
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      state: '',
      status: CustomerStatus.ACTIVE,
    }),
  );

  const customer = selectAllCustomers(stateOf(store)).find(c => c.fullName === fullName)!;

  // The account's opened date decides which days count as missed, so it is pinned rather
  // than left at whenever the suite happens to run.
  jest.useFakeTimers().setSystemTime(new Date(ACCOUNT_OPENED_AT));
  store.dispatch(
    addAccount({
      customerId: customer.id,
      schemeId: SCHEME_ID,
      installmentAmount: 500,
      status: AccountStatus.ACTIVE,
    }),
  );
  jest.useRealTimers();

  const accountIds = stateOf(store).accounts.accounts.allIds;
  return { customer, accountId: accountIds[accountIds.length - 1] };
}

function buildPayload(
  customerId: string,
  accountId: string,
  overrides: Partial<CreateCollectionPayload> = {},
): CreateCollectionPayload {
  return {
    branchId: BRANCH,
    customerId,
    accountId,
    primaryAgentId: AGENT,
    collectedByAgentId: AGENT,
    amount: 500,
    penaltyAmount: 0,
    mode: CollectionMode.CASH,
    collectedAt: onDay(1),
    timezone: TIMEZONE,
    deviceFingerprint: 'device-1',
    ...overrides,
  };
}

function reportFor(store: TestStore, scope: SettlementScope) {
  return selectMonthlyCollectionReport(
    stateOf(store),
    YEAR,
    MONTH,
    CURRENT_BUSINESS_DATE,
    AGENT,
    scope,
  );
}

async function setupMonth(store: TestStore) {
  store.dispatch(
    addScheme({
      id: SCHEME_ID,
      branchId: BRANCH,
      name: 'Pigmy Daily',
      frequency: SchemeFrequency.DAILY,
      minAmount: 100,
      penaltyPerDay: 0,
      penaltyType: 'NONE',
      createdAt: ACCOUNT_OPENED_AT,
    }),
  );

  const own = addCustomerWithAccount(store, 'Own Customer', AGENT);

  // Aug 1 cash, Aug 2 UPI, Aug 4 cash — Aug 3 is a real missed day
  await thunks(store)(
    commitCollection(buildPayload(own.customer.id, own.accountId, { amount: 500 })),
  );
  await thunks(store)(
    commitCollection(
      buildPayload(own.customer.id, own.accountId, {
        amount: 300,
        mode: CollectionMode.UPI,
        collectedAt: onDay(2),
      }),
    ),
  );
  await thunks(store)(
    commitCollection(
      buildPayload(own.customer.id, own.accountId, { amount: 200, collectedAt: onDay(4) }),
    ),
  );

  return own;
}

describe('selectMonthlyCollectionReport', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reconciles the collections that were actually committed', async () => {
    const store = createTestStore();
    await setupMonth(store);

    const report = reportFor(store, SettlementScope.PRIMARY);

    expect(report.grandTotal).toBe(1000);
    expect(report.dailyTotals[1]).toBe(500);
    expect(report.dailyTotals[2]).toBe(300);
    expect(report.dailyTotals[3]).toBe(0);
    expect(report.dailyTotals[4]).toBe(200);
    expect(report.auditErrors).toEqual([]);
    expect(report.isAuditSuccessful).toBe(true);
  });

  test('splits Cash and UPI without pooling them', async () => {
    const store = createTestStore();
    await setupMonth(store);

    const report = reportFor(store, SettlementScope.PRIMARY);

    expect(report.totalCashCollected).toBe(700);
    expect(report.totalUpiCollected).toBe(300);
    expect(report.totalCashCollected + report.totalUpiCollected).toBe(report.grandTotal);
  });

  test('counts the one day with no collection as missed, and never counts today', async () => {
    const store = createTestStore();
    await setupMonth(store);

    // Aug 1, 2 and 4 are collected; Aug 3 is missed; Aug 5 is today and is not counted
    expect(reportFor(store, SettlementScope.PRIMARY).totalMissedDays).toBe(1);
  });

  test('every collection has exactly one ledger credit and the balances agree', async () => {
    const store = createTestStore();
    await setupMonth(store);

    const report = reportFor(store, SettlementScope.PRIMARY);
    const row = report.rows[0];

    expect(report.rows).toHaveLength(1);
    expect(row.collectionCount).toBe(3);
    expect(row.ledgerBalance).toBe(1000);
    expect(row.cachedBalance).toBe(row.ledgerBalance);
  });

  test('a delegated collection stays out of the PRIMARY book', async () => {
    const store = createTestStore();
    await setupMonth(store);

    const delegated = addCustomerWithAccount(store, 'Delegated Customer', OTHER_AGENT);
    await thunks(store)(
      commitCollection(
        buildPayload(delegated.customer.id, delegated.accountId, {
          primaryAgentId: OTHER_AGENT,
          delegationId: 'delegation-1',
          amount: 400,
          collectedAt: onDay(4),
        }),
      ),
    );

    const primary = reportFor(store, SettlementScope.PRIMARY);
    const delegatedReport = reportFor(store, SettlementScope.DELEGATED);

    expect(primary.grandTotal).toBe(1000);
    expect(primary.rows.map(r => r.customerName)).toEqual(['Own Customer']);

    expect(delegatedReport.grandTotal).toBe(400);
    expect(delegatedReport.rows.map(r => r.customerName)).toEqual(['Delegated Customer']);
    expect(delegatedReport.isAuditSuccessful).toBe(true);
  });
});

import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, State } from '@/utils/store';
import { AccountStatus, CustomerStatus } from '@/types/entities';
import customers, { addCustomer, selectAllCustomers, updateCustomer } from '@/slices/customers.slice';
import accounts, { addAccount, selectAllAccounts } from '@/slices/accounts.slice';
import settings, { selectAllRoutes, selectSession } from '@/slices/settings.slice';
import delegations, { selectAllDelegations } from '@/slices/delegations.slice';
import {
  DEMO_AGENT_ID,
  DEMO_BRANCH_ID,
  DEMO_ROUTE_SUPA,
  DEMO_SCHEME_DAILY_ID,
} from '@/data/seed';
import { seedDummyData } from './seedData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// The slices only use react-redux for their view hooks, which this suite does not exercise.
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

function createTestStore() {
  return configureStore({ reducer: { customers, accounts, settings, delegations } });
}

type TestStore = ReturnType<typeof createTestStore>;

/** The seed spans only these four slices, hence the casts */
function stateOf(store: TestStore) {
  return store.getState() as unknown as State;
}

function runSeed(store: TestStore) {
  return seedDummyData(store.dispatch as unknown as Dispatch, () => stateOf(store));
}

describe('seedDummyData', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('creates the demo baseline on a fresh device', async () => {
    const store = createTestStore();
    await runSeed(store);

    const state = stateOf(store);
    expect(selectAllCustomers(state)).toHaveLength(5);
    expect(selectAllAccounts(state)).toHaveLength(5);
    expect(selectAllRoutes(state)).toHaveLength(3);
    expect(selectAllDelegations(state)).toHaveLength(2);
    expect(selectSession(state).branchId).toBe(DEMO_BRANCH_ID);
  });

  test('re-running it (seed marker present, baseline lost) duplicates nothing', async () => {
    const store = createTestStore();
    await runSeed(store);
    await runSeed(store);

    const state = stateOf(store);
    expect(selectAllCustomers(state)).toHaveLength(5);
    expect(selectAllAccounts(state)).toHaveLength(5);
    expect(selectAllRoutes(state)).toHaveLength(3);
    expect(selectAllDelegations(state)).toHaveLength(2);
  });

  test('recovering the baseline leaves an agent-created customer and their account alone', async () => {
    const store = createTestStore();
    await runSeed(store);

    store.dispatch(
      addCustomer({
        branchId: DEMO_BRANCH_ID,
        routeId: DEMO_ROUTE_SUPA,
        primaryAgentId: DEMO_AGENT_ID,
        fullName: 'Field Added Customer',
        phone: '9000000001',
        addressLine1: 'Added on the round',
        addressLine2: '',
        city: 'Mumbai',
        pincode: '400010',
        state: 'Maharashtra',
        status: CustomerStatus.ACTIVE,
      }),
    );

    const addedCustomer = selectAllCustomers(stateOf(store)).find(
      c => c.fullName === 'Field Added Customer',
    )!;

    store.dispatch(
      addAccount({
        customerId: addedCustomer.id,
        schemeId: DEMO_SCHEME_DAILY_ID,
        installmentAmount: 250,
        status: AccountStatus.ACTIVE,
      }),
    );

    await runSeed(store);

    const state = stateOf(store);
    const customerList = selectAllCustomers(state);
    const accountList = selectAllAccounts(state);

    expect(customerList).toHaveLength(6);
    expect(customerList.filter(c => c.fullName === 'Field Added Customer')).toHaveLength(1);
    // 5 seeded + the one the agent created — the seed must not hand out a second account
    expect(accountList).toHaveLength(6);
    expect(accountList.filter(a => a.customerId === addedCustomer.id)).toHaveLength(1);
  });

  test('every seeded customer ends up with exactly one account', async () => {
    const store = createTestStore();
    await runSeed(store);
    await runSeed(store);

    const state = stateOf(store);
    const accountsByCustomer = new Map<string, number>();
    selectAllAccounts(state).forEach(account => {
      accountsByCustomer.set(
        account.customerId,
        (accountsByCustomer.get(account.customerId) ?? 0) + 1,
      );
    });

    selectAllCustomers(state).forEach(customer => {
      expect(accountsByCustomer.get(customer.id)).toBe(1);
    });
  });

  test('every seeded customer is assigned to a route that exists in the dataset', async () => {
    const store = createTestStore();
    await runSeed(store);

    const state = stateOf(store);
    const routeIds = new Set(selectAllRoutes(state).map(route => route.id));

    selectAllCustomers(state).forEach(customer => {
      expect(routeIds.has(customer.routeId)).toBe(true);
    });

    expect(selectAllCustomers(state).filter(c => c.routeId === DEMO_ROUTE_SUPA)).toHaveLength(3);
  });

  test('re-seed repairs a dataset customer whose route assignment no longer matches', async () => {
    const store = createTestStore();
    await runSeed(store);

    const seeded = selectAllCustomers(stateOf(store)).find(c => c.routeId === DEMO_ROUTE_SUPA)!;
    store.dispatch(updateCustomer({ id: seeded.id, updates: { routeId: 'stale-route' } }));
    expect(selectAllCustomers(stateOf(store)).find(c => c.id === seeded.id)?.routeId).toBe(
      'stale-route',
    );

    await runSeed(store);

    expect(selectAllCustomers(stateOf(store)).find(c => c.id === seeded.id)?.routeId).toBe(
      DEMO_ROUTE_SUPA,
    );
  });

  test('re-seed does not reassign an agent-created customer to a dataset route', async () => {
    const store = createTestStore();
    await runSeed(store);

    store.dispatch(
      addCustomer({
        branchId: DEMO_BRANCH_ID,
        routeId: 'field-route',
        primaryAgentId: DEMO_AGENT_ID,
        fullName: 'Field Added Customer',
        phone: '9000000001',
        addressLine1: 'Added on the round',
        addressLine2: '',
        city: 'Mumbai',
        pincode: '400010',
        state: 'Maharashtra',
        status: CustomerStatus.ACTIVE,
      }),
    );

    await runSeed(store);

    const fieldCustomer = selectAllCustomers(stateOf(store)).find(
      c => c.fullName === 'Field Added Customer',
    )!;
    expect(fieldCustomer.routeId).toBe('field-route');
  });
});

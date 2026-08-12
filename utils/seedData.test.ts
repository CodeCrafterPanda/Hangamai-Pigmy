import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, State } from '@/utils/store';
import { AccountStatus, CustomerStatus } from '@/types/entities';
import customers, { addCustomer, selectAllCustomers } from '@/slices/customers.slice';
import accounts, { addAccount, selectAllAccounts } from '@/slices/accounts.slice';
import settings, { selectAllRoutes, selectSession } from '@/slices/settings.slice';
import delegations, { selectAllDelegations } from '@/slices/delegations.slice';
import { seedDummyData, DEMO_BRANCH_ID } from './seedData';

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
        routeId: 'route-supa',
        primaryAgentId: 'agent-demo-001',
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
        schemeId: 'scheme-pigmy-daily-1yr',
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
});

/**
 * Seed dummy data for development/testing
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
import { CustomerStatus, AccountStatus, SchemeFrequency, DelegationStatus } from '@/types';

// Dummy agent ID
export const DEMO_AGENT_ID = 'agent-demo-001';
export const DEMO_BRANCH_ID = 'branch-hangamai';
export const DEMO_ROUTE_SUPA = 'route-supa';
export const DEMO_ROUTE_PARNER = 'route-parner';
export const DEMO_ROUTE_HANGA = 'route-hanga';

/**
 * Seed dummy customers and accounts
 */
export async function seedDummyData(dispatch: Dispatch, getState: () => State) {
  console.log('[SeedData] Starting to seed dummy data...');

  // Set up logged-in session
  dispatch(
    updateSession({
      agentId: DEMO_AGENT_ID,
      branchId: DEMO_BRANCH_ID,
      deviceFingerprint: 'demo-device',
      loggedInAt: new Date().toISOString(),
    }),
  );

  const now = new Date().toISOString();

  // Create the main branch
  dispatch(
    addBranch({
      id: DEMO_BRANCH_ID,
      code: 'HANGA',
      name: 'Hangamai Main Branch',
      address: 'Hanga, Maharashtra',
      timezone: 'Asia/Kolkata',
      createdAt: now,
    }),
  );

  // Create demo agents
  dispatch(
    addAgent({
      id: DEMO_AGENT_ID,
      branchId: DEMO_BRANCH_ID,
      name: 'Demo Agent',
      agentCode: 'AGT-001',
      phone: '9876543200',
      createdAt: now,
    }),
  );

  dispatch(
    addAgent({
      id: 'agent-other-001',
      branchId: DEMO_BRANCH_ID,
      name: 'Agent Two',
      agentCode: 'AGT-002',
      phone: '9876543201',
      createdAt: now,
    }),
  );

  dispatch(
    addAgent({
      id: 'agent-other-002',
      branchId: DEMO_BRANCH_ID,
      name: 'Agent Three',
      agentCode: 'AGT-003',
      phone: '9876543202',
      createdAt: now,
    }),
  );

  // Create three routes
  dispatch(
    addRoute({
      id: DEMO_ROUTE_SUPA,
      branchId: DEMO_BRANCH_ID,
      routeCode: 'SUPA',
      name: 'SUPA ROUTE',
      createdAt: now,
    }),
  );

  dispatch(
    addRoute({
      id: DEMO_ROUTE_PARNER,
      branchId: DEMO_BRANCH_ID,
      routeCode: 'PARNER',
      name: 'PARNER ROUTE',
      createdAt: now,
    }),
  );

  dispatch(
    addRoute({
      id: DEMO_ROUTE_HANGA,
      branchId: DEMO_BRANCH_ID,
      routeCode: 'HANGA',
      name: 'HANGA ROUTE',
      createdAt: now,
    }),
  );

  // Create dummy customers distributed across the three routes
  const customers = [
    // SUPA ROUTE customers
    {
      branchId: DEMO_BRANCH_ID,
      routeId: DEMO_ROUTE_SUPA,
      primaryAgentId: DEMO_AGENT_ID,
      fullName: 'Suresh Patil',
      phone: '9876543210',
      addressLine1: 'Shop #4, Market Street',
      addressLine2: 'Gandhi Nagar',
      city: 'Mumbai',
      pincode: '400001',
      state: 'Maharashtra',
      status: CustomerStatus.ACTIVE,
    },
    {
      branchId: DEMO_BRANCH_ID,
      routeId: DEMO_ROUTE_SUPA,
      primaryAgentId: DEMO_AGENT_ID,
      fullName: 'Anita Desai',
      phone: '9876543211',
      addressLine1: 'Market Lane, Shop 12',
      addressLine2: 'Near City Center',
      city: 'Mumbai',
      pincode: '400002',
      state: 'Maharashtra',
      status: CustomerStatus.ACTIVE,
    },
    // PARNER ROUTE customers
    {
      branchId: DEMO_BRANCH_ID,
      routeId: DEMO_ROUTE_SUPA,
      primaryAgentId: DEMO_AGENT_ID,
      fullName: 'Rajesh Kumar',
      phone: '9876543212',
      addressLine1: 'Home, Sector 15',
      addressLine2: 'Residential Area',
      city: 'Mumbai',
      pincode: '400003',
      state: 'Maharashtra',
      status: CustomerStatus.ACTIVE,
    },
    // HANGA ROUTE customers (delegated)
    {
      branchId: DEMO_BRANCH_ID,
      routeId: DEMO_ROUTE_HANGA,
      primaryAgentId: 'agent-other-001', // Will be delegated to logged-in agent
      fullName: 'Ramesh General Stores',
      phone: '9876543213',
      addressLine1: 'Shop #45, Main Road',
      addressLine2: 'Industrial Area',
      city: 'Mumbai',
      pincode: '400004',
      state: 'Maharashtra',
      status: CustomerStatus.ACTIVE,
    },
    {
      branchId: DEMO_BRANCH_ID,
      routeId: DEMO_ROUTE_HANGA,
      primaryAgentId: 'agent-other-002', // Will be delegated to logged-in agent
      fullName: 'Priya Textiles',
      phone: '9876543214',
      addressLine1: 'Shop 78, Textile Market',
      addressLine2: 'Commercial Zone',
      city: 'Mumbai',
      pincode: '400005',
      state: 'Maharashtra',
      status: CustomerStatus.ACTIVE,
    },
  ];

  // This function also serves as the recovery path when the seed marker survived but the
  // domain baseline did not hydrate, so every step below has to be safe to run against a
  // store that already holds records. Branch/agent/route/scheme use fixed ids and upsert;
  // customers, accounts and delegations get generated ids, so they are matched against
  // what is already present instead of being added again.
  const seedKey = (customer: { fullName: string; phone?: string }) =>
    `${customer.fullName}|${customer.phone ?? ''}`;

  const existingSeedKeys = new Set(selectAllCustomers(getState()).map(seedKey));

  customers
    .filter(customer => !existingSeedKeys.has(seedKey(customer)))
    .forEach(customer => {
      dispatch(addCustomer(customer));
    });

  // Resolve the seeded customers only — accounts must not be created for customers an
  // agent added themselves.
  const customersBySeedKey = new Map(selectAllCustomers(getState()).map(c => [seedKey(c), c]));
  const seededCustomers = customers
    .map(c => customersBySeedKey.get(seedKey(c)))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Seed the demo scheme referenced by seeded accounts (MVP: NONE penalty)
  const demoSchemeId = 'scheme-pigmy-daily-1yr';
  dispatch(
    addScheme({
      id: demoSchemeId,
      branchId: DEMO_BRANCH_ID,
      name: 'Pigmy Daily 1 Year',
      frequency: SchemeFrequency.DAILY,
      minAmount: 100,
      penaltyPerDay: 0,
      penaltyType: 'NONE',
      createdAt: now,
    }),
  );

  // Create one account per seeded customer that does not have one yet
  console.log('[SeedData] Creating accounts for customers...');
  const customerIdsWithAccounts = new Set(selectAllAccounts(getState()).map(a => a.customerId));
  let accountsCreated = 0;

  seededCustomers.forEach((customer, index) => {
    if (customerIdsWithAccounts.has(customer.id)) {
      return;
    }

    dispatch(
      addAccount({
        customerId: customer.id,
        schemeId: demoSchemeId,
        installmentAmount: 500 - index * 50, // Varying amounts
        status: AccountStatus.ACTIVE,
      }),
    );
    accountsCreated += 1;
  });
  console.log('[SeedData] Accounts created:', accountsCreated);

  // Find delegated customers by name
  const rameshCustomer = seededCustomers.find(c => c.fullName === 'Ramesh General Stores');
  const priyaCustomer = seededCustomers.find(c => c.fullName === 'Priya Textiles');

  // Create delegations for customers 4 and 5 (delegated TO the logged-in agent)
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingDelegations = selectAllDelegations(getState());
  const hasDelegation = (customerId: string, primaryAgentId: string) =>
    existingDelegations.some(
      d =>
        d.customerId === customerId &&
        d.primaryAgentId === primaryAgentId &&
        d.secondaryAgentId === DEMO_AGENT_ID &&
        d.status !== DelegationStatus.REVOKED,
    );

  if (rameshCustomer && !hasDelegation(rameshCustomer.id, 'agent-other-001')) {
    // Delegation 1: Ramesh General Stores (from agent-other-001 to logged-in agent)
    dispatch(
      createDelegation({
        customerId: rameshCustomer.id,
        accountId: undefined, // All accounts
        primaryAgentId: 'agent-other-001',
        secondaryAgentId: DEMO_AGENT_ID, // Delegated TO the logged-in agent
        startAt: today.toISOString(),
        endAt: in30Days.toISOString(),
        createdBy: 'agent-other-001',
      }),
    );
  }

  if (priyaCustomer && !hasDelegation(priyaCustomer.id, 'agent-other-002')) {
    // Delegation 2: Priya Textiles (from agent-other-002 to logged-in agent)
    dispatch(
      createDelegation({
        customerId: priyaCustomer.id,
        accountId: undefined, // All accounts
        primaryAgentId: 'agent-other-002',
        secondaryAgentId: DEMO_AGENT_ID, // Delegated TO the logged-in agent
        startAt: today.toISOString(),
        endAt: in30Days.toISOString(),
        createdBy: 'agent-other-002',
      }),
    );
  }

  // Persist seeded domain state — Redux-only seed previously left AsyncStorage empty,
  // so subsequent launches hydrated empty stores when the seed guard skipped re-seed.
  console.log('[SeedData] Persisting seeded domain data...');
  await Promise.all([
    dispatch(persistSettings()).unwrap(),
    dispatch(persistCustomers()).unwrap(),
    dispatch(persistAccounts()).unwrap(),
    dispatch(persistDelegations()).unwrap(),
  ]);

  console.log('[SeedData] Dummy data seeded and persisted successfully');
  console.log('[SeedData] Branch: Hangamai Main Branch (Hanga)');
  console.log('[SeedData] Agent ID:', DEMO_AGENT_ID);
  console.log('[SeedData] Routes: SUPA, PARNER, HANGA (3 routes)');
  console.log('[SeedData] Primary customers: 3 (SUPA: 2, PARNER: 1)');
  console.log('[SeedData] Delegated customers: 2 (HANGA: 2)');
  console.log('[SeedData] Total seeded customers:', seededCustomers.length);
  console.log('[SeedData] Accounts created this run:', accountsCreated);
}

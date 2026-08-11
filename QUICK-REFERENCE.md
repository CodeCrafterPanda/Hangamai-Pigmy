# Quick Reference Guide

## Installation

```bash
npm install date-fns date-fns-tz
```

## App Initialization

```typescript
// In your root _layout.tsx or App.tsx
import { useEffect } from 'react';
import { initializeStorage } from '@/utils/storage';
import {
  useSettingsSlice,
  useCustomersSlice,
  useAccountsSlice,
  useDelegationsSlice,
  useCollectionsSlice,
  useLedgerSlice,
  useSettlementsSlice,
  useSyncQueueSlice,
  useAuditSlice,
} from '@/slices';

export default function App() {
  const { setLoggedIn } = useAppSlice();
  
  // Call hooks at component level
  const settingsSlice = useSettingsSlice();
  const customersSlice = useCustomersSlice();
  const accountsSlice = useAccountsSlice();
  const delegationsSlice = useDelegationsSlice();
  const collectionsSlice = useCollectionsSlice();
  const ledgerSlice = useLedgerSlice();
  const settlementsSlice = useSettlementsSlice();
  const syncQueueSlice = useSyncQueueSlice();
  const auditSlice = useAuditSlice();
  
  useEffect(() => {
    async function init() {
      await initializeStorage();
      
      // Hydrate all slices
      await Promise.all([
        settingsSlice.hydrateSettings(),
        customersSlice.hydrateCustomers(),
        accountsSlice.hydrateAccounts(),
        delegationsSlice.hydrateDelegations(),
        collectionsSlice.hydrateCollections(),
        ledgerSlice.hydrateLedger(),
        settlementsSlice.hydrateSettlements(),
        syncQueueSlice.hydrateSyncQueue(),
        auditSlice.hydrateAuditLogs(),
      ]);
      
      // Check session
      if (settingsSlice.session.agentId) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    }
    
    init();
  }, []);
  
  return <YourApp />;
}
```

## Common Operations

### 1. Login

```typescript
const { updateSession, persistSettings } = useSettingsSlice();
const { logEvent, persistAuditLogs } = useAuditSlice();

// Login
updateSession({
  agentId: 'agent-123',
  branchId: 'branch-456',
  deviceFingerprint: 'device-xyz',
  loggedInAt: new Date().toISOString(),
});

logEvent({
  actorAgentId: 'agent-123',
  action: 'AGENT_LOGIN',
  entityType: 'SESSION',
  entityId: 'agent-123',
});

await Promise.all([persistSettings(), persistAuditLogs()]);
setLoggedIn(true);
```

### 2. Create Customer

```typescript
const { addCustomer, persistCustomers } = useCustomersSlice();
const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
const { logEvent, persistAuditLogs } = useAuditSlice();

addCustomer({
  branchId: session.branchId,
  fullName: 'John Doe',
  phone: '9876543210',
  addressLine1: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  routeId: 'route-123',
  primaryAgentId: 'agent-123',
  status: 'ACTIVE',
});

const customerId = 'new-customer-id'; // Get from state

logEvent({
  actorAgentId: session.agentId,
  action: 'CREATE_CUSTOMER',
  entityType: 'CUSTOMER',
  entityId: customerId,
});

enqueueAction({
  entityType: 'CUSTOMER',
  action: 'CREATE',
  payload: { customerId, fullName: 'John Doe' },
});

await Promise.all([
  persistCustomers(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### 3. Collect Deposit

```typescript
const { createCollection, persistCollections } = useCollectionsSlice();
const { addLedgerEntries, persistLedger } = useLedgerSlice();
const { updateAccountBalance, persistAccounts } = useAccountsSlice();
const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
const { logEvent, persistAuditLogs } = useAuditSlice();

import {
  createLedgerEntriesForCollection,
  calculateAccountBalance,
} from '@/utils/businessLogic';

// Create collection
createCollection({
  branchId: session.branchId,
  customerId: 'customer-123',
  accountId: 'account-456',
  primaryAgentId: 'agent-123',
  collectedByAgentId: session.agentId,
  amount: 100,
  penaltyAmount: 10,
  mode: 'CASH',
  collectedAt: new Date().toISOString(),
  timezone: branchSettings.timezone,
  deviceFingerprint: session.deviceFingerprint,
});

const collectionId = 'new-collection-id'; // Get from state

// Create ledger entries
const ledgerEntries = createLedgerEntriesForCollection(
  'account-456',
  collectionId,
  100,
  10,
  new Date().toISOString()
);

addLedgerEntries(ledgerEntries);

// Update balance
const allEntries = selectLedgerEntriesByAccount(state, 'account-456');
const newBalance = calculateAccountBalance(allEntries);
updateAccountBalance({ id: 'account-456', balance: newBalance });

// Audit & Sync
logEvent({
  actorAgentId: session.agentId,
  action: 'COLLECT_DEPOSIT',
  entityType: 'COLLECTION',
  entityId: collectionId,
});

enqueueAction({
  entityType: 'COLLECTION',
  action: 'CREATE',
  payload: { collectionId, amount: 100 },
});

await Promise.all([
  persistCollections(),
  persistLedger(),
  persistAccounts(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### 4. Create Delegation

```typescript
const { createDelegation, persistDelegations } = useDelegationsSlice();
const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
const { logEvent, persistAuditLogs } = useAuditSlice();

createDelegation({
  customerId: 'customer-123',
  accountId: 'account-456', // or null for all accounts
  primaryAgentId: 'agent-123',
  secondaryAgentId: 'agent-789',
  startAt: '2025-01-01T00:00:00Z',
  endAt: '2025-01-31T23:59:59Z',
  maxAmountPerDay: 5000,
  maxCollectionsPerDay: 10,
  createdBy: session.agentId,
});

const delegationId = 'new-delegation-id';

logEvent({
  actorAgentId: session.agentId,
  action: 'CREATE_DELEGATION',
  entityType: 'DELEGATION',
  entityId: delegationId,
});

enqueueAction({
  entityType: 'DELEGATION',
  action: 'CREATE',
  payload: { delegationId },
});

await Promise.all([
  persistDelegations(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### 5. Submit Settlement

```typescript
const { createSettlement, submitSettlement, persistSettlements } = useSettlementsSlice();
const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
const { logEvent, persistAuditLogs } = useAuditSlice();

import { calculateSettlementSummary } from '@/utils/businessLogic';

// Calculate summary
const collections = selectCollectionsByBusinessDate(state, businessDate);
const { cashTotal, upiTotal, totalCollection } = calculateSettlementSummary(collections);

// Create settlement
createSettlement({
  agentId: session.agentId,
  branchId: session.branchId,
  businessDate,
  cashTotal,
  upiTotal,
  totalCollection,
  cashInHand: 5000, // Entered by agent
  notes: 'Optional notes',
});

const settlementId = 'new-settlement-id';

// Submit
submitSettlement(settlementId);

logEvent({
  actorAgentId: session.agentId,
  action: 'SUBMIT_SETTLEMENT',
  entityType: 'SETTLEMENT',
  entityId: settlementId,
});

enqueueAction({
  entityType: 'SETTLEMENT',
  action: 'SUBMIT',
  payload: { settlementId },
});

await Promise.all([
  persistSettlements(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### 6. Get Monthly Report

```typescript
import { selectMonthlyCollectionReport } from '@/slices/reports.slice';

const report = useSelector((state) =>
  selectMonthlyCollectionReport(
    state,
    2025, // year
    1, // month
    undefined, // routeId (optional)
    undefined // agentId (optional)
  )
);

// Use report
console.log('Grand Total:', report.grandTotal);
console.log('Audit Status:', report.isAuditSuccessful);
console.log('Rows:', report.rows);
console.log('Daily Totals:', report.dailyTotals);
```

### 7. Retry Failed Sync

```typescript
const { retrySync, retryAllFailed, persistSyncQueue } = useSyncQueueSlice();

// Retry single item
retrySync('queue-item-id');
await persistSyncQueue();

// Retry all failed
retryAllFailed();
await persistSyncQueue();
```

## Common Selectors

```typescript
import { useSelector } from 'react-redux';
import {
  selectAllCustomers,
  selectCustomerById,
  selectCustomersByRoute,
  selectActiveCustomers,
} from '@/slices/customers.slice';

import {
  selectAllAccounts,
  selectAccountsByCustomer,
  selectActiveAccountsByCustomer,
} from '@/slices/accounts.slice';

import {
  selectAllCollections,
  selectCollectionsByAccount,
  selectTodayCollectionsByAgent,
  selectTotalCollectedToday,
} from '@/slices/collections.slice';

import {
  selectActiveDelegations,
  selectDelegationsBySecondaryAgent,
  selectApplicableDelegation,
} from '@/slices/delegations.slice';

import {
  selectAllSettlements,
  selectSettlementByAgentAndDate,
  selectPendingSettlements,
} from '@/slices/settlements.slice';

import {
  selectPendingQueueItems,
  selectFailedQueueItems,
  selectSyncStatusSummary,
} from '@/slices/syncQueue.slice';

import {
  selectMonthlyCollectionReport,
  selectDailySummary,
  selectOverdueCustomers,
} from '@/slices/reports.slice';

// Usage
const customers = useSelector(selectAllCustomers);
const account = useSelector((state) => selectAccountById(state, 'account-123'));
const todayTotal = useSelector((state) =>
  selectTotalCollectedToday(state, agentId, timezone)
);
```

## Business Logic Utilities

```typescript
import {
  getBusinessDate,
  getCurrentBusinessDate,
  calculateDueMissedPenalty,
  isDuplicateCollection,
  checkDelegationEligibility,
  validatePhone,
  maskKYCNumber,
} from '@/utils/businessLogic';

// Get business date
const businessDate = getBusinessDate(
  new Date().toISOString(),
  'Asia/Kolkata'
);

// Calculate due
const { dueAmount, missedDays, penaltyAmount, totalDue } =
  calculateDueMissedPenalty(
    account,
    ledgerEntries,
    collections,
    businessDate,
    'DAILY',
    5 // penalty per day
  );

// Check duplicate
const isDupe = isDuplicateCollection(
  accountId,
  businessDate,
  amount,
  agentId,
  existingCollections
);

// Check delegation
const { isEligible, reason } = checkDelegationEligibility(
  agentId,
  customerId,
  accountId,
  delegations,
  timestamp,
  todayCount,
  todayAmount
);

// Validate phone
const isValid = validatePhone('9876543210');

// Mask KYC
const masked = maskKYCNumber('123456789012'); // "XXXXXXXX9012"
```

## Storage Operations

```typescript
import {
  getItemSafe,
  setItemSafe,
  removeItemSafe,
  clearAllData,
  clearAllDataExceptQueue,
} from '@/utils/storage';

// Get item
const data = await getItemSafe('@pigmy/customers', fallbackValue);

// Set item
await setItemSafe('@pigmy/customers', data);

// Remove item
await removeItemSafe('@pigmy/customers');

// Clear all data (nuclear option)
await clearAllData();

// Clear all except queue
await clearAllDataExceptQueue();
```

## Patterns

### Always Persist After Updates

```typescript
// ❌ Bad
addCustomer(data);

// ✅ Good
addCustomer(data);
await persistCustomers();
```

### Batch Operations

```typescript
// ✅ Good
addCustomer(data);
addKYCDocument(kycData);
enqueueAction(syncData);
logEvent(auditData);

await Promise.all([
  persistCustomers(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### Check Before Acting

```typescript
// Check duplicates
const duplicates = useSelector((state) =>
  selectPotentialDuplicates(state, branchId, phone)
);

if (duplicates.length > 0) {
  // Warn user
}

// Check delegation
const delegation = useSelector((state) =>
  selectApplicableDelegation(state, customerId, accountId, agentId, timestamp)
);

if (!delegation) {
  // Block collection
}
```

### Always Audit

```typescript
logEvent({
  actorAgentId: session.agentId,
  action: 'YOUR_ACTION',
  entityType: 'ENTITY_TYPE',
  entityId: 'entity-id',
  beforeData: before, // optional
  afterData: after, // optional
});

await persistAuditLogs();
```

### Always Enqueue for Sync

```typescript
enqueueAction({
  entityType: 'CUSTOMER', // or COLLECTION, DELEGATION, SETTLEMENT
  action: 'CREATE', // or UPDATE, REVERSE, SUBMIT, REVOKE
  payload: { /* data to sync */ },
});

await persistSyncQueue();
```

## Troubleshooting

### Data not persisting?

Check if you called persist actions:

```typescript
addCustomer(data);
await persistCustomers(); // Don't forget!
```

### Duplicate collection created?

Use duplicate check:

```typescript
const isDupe = isDuplicateCollection(
  accountId,
  businessDate,
  amount,
  agentId,
  collections
);

if (isDupe) {
  alert('Duplicate!');
  return;
}
```

### Report totals don't match?

Check `isAuditSuccessful`:

```typescript
if (!report.isAuditSuccessful) {
  console.error('Errors:', report.auditErrors);
}
```

### Storage quota exceeded?

Clear completed sync items:

```typescript
const { clearCompleted, persistSyncQueue } = useSyncQueueSlice();
clearCompleted();
await persistSyncQueue();
```

## Next Steps

1. Install dependencies: `npm install date-fns date-fns-tz`
2. Initialize storage in your root component
3. Hydrate all slices on app start
4. Use hooks in your screens
5. Follow patterns in INTEGRATION-GUIDE.md
6. Refer to BUSINESS-RULES.md for edge cases

---

**Full documentation:**

- `INTEGRATION-GUIDE.md` - Detailed integration instructions
- `BUSINESS-RULES.md` - Complete business rules and edge cases
- `DB-SCHEMA.md` - Database schema reference


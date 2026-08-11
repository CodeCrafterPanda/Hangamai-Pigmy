# Pigmy Collection System - Integration Guide

## Overview

This guide explains how to integrate the business logic layer into your React Native Expo application. The system is designed with a **local-first** architecture using AsyncStorage as the source of truth, with API sync capabilities that can be plugged in later.

## Architecture

### Core Principles

1. **Local-First**: AsyncStorage is the source of truth
2. **Redux Toolkit**: State management with typed hooks
3. **Offline-First**: All operations work offline, sync queue handles API sync
4. **Immutable Ledger**: Accounting records are append-only
5. **Audit Trail**: All operations are logged
6. **Type Safety**: Full TypeScript coverage

### Technology Stack

- **State Management**: Redux Toolkit
- **Persistence**: AsyncStorage
- **Date Handling**: date-fns, date-fns-tz
- **UUID Generation**: Built-in utility (no external dependency)

## Installation

### 1. Install Dependencies

```bash
npm install date-fns date-fns-tz
```

### 2. Initialize Storage on App Start

In your root `_layout.tsx` or `App.tsx`:

```typescript
import { useEffect } from 'react';
import { initializeStorage } from '@/utils/storage';
import {
  useAppSlice,
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

export default function RootLayout() {
  const { setLoggedIn } = useAppSlice();
  const { hydrateSettings } = useSettingsSlice();
  const { hydrateCustomers } = useCustomersSlice();
  const { hydrateAccounts } = useAccountsSlice();
  const { hydrateDelegations } = useDelegationsSlice();
  const { hydrateCollections } = useCollectionsSlice();
  const { hydrateLedger } = useLedgerSlice();
  const { hydrateSettlements } = useSettlementsSlice();
  const { hydrateSyncQueue } = useSyncQueueSlice();
  const { hydrateAuditLogs } = useAuditSlice();

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize storage schema
        await initializeStorage();
        
        // Hydrate all slices from storage
        await Promise.all([
          hydrateSettings(),
          hydrateCustomers(),
          hydrateAccounts(),
          hydrateDelegations(),
          hydrateCollections(),
          hydrateLedger(),
          hydrateSettlements(),
          hydrateSyncQueue(),
          hydrateAuditLogs(),
        ]);
        
        // Check session and set logged in state
        const { session } = useSettingsSlice();
        if (session.agentId) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setLoggedIn(false);
      }
    }
    
    initializeApp();
  }, []);

  return (
    // Your app layout
  );
}
```

## Core Operations

### Authentication / Session

#### Login Agent

```typescript
import { useSettingsSlice, useAuditSlice } from '@/slices';

function AgentLogin() {
  const { updateSession, persistSettings } = useSettingsSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { setLoggedIn } = useAppSlice();

  async function handleLogin(agentId: string, branchId: string, deviceFingerprint: string) {
    // Update session
    updateSession({
      agentId,
      branchId,
      deviceFingerprint,
      loggedInAt: new Date().toISOString(),
    });
    
    // Log audit event
    logEvent({
      actorAgentId: agentId,
      action: 'AGENT_LOGIN',
      entityType: 'SESSION',
      entityId: agentId,
      afterData: { agentId, branchId },
    });
    
    // Persist to storage
    await persistSettings();
    await persistAuditLogs();
    
    // Update app state
    setLoggedIn(true);
  }
}
```

#### Logout

```typescript
async function handleLogout() {
  const { clearSession, persistSettings } = useSettingsSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { setLoggedIn } = useAppSlice();
  
  const { session } = useSettingsSlice();
  const agentId = session.agentId;
  
  // Log audit event
  logEvent({
    actorAgentId: agentId,
    action: 'AGENT_LOGOUT',
    entityType: 'SESSION',
    entityId: agentId,
  });
  
  // Clear session
  clearSession();
  
  // Persist
  await persistSettings();
  await persistAuditLogs();
  
  // Update app state
  setLoggedIn(false);
}
```

### Customer Management

#### Create Customer

```typescript
import { useCustomersSlice, useSyncQueueSlice, useAuditSlice } from '@/slices';
import { selectPotentialDuplicates } from '@/slices/customers.slice';
import { useSelector } from 'react-redux';

function AddCustomer() {
  const {
    addCustomer,
    addKYCDocument,
    persistCustomers,
  } = useCustomersSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session } = useSettingsSlice();

  async function handleCreateCustomer(formData: any) {
    const { branchId, agentId } = session;
    
    // Check for duplicates
    const duplicates = useSelector((state) =>
      selectPotentialDuplicates(
        state,
        branchId,
        formData.phone,
        formData.fullName,
        formData.addressLine1
      )
    );
    
    if (duplicates.length > 0) {
      // Show warning and allow user to override
      const proceed = await confirmDuplicate(duplicates);
      if (!proceed) return;
    }
    
    // Create customer
    addCustomer({
      branchId,
      fullName: formData.fullName,
      phone: formData.phone,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      routeId: formData.routeId,
      primaryAgentId: formData.primaryAgentId,
      status: 'ACTIVE',
    });
    
    // Get the created customer (last in list)
    const { customers } = useCustomersSlice();
    const customer = customers.allIds[customers.allIds.length - 1];
    const customerId = customer;
    
    // Add KYC document if provided
    if (formData.kycType && formData.kycNumber) {
      addKYCDocument({
        customerId,
        kycType: formData.kycType,
        kycNumberMasked: maskKYCNumber(formData.kycNumber),
        documentRef: formData.documentRef,
      });
    }
    
    // Log audit
    logEvent({
      actorAgentId: agentId,
      action: 'CREATE_CUSTOMER',
      entityType: 'CUSTOMER',
      entityId: customerId,
      afterData: { customerId, fullName: formData.fullName },
    });
    
    // Enqueue for sync
    enqueueAction({
      entityType: 'CUSTOMER',
      action: 'CREATE',
      payload: { customerId, ...formData },
    });
    
    // Persist
    await Promise.all([
      persistCustomers(),
      persistSyncQueue(),
      persistAuditLogs(),
    ]);
  }
}
```

#### Edit Customer

```typescript
async function handleUpdateCustomer(customerId: string, updates: any) {
  const { updateCustomer, persistCustomers } = useCustomersSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session } = useSettingsSlice();
  
  // Get existing customer for audit trail
  const existing = useSelector((state) => selectCustomerById(state, customerId));
  
  // Update customer
  updateCustomer({
    id: customerId,
    updates,
  });
  
  // Log audit
  logEvent({
    actorAgentId: session.agentId,
    action: 'UPDATE_CUSTOMER',
    entityType: 'CUSTOMER',
    entityId: customerId,
    beforeData: existing,
    afterData: { ...existing, ...updates },
  });
  
  // Enqueue for sync
  enqueueAction({
    entityType: 'CUSTOMER',
    action: 'UPDATE',
    payload: { customerId, updates },
  });
  
  // Persist
  await Promise.all([
    persistCustomers(),
    persistSyncQueue(),
    persistAuditLogs(),
  ]);
}
```

### Collections (Core Business Logic)

#### Collect Deposit

```typescript
import {
  useCollectionsSlice,
  useLedgerSlice,
  useAccountsSlice,
  useSyncQueueSlice,
  useAuditSlice,
  useSettingsSlice,
} from '@/slices';
import {
  calculateDueMissedPenalty,
  createLedgerEntriesForCollection,
  isDuplicateCollection,
  checkDelegationEligibility,
} from '@/utils/businessLogic';
import { selectAccountById } from '@/slices/accounts.slice';
import { selectSchemeForAccount } from '@/slices/accounts.slice';
import { selectCollectionsByAccount } from '@/slices/collections.slice';
import { selectActiveDelegationsByCustomer } from '@/slices/delegations.slice';

function CollectDeposit({ accountId }: { accountId: string }) {
  const { createCollection, persistCollections } = useCollectionsSlice();
  const { addLedgerEntries, persistLedger } = useLedgerSlice();
  const { updateAccountBalance, persistAccounts } = useAccountsSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session, branchSettings } = useSettingsSlice();
  
  const account = useSelector((state) => selectAccountById(state, accountId));
  const scheme = useSelector((state) => selectSchemeForAccount(state, accountId));
  const collections = useSelector((state) => selectCollectionsByAccount(state, accountId));
  const ledgerEntries = useSelector((state) => selectLedgerEntriesByAccount(state, accountId));
  
  // Calculate due amount
  const { dueAmount, missedDays, penaltyAmount, totalDue } = calculateDueMissedPenalty(
    account,
    ledgerEntries,
    collections,
    getCurrentBusinessDate(branchSettings.timezone),
    scheme.frequency,
    scheme.penaltyPerDay
  );

  async function handleCollect(amount: number, penalty: number, mode: 'CASH' | 'UPI') {
    const collectedAt = new Date().toISOString();
    const timezone = branchSettings.timezone;
    
    // Check for duplicates
    const isDuplicate = isDuplicateCollection(
      accountId,
      getBusinessDate(collectedAt, timezone),
      amount,
      session.agentId,
      collections
    );
    
    if (isDuplicate) {
      alert('Duplicate collection detected!');
      return;
    }
    
    // Check delegation if collecting for another agent's customer
    let delegationId: string | undefined;
    if (account.primaryAgentId !== session.agentId) {
      const delegations = useSelector((state) =>
        selectActiveDelegationsByCustomer(state, account.customerId)
      );
      
      const todayCollectionCount = collections.filter(
        c => c.businessDate === getBusinessDate(collectedAt, timezone)
      ).length;
      
      const todayCollectionAmount = collections
        .filter(c => c.businessDate === getBusinessDate(collectedAt, timezone))
        .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
      
      const { isEligible, reason, delegationId: delId } = checkDelegationEligibility(
        session.agentId,
        account.customerId,
        accountId,
        delegations,
        collectedAt,
        todayCollectionCount,
        todayCollectionAmount
      );
      
      if (!isEligible) {
        alert(`Cannot collect: ${reason}`);
        return;
      }
      
      delegationId = delId;
    }
    
    // Create collection
    createCollection({
      branchId: session.branchId,
      customerId: account.customerId,
      accountId,
      primaryAgentId: account.primaryAgentId,
      collectedByAgentId: session.agentId,
      delegationId,
      amount,
      penaltyAmount: penalty,
      mode,
      collectedAt,
      timezone,
      deviceFingerprint: session.deviceFingerprint,
      // GPS coordinates if available
      gpsLat: undefined,
      gpsLng: undefined,
    });
    
    // Get the created collection ID (last in list)
    const { collections: collectionsState } = useCollectionsSlice();
    const lastCollectionId = collectionsState.allIds[collectionsState.allIds.length - 1];
    
    // Create ledger entries
    const ledgerEntries = createLedgerEntriesForCollection(
      accountId,
      lastCollectionId,
      amount,
      penalty,
      collectedAt
    );
    
    addLedgerEntries(ledgerEntries);
    
    // Update account balance
    const newBalance = calculateAccountBalance([...ledgerEntries, ...ledgerEntries]);
    updateAccountBalance({ id: accountId, balance: newBalance });
    
    // Log audit
    logEvent({
      actorAgentId: session.agentId,
      action: 'COLLECT_DEPOSIT',
      entityType: 'COLLECTION',
      entityId: lastCollectionId,
      afterData: { accountId, amount, penalty, mode },
    });
    
    // Enqueue for sync
    enqueueAction({
      entityType: 'COLLECTION',
      action: 'CREATE',
      payload: {
        collectionId: lastCollectionId,
        accountId,
        amount,
        penalty,
        mode,
      },
    });
    
    // Persist all changes
    await Promise.all([
      persistCollections(),
      persistLedger(),
      persistAccounts(),
      persistSyncQueue(),
      persistAuditLogs(),
    ]);
    
    // Navigate to receipt screen
    router.push(`/receipt/${lastCollectionId}`);
  }
  
  return (
    // Your UI with amount, penalty, mode selectors
    // Call handleCollect() on submit
  );
}
```

#### Reverse Collection

```typescript
async function handleReverseCollection(collectionId: string) {
  const { reverseCollection, persistCollections } = useCollectionsSlice();
  const { addLedgerEntries, persistLedger } = useLedgerSlice();
  const { updateAccountBalance, persistAccounts } = useAccountsSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session } = useSettingsSlice();
  
  // Get collection
  const collection = useSelector((state) => selectCollectionById(state, collectionId));
  
  // Create reversal ledger entries
  const reversalEntries = createReversalLedgerEntry(
    collection,
    `${collectionId}-REVERSAL`,
    new Date().toISOString()
  );
  
  addLedgerEntries(reversalEntries);
  
  // Reverse collection
  reverseCollection(collectionId);
  
  // Recalculate account balance
  const allLedgerEntries = useSelector((state) =>
    selectLedgerEntriesByAccount(state, collection.accountId)
  );
  const newBalance = calculateAccountBalance(allLedgerEntries);
  updateAccountBalance({ id: collection.accountId, balance: newBalance });
  
  // Log audit
  logEvent({
    actorAgentId: session.agentId,
    action: 'REVERSE_COLLECTION',
    entityType: 'COLLECTION',
    entityId: collectionId,
    beforeData: collection,
  });
  
  // Enqueue for sync
  enqueueAction({
    entityType: 'COLLECTION',
    action: 'REVERSE',
    payload: { collectionId },
  });
  
  // Persist
  await Promise.all([
    persistCollections(),
    persistLedger(),
    persistAccounts(),
    persistSyncQueue(),
    persistAuditLogs(),
  ]);
}
```

### Delegations

#### Create Delegation

```typescript
async function handleCreateDelegation(formData: any) {
  const { createDelegation, persistDelegations } = useDelegationsSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session } = useSettingsSlice();
  
  // Check for conflicts
  const conflict = useSelector((state) =>
    selectConflictingDelegation(
      state,
      formData.customerId,
      formData.accountId,
      formData.secondaryAgentId,
      formData.startAt,
      formData.endAt
    )
  );
  
  if (conflict) {
    alert('Conflicting delegation exists!');
    return;
  }
  
  // Create delegation
  createDelegation({
    customerId: formData.customerId,
    accountId: formData.accountId,
    primaryAgentId: formData.primaryAgentId,
    secondaryAgentId: formData.secondaryAgentId,
    startAt: formData.startAt,
    endAt: formData.endAt,
    maxAmountPerDay: formData.maxAmountPerDay,
    maxCollectionsPerDay: formData.maxCollectionsPerDay,
    createdBy: session.agentId,
  });
  
  // Log audit
  logEvent({
    actorAgentId: session.agentId,
    action: 'CREATE_DELEGATION',
    entityType: 'DELEGATION',
    entityId: 'new-delegation-id',
    afterData: formData,
  });
  
  // Enqueue for sync
  enqueueAction({
    entityType: 'DELEGATION',
    action: 'CREATE',
    payload: formData,
  });
  
  // Persist
  await Promise.all([
    persistDelegations(),
    persistSyncQueue(),
    persistAuditLogs(),
  ]);
}
```

### Settlement / Day Close

#### Create Settlement

```typescript
import { calculateSettlementSummary } from '@/utils/businessLogic';

function Settlement() {
  const { createSettlement, submitSettlement, persistSettlements } = useSettlementsSlice();
  const { enqueueAction, persistSyncQueue } = useSyncQueueSlice();
  const { logEvent, persistAuditLogs } = useAuditSlice();
  const { session, branchSettings } = useSettingsSlice();
  
  const businessDate = getCurrentBusinessDate(branchSettings.timezone);
  const todayCollections = useSelector((state) =>
    selectCollectionsByBusinessDate(state, businessDate)
  );
  
  // Calculate summary
  const { cashTotal, upiTotal, totalCollection, collectionCount } =
    calculateSettlementSummary(todayCollections);
  
  async function handleSubmitSettlement(cashInHand: number, notes?: string) {
    // Create settlement
    createSettlement({
      agentId: session.agentId,
      branchId: session.branchId,
      businessDate,
      cashTotal,
      upiTotal,
      totalCollection,
      cashInHand,
      notes,
    });
    
    // Get created settlement ID
    const { settlements } = useSettlementsSlice();
    const settlementId = settlements.allIds[settlements.allIds.length - 1];
    
    // Submit settlement
    submitSettlement(settlementId);
    
    // Log audit
    logEvent({
      actorAgentId: session.agentId,
      action: 'SUBMIT_SETTLEMENT',
      entityType: 'SETTLEMENT',
      entityId: settlementId,
      afterData: { businessDate, cashTotal, upiTotal, cashInHand },
    });
    
    // Enqueue for sync
    enqueueAction({
      entityType: 'SETTLEMENT',
      action: 'SUBMIT',
      payload: { settlementId, businessDate },
    });
    
    // Persist
    await Promise.all([
      persistSettlements(),
      persistSyncQueue(),
      persistAuditLogs(),
    ]);
  }
  
  return (
    // Your settlement UI
  );
}
```

### Reports

#### Monthly Collections Report

```typescript
import { selectMonthlyCollectionReport } from '@/slices/reports.slice';

function MonthlyCollections() {
  const year = 2025;
  const month = 1;
  const routeId = undefined; // Optional filter
  const agentId = undefined; // Optional filter
  
  const report = useSelector((state) =>
    selectMonthlyCollectionReport(state, year, month, routeId, agentId)
  );
  
  return (
    <View>
      {/* Display report.rows in a table */}
      {/* Display report.dailyTotals as footer */}
      {/* Display report.grandTotal */}
      {/* Show warning if !report.isAuditSuccessful */}
      {report.auditErrors.map(error => (
        <Text key={error} style={{ color: 'red' }}>{error}</Text>
      ))}
    </View>
  );
}
```

#### Daily Summary

```typescript
import { selectDailySummary } from '@/slices/reports.slice';

function DailySummary() {
  const { branchSettings } = useSettingsSlice();
  const businessDate = getCurrentBusinessDate(branchSettings.timezone);
  
  const summary = useSelector((state) => selectDailySummary(state, businessDate));
  
  return (
    <View>
      <Text>Total Cash: ₹{summary.totalCash}</Text>
      <Text>Total UPI: ₹{summary.totalUpi}</Text>
      <Text>Total Collection: ₹{summary.totalCollection}</Text>
      <Text>Collection Count: {summary.collectionCount}</Text>
      
      {/* Agent summaries */}
      {Object.values(summary.agentSummaries).map(agent => (
        <View key={agent.agentId}>
          <Text>{agent.agentName}: ₹{agent.total}</Text>
        </View>
      ))}
    </View>
  );
}
```

## Sync Queue Management

### Retry Failed Items

```typescript
function OfflineQueue() {
  const { retrySync, retryAllFailed, persistSyncQueue } = useSyncQueueSlice();
  const failedItems = useSelector(selectFailedQueueItems);
  
  async function handleRetryItem(itemId: string) {
    retrySync(itemId);
    await persistSyncQueue();
    
    // Trigger sync process (implement API sync logic here)
    await syncToServer();
  }
  
  async function handleRetryAll() {
    retryAllFailed();
    await persistSyncQueue();
    
    // Trigger sync process
    await syncToServer();
  }
  
  return (
    // Your offline queue UI
  );
}
```

### Sync to API (Future Implementation)

```typescript
// When API is ready, implement this:
async function syncToServer() {
  const { markSyncDone, markSyncFailed, persistSyncQueue } = useSyncQueueSlice();
  const pendingItems = useSelector(selectPendingQueueItems);
  
  for (const item of pendingItems) {
    try {
      // Make API call based on entity type and action
      const response = await apiClient.sync(item.entityType, item.action, item.payload);
      
      if (response.success) {
        markSyncDone(item.id);
      } else {
        markSyncFailed({ id: item.id, error: response.error });
      }
    } catch (error: any) {
      markSyncFailed({ id: item.id, error: error.message });
    }
  }
  
  await persistSyncQueue();
}
```

## Best Practices

### 1. Always Persist After State Changes

```typescript
// Bad: State updated but not persisted
addCustomer(customerData);

// Good: Persist after state update
addCustomer(customerData);
await persistCustomers();
```

### 2. Use Transactions (Batch Persist)

```typescript
// Good: Batch multiple operations
addCustomer(customerData);
addKYCDocument(kycData);
enqueueAction(syncData);
logEvent(auditData);

await Promise.all([
  persistCustomers(),
  persistSyncQueue(),
  persistAuditLogs(),
]);
```

### 3. Always Check State Before Operations

```typescript
// Check for duplicates
const duplicates = useSelector((state) =>
  selectPotentialDuplicates(state, branchId, phone)
);

// Check for conflicts
const conflict = useSelector((state) =>
  selectConflictingDelegation(state, customerId, accountId, ...)
);
```

### 4. Always Log Audit Events

```typescript
// Every significant operation should be audited
logEvent({
  actorAgentId: session.agentId,
  action: 'CREATE_CUSTOMER',
  entityType: 'CUSTOMER',
  entityId: customerId,
  afterData: customerData,
});
```

### 5. Always Enqueue for Sync

```typescript
// Every server-side operation should be queued
enqueueAction({
  entityType: 'CUSTOMER',
  action: 'CREATE',
  payload: customerData,
});
```

## Error Handling

### Graceful Degradation

```typescript
try {
  await persistCustomers();
} catch (error) {
  console.error('Failed to persist:', error);
  // Show user-friendly error
  Alert.alert('Error', 'Failed to save data. Please try again.');
}
```

### Storage Corruption Recovery

```typescript
// If storage is corrupted, the system will automatically:
// 1. Return fallback values (empty stores)
// 2. Log errors to console
// 3. Allow user to continue (data will be in-memory)

// You can also manually clear corrupted data:
import { clearAllData, initializeStorage } from '@/utils/storage';

async function handleClearData() {
  await clearAllData();
  await initializeStorage();
  // Re-hydrate all slices
}
```

## Performance Optimization

### 1. Use Memoized Selectors

```typescript
// Reports slice uses createSelector for memoization
const report = useSelector((state) =>
  selectMonthlyCollectionReport(state, year, month)
);
```

### 2. Batch Hydration

```typescript
// Hydrate all slices in parallel
await Promise.all([
  hydrateCustomers(),
  hydrateAccounts(),
  hydrateCollections(),
  // ...
]);
```

### 3. Persist Strategically

```typescript
// Don't persist on every state change
// Persist after completing a logical operation

// Bad:
addCustomer(data);
await persistCustomers(); // Persist immediately

addKYCDocument(kycData);
await persistCustomers(); // Persist again

// Good:
addCustomer(data);
addKYCDocument(kycData);
await persistCustomers(); // Persist once
```

## Testing

### Unit Test Example

```typescript
import { configureStore } from '@reduxjs/toolkit';
import customersReducer, { addCustomer } from '@/slices/customers.slice';

describe('Customers Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: { customers: customersReducer },
    });
  });
  
  it('should add a customer', () => {
    store.dispatch(addCustomer({
      branchId: 'branch-1',
      fullName: 'John Doe',
      phone: '9876543210',
      // ...
    }));
    
    const state = store.getState();
    expect(state.customers.customers.allIds.length).toBe(1);
  });
});
```

## Troubleshooting

### Issue: Data not persisting

**Solution**: Ensure you call persist actions after state updates

```typescript
addCustomer(data);
await persistCustomers(); // Don't forget!
```

### Issue: Duplicate collections

**Solution**: Use the duplicate check before creating collections

```typescript
const isDuplicate = isDuplicateCollection(
  accountId,
  businessDate,
  amount,
  agentId,
  existingCollections
);

if (isDuplicate) {
  // Handle duplicate
}
```

### Issue: Monthly report totals don't match

**Solution**: The report automatically verifies reconciliation. Check `report.isAuditSuccessful` and `report.auditErrors`

```typescript
if (!report.isAuditSuccessful) {
  console.error('Reconciliation errors:', report.auditErrors);
  // Investigate data inconsistency
}
```

### Issue: Storage quota exceeded

**Solution**: Implement data archival or clear old data

```typescript
import { clearCompleted } from '@/slices/syncQueue.slice';

// Clear completed sync items
clearCompleted();
await persistSyncQueue();
```

## API Integration (Future)

When ready to integrate with API:

1. Create API client in `services/api.ts`
2. Implement sync logic that processes sync queue
3. Call sync on:
   - App foreground
   - Manual refresh
   - Periodic intervals (background task)
4. Handle API responses and update sync queue status

```typescript
// Example API client interface
interface ApiClient {
  syncCustomer(action: 'CREATE' | 'UPDATE', payload: any): Promise<ApiResponse>;
  syncCollection(action: 'CREATE' | 'REVERSE', payload: any): Promise<ApiResponse>;
  syncDelegation(action: 'CREATE' | 'REVOKE', payload: any): Promise<ApiResponse>;
  syncSettlement(action: 'SUBMIT', payload: any): Promise<ApiResponse>;
}
```

## Summary

This business logic layer provides:

✅ Local-first architecture with AsyncStorage
✅ Full offline support with sync queue
✅ Immutable ledger and audit trail
✅ Type-safe Redux Toolkit slices
✅ Business rule enforcement (delegations, duplicates, etc.)
✅ Reconciliation checks for reports
✅ API-ready design with repository pattern

All functionality is implemented and ready to use. UI screens can call the actions and selectors as shown in the examples above.


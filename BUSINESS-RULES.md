# Pigmy Collection System - Business Rules & Edge Cases

## Overview

This document details all business rules, constraints, and edge case handling implemented in the pigmy collection system. These rules ensure data integrity, regulatory compliance, and correct business operations.

---

## 1. Authentication & Session Management

### Login Rules

- ✅ Agent must provide valid credentials (agent ID, branch ID)
- ✅ Device fingerprint is captured and stored with session
- ✅ Only one active session per device
- ✅ Session data persisted locally in AsyncStorage

### Session Validation on App Start

```typescript
// Implemented in: Integration Guide - Initialize Storage
if (session.agentId && session.branchId) {
  // Valid session exists
  setLoggedIn(true);
} else {
  // No valid session
  setLoggedIn(false);
}
```

### Logout Rules

- ✅ Clear session data from AsyncStorage
- ✅ Keep offline transaction queue (do NOT delete sync queue)
- ✅ Keep audit logs
- ✅ Update app.loggedIn state to false
- ✅ Log logout event to audit trail

### Corrupted Storage Handling

- ✅ If AsyncStorage data is corrupted, return fallback defaults
- ✅ Log error to console for debugging
- ✅ Allow user to continue with empty state
- ✅ Provide manual "Clear All Data" option in settings

---

## 2. Customer Management

### Customer ID/Code Generation

- ✅ **Before Save**: Customer code can be "PENDING-GEN"
- ✅ **After Save**: Generate stable local UUID and format: `CUST-####`
- ✅ Customer codes are sequential and persistent
- ✅ Format: `CUST-0001`, `CUST-0002`, etc.

### Required Fields

- ✅ Full Name (required)
- ✅ Address Line 1 (required)
- ✅ City (required)
- ✅ State (required)
- ✅ Pincode (required)
- ✅ Branch ID (required)
- ✅ Route ID (required)
- ✅ Primary Agent ID (required)
- ❌ Phone (optional but validated if present)

### Phone Validation

- ✅ Optional field
- ✅ If provided, must be valid Indian mobile: 10 digits starting with 6-9
- ✅ Normalized for duplicate checking (remove spaces, dashes)

### Duplicate Detection

**Check duplicates by:**

1. **Phone Number**: Exact match after normalization (within same branch)
2. **Name + Address**: Heuristic match for similar names and overlapping addresses (within same branch)

**Behavior:**

- ✅ Show warning with list of potential duplicates
- ✅ Allow user to override and proceed
- ✅ Do NOT block creation, only warn

### Edit Customer Rules

- ✅ Can edit all customer fields
- ✅ **Important**: Changing route or primary agent applies **only to future cycles**
- ✅ Historical collections remain unchanged (do NOT mutate past collection records)
- ✅ Customer record stores current route/agent mapping

### Customer Status

- ✅ **ACTIVE**: Normal operations allowed
- ✅ **INACTIVE**: Cannot create new accounts, existing accounts can be collected
- ✅ **BLOCKED**: No operations allowed (collections blocked)

---

## 3. KYC Management

### KYC Rules

- ✅ Multiple KYC documents can be added per customer
- ✅ **Append-only**: Never delete KYC documents, only add new ones
- ✅ Store masked KYC numbers (e.g., "XXXX-XXXX-1234")
- ✅ Store document reference (file path or URI)
- ✅ Keep verification timestamp if verified
- ✅ Maintain history of all KYC documents

### Supported KYC Types

- AADHAR
- PAN
- VOTER_ID
- OTHER

---

## 4. Accounts & Schemes

### Account Creation

- ✅ Account number format: `ACCT-YYYY-####`
- ✅ Example: `ACCT-2025-0001`
- ✅ Sequential within each year
- ✅ Account number resets each year
- ✅ Account tied to customer and scheme
- ✅ Initial balance is 0 (calculated from ledger)

### Account Status

- ✅ **ACTIVE**: Normal collections allowed
- ✅ **CLOSED**: No new collections, balance settled
- ✅ **BLOCKED**: No operations allowed

### Scheme Frequency

- ✅ **DAILY**: Collection expected every day
- ✅ **WEEKLY**: Collection expected every 7 days
- ✅ **MONTHLY**: Collection expected every 30 days

### Penalty Calculation

- ✅ Penalty per day is defined in scheme
- ✅ Missed days calculated based on frequency
- ✅ Formula: `penaltyAmount = missedDays * penaltyPerDay`

---

## 5. Delegations (Temporary Agent Assignment)

### Delegation Scope

- ✅ Can delegate **all accounts** of a customer (accountId = null)
- ✅ Can delegate **specific account** (accountId = specific UUID)

### Delegation Validity

- ✅ Has start time (`startAt`) and end time (`endAt`)
- ✅ Only valid within time window
- ✅ Auto-expire when `endAt` is past
- ✅ Can be manually revoked before `endAt`

### Delegation Limits

- ✅ **Max Amount Per Day**: Optional limit on total collection amount
- ✅ **Max Collections Per Day**: Optional limit on number of collections
- ✅ Limits are enforced per business date
- ✅ Tracked by delegation ID

### Conflict Detection

**Prevent conflicting delegations:**

- ✅ Same customer + account cannot be delegated to multiple secondary agents with overlapping time
- ✅ If accountId is null, it conflicts with any delegation for that customer
- ✅ Show error and block creation if conflict exists

### Delegation Enforcement on Collection

**Before creating collection:**

1. ✅ Check if collected_by_agent != primary_agent
2. ✅ If different, find applicable delegation
3. ✅ Verify delegation is active and within time window
4. ✅ Check max_amount_per_day limit
5. ✅ Check max_collections_per_day limit
6. ✅ If any check fails, block collection with reason

**Collection Record:**

- ✅ Store `primary_agent_id` (owner)
- ✅ Store `collected_by_agent_id` (actual collector)
- ✅ Store `delegation_id` (reference to delegation used)

### Offline Delegation Edge Case

**Scenario**: Delegation is revoked/expired while agent is offline collecting

**Solution**:

- ✅ Allow local collection (offline)
- ✅ Mark sync queue item as "NEEDS_REVIEW"
- ✅ Include reason: "Delegation expired during offline collection"
- ✅ Admin reviews and approves/rejects on sync

---

## 6. Collections (Core Business Logic)

### Receipt Number Generation

- ✅ Format: `{PREFIX}-{YEAR}-{NUMBER}`
- ✅ Example: `RCPT-2025-0001`
- ✅ Atomic and monotonic (increments sequentially)
- ✅ Stored in receipt series counter
- ✅ Auto-resets for new year

### Idempotency Key

- ✅ Format: `{deviceFingerprint}-{accountId}-{timestamp}`
- ✅ Ensures uniqueness per device per transaction
- ✅ Prevents duplicate collections on retry
- ✅ Checked before creating collection

### Business Date Calculation

- ✅ Business date depends on **branch timezone**, not device timezone
- ✅ Format: `YYYY-MM-DD`
- ✅ Calculated from `collectedAt` timestamp using branch timezone
- ✅ Example: If branch is in Kolkata (IST) but device in Dubai (GST), use IST

### Collection Fields

**Required:**

- Branch ID
- Customer ID
- Account ID
- Primary Agent ID (owner)
- Collected By Agent ID (actual collector)
- Amount (deposit amount)
- Penalty Amount
- Mode (CASH or UPI)
- Collected At (ISO timestamp)
- Business Date (YYYY-MM-DD)
- Receipt Number
- Idempotency Key

**Optional:**

- Delegation ID (if collected via delegation)
- GPS Latitude
- GPS Longitude

### Collection Status

- ✅ **CREATED**: Collection created locally (offline)
- ✅ **SYNCED**: Successfully synced to server
- ✅ **FAILED**: Sync failed, pending retry
- ✅ **REVERSED**: Collection reversed (voided)

### Duplicate Detection

**Check for duplicate if:**

- ✅ Same account ID
- ✅ Same business date
- ✅ Same amount
- ✅ Same collected_by_agent
- ✅ Within 5-minute time window

**Behavior:**

- ✅ Show warning
- ✅ Block if idempotency key already exists

### Backdate Prevention

- ✅ Default: `allow_backdate_days = 0` (no backdating)
- ✅ Can be configured per branch
- ✅ Admin can allow backdating (e.g., 2 days)
- ✅ Check: `target_date >= (current_date - allow_backdate_days)`

### Collection Reversal

**Rules:**

- ✅ **Cannot delete** collections
- ✅ Must create **reversal entry**
- ✅ Original collection status → `REVERSED`
- ✅ Receipt number remains immutable
- ✅ Create reversal ledger entries (negative amounts)
- ✅ Update account balance

**Reversal Process:**

1. Mark collection as `REVERSED`
2. Create reversal ledger entries (negative amounts)
3. Recalculate account balance
4. Log audit event
5. Enqueue reversal for sync

---

## 7. Ledger (Immutable Accounting)

### Ledger Entry Types

- ✅ **CREDIT**: Deposit/collection amount
- ✅ **PENALTY**: Penalty amount
- ✅ **ADJUSTMENT**: Manual adjustment (admin only)
- ✅ **REVERSAL**: Reverses a previous entry (negative amount)

### Ledger Rules

- ✅ **Append-only**: Never mutate existing entries
- ✅ **Immutable**: Entries cannot be deleted
- ✅ All entries linked to account ID
- ✅ Collection entries linked to collection ID
- ✅ Posted at timestamp recorded

### Balance Calculation

- ✅ **CREDIT + PENALTY + ADJUSTMENT**: Add to balance
- ✅ **REVERSAL**: Subtract from balance
- ✅ Account `current_balance` is cached but recalculable from ledger
- ✅ Balance calculation is deterministic (same ledger = same balance)

### Reversal Entries

- ✅ Reference original collection ID
- ✅ Negative amounts to offset original
- ✅ Narration explains reversal reason

---

## 8. Offline Sync Queue

### Queue Item Fields

- Entity Type (CUSTOMER, DELEGATION, COLLECTION, SETTLEMENT)
- Action (CREATE, UPDATE, REVERSE, SUBMIT, REVOKE)
- Status (PENDING, FAILED, DONE)
- Retry Count
- Last Error Message
- Last Attempt Timestamp
- Next Retry Timestamp (exponential backoff)
- Payload (JSON snapshot)

### Queue Operations

**Enqueue:**

- ✅ Every create/update/reverse/submit action creates queue item
- ✅ Status starts as PENDING
- ✅ Payload contains all data needed for API sync

**Retry Logic:**

- ✅ **Exponential Backoff**: 1s, 2s, 4s, 8s, 16s, ..., max 1 hour
- ✅ Automatic retry when `nextRetryAt` time reached
- ✅ Manual retry button for failed items
- ✅ Retry all failed items button

**Mark Done:**

- ✅ When API sync succeeds, mark item as DONE
- ✅ DONE items can be cleared from queue (optional)

**Mark Failed:**

- ✅ When API sync fails, mark item as FAILED
- ✅ Increment retry count
- ✅ Store error message
- ✅ Calculate next retry time

### Partial Failure Handling

- ✅ One failed item does NOT block others
- ✅ Each item processed independently
- ✅ UI shows count of pending, failed, done items

### Queue Persistence

- ✅ Queue items persist across app restarts
- ✅ Preserved even on logout (unless explicit wipe)
- ✅ Critical for offline-first architecture

---

## 9. Settlement / Day Close

### Daily Summary Calculation

**From collections for business date:**

- ✅ **Cash Total**: Sum of all CASH mode collections (excluding REVERSED)
- ✅ **UPI Total**: Sum of all UPI mode collections (excluding REVERSED)
- ✅ **Total Collection**: Cash + UPI

### Cash Reconciliation

- ✅ **Cash in Hand**: Entered by agent (actual cash)
- ✅ **Expected Cash**: Cash Total from collections
- ✅ **Variance**: Cash in Hand - Expected Cash

### Variance Rules

- ✅ If `variance == 0`: Settlement can be submitted (notes optional)
- ✅ If `variance != 0`: Notes **required** explaining variance

### Settlement Status Flow

1. **DRAFT**: Agent can edit settlement details
2. **SUBMITTED**: Locked for review, agent cannot edit
3. **APPROVED**: Admin approved (API action)
4. **REJECTED**: Admin rejected, returned to DRAFT (API action)

### Submission Rules

- ✅ Can only submit from DRAFT status
- ✅ Must have notes if variance != 0
- ✅ Once submitted, agent cannot edit
- ✅ Create sync queue item for submission

### Edit Rules

- ✅ Can edit ONLY in DRAFT status
- ✅ Cannot edit SUBMITTED, APPROVED, or REJECTED settlements
- ✅ Variance recalculated automatically on cash values change

---

## 10. Reports

### Monthly Collections Matrix

**Structure:**

- Rows: Account Number, Customer Name, Day 1-N columns, Monthly Total
- Footer: Daily totals for each day column, Grand Total

**Filters:**

- ✅ Month and Year (required)
- ✅ Route (optional)
- ✅ Agent (optional)
- ✅ Status: Active accounts only

**Reconciliation Check:**

- ✅ `Sum(all row totals) == Grand Total`
- ✅ `Sum(each day column) == Footer day total`
- ✅ `Sum(footer day totals) == Grand Total`
- ✅ Report shows `isAuditSuccessful` flag
- ✅ If false, show `auditErrors` array with details

### Daily Summary Report

- ✅ Total Cash
- ✅ Total UPI
- ✅ Total Collection
- ✅ Collection Count
- ✅ Agent-wise breakdown

### Date Range Summary

- ✅ Filtered by start and end dates
- ✅ Optional agent filter
- ✅ Cash/UPI/Total breakdown

### Overdue Customers

- ✅ Accounts with no collection in last N days
- ✅ Based on scheme frequency
- ✅ Returns account and customer details

### Agent Performance

- ✅ Collections per agent for date range
- ✅ Cash/UPI breakdown
- ✅ Total amount and count
- ✅ Sorted by total amount (descending)

---

## 11. Audit Logging

### What to Log

- ✅ **All significant operations**: Create, Update, Delete, Reverse, Submit
- ✅ **Entity changes**: Before and after data (if applicable)
- ✅ **Actor tracking**: User ID or Agent ID who performed action
- ✅ **Timestamps**: When action occurred

### Audit Log Fields

- Actor User ID (optional)
- Actor Agent ID (optional)
- Action (e.g., "CREATE_CUSTOMER", "REVERSE_COLLECTION")
- Entity Type (e.g., "CUSTOMER", "COLLECTION")
- Entity ID
- Before Data (JSON, optional)
- After Data (JSON, optional)
- Created At (timestamp)

### Audit Persistence

- ✅ Append-only (never delete)
- ✅ Persisted to AsyncStorage
- ✅ Kept even after logout
- ✅ Can be synced to server for compliance

### Use Cases

- Compliance and regulatory requirements
- Debugging data issues
- Dispute resolution
- User activity tracking

---

## 12. Data Model Constraints

### UUID Generation

- ✅ All entity IDs are UUIDs (v4)
- ✅ Generated using `react-native-uuid`
- ✅ Ensures uniqueness across devices

### Normalized Storage

- ✅ Entities stored as `{ byId: {}, allIds: [] }`
- ✅ Efficient lookups by ID
- ✅ Ordered arrays for list rendering
- ✅ Supports large datasets (thousands of entities)

### Storage Keys

All data stored with prefixed keys:

```
@pigmy/metadata
@pigmy/customers
@pigmy/accounts
@pigmy/collections
@pigmy/ledger_entries
@pigmy/delegations
@pigmy/settlements
@pigmy/sync_queue
@pigmy/audit_logs
@pigmy/branches
@pigmy/agents
@pigmy/routes
@pigmy/schemes
@pigmy/kyc_docs
@pigmy/settings
@pigmy/receipt_series
@pigmy/session
```

### Storage Versioning

- ✅ Current version: `1`
- ✅ Migrations run automatically on version mismatch
- ✅ Metadata stores version and last migration timestamp

---

## 13. Edge Cases & Error Scenarios

### Scenario: Customer Creation with Same Phone

**Rule**: Show warning, allow override

**Implementation**:

```typescript
const duplicates = selectPotentialDuplicates(state, branchId, phone);
if (duplicates.length > 0) {
  // Show warning modal
  const proceed = await confirmDuplicate(duplicates);
  if (!proceed) return;
}
```

### Scenario: Collection for Delegated Customer, Delegation Expired Offline

**Rule**: Allow offline, mark for review

**Implementation**:

```typescript
// Create collection with delegation_id
// Enqueue with special flag
enqueueAction({
  entityType: 'COLLECTION',
  action: 'CREATE',
  payload: { ...data, needsReview: true, reason: 'Delegation expired' },
});
```

### Scenario: Receipt Number Collision (Multiple Devices)

**Prevention**: Idempotency key ensures uniqueness

**Resolution**: API assigns final receipt number on sync, local receipt is temporary

### Scenario: Account Balance Mismatch After Reversal

**Prevention**: Always recalculate balance from ledger after reversal

**Implementation**:

```typescript
const allEntries = selectLedgerEntriesByAccount(state, accountId);
const newBalance = calculateAccountBalance(allEntries);
updateAccountBalance({ id: accountId, balance: newBalance });
```

### Scenario: Monthly Report Totals Don't Match

**Detection**: Automatic reconciliation check

**Implementation**:

```typescript
const { isValid, errors } = verifyMonthlyReportReconciliation(
  customerTotals,
  dayTotals,
  grandTotal
);
if (!isValid) {
  // Show errors to user
  console.error('Reconciliation failed:', errors);
}
```

### Scenario: Storage Quota Exceeded

**Solution**: Clear completed sync items, old audit logs

**Implementation**:

```typescript
clearCompleted(); // Remove DONE sync items
await persistSyncQueue();
```

### Scenario: Multiple Agents Collecting for Same Customer Simultaneously (Offline)

**Detection**: Idempotency key and business date + account checks

**Resolution**: Whichever syncs first wins; duplicate is rejected

### Scenario: Agent Changes Route While Customer Has Pending Collections

**Rule**: Historical collections remain unchanged

**Implementation**: Edit customer updates `routeId`, but existing collection records keep old `primary_agent_id`

---

## 14. Business Date vs Device Time

### Timezone Handling

- ✅ **Branch Timezone**: Stored in settings (e.g., "Asia/Kolkata")
- ✅ **Device Timezone**: May be different (e.g., agent traveling)
- ✅ **Business Date**: Always calculated in **branch timezone**

### Example

```
Device Time: 2025-01-15 02:30 AM (Dubai, GMT+4)
Branch Timezone: Asia/Kolkata (GMT+5:30)
Business Date: 2025-01-15 (in Kolkata timezone)
```

### Implementation

```typescript
import { getBusinessDate } from '@/utils/businessLogic';

const businessDate = getBusinessDate(
  collectedAt, // Device timestamp
  branchSettings.timezone // Branch timezone
);
```

---

## 15. Performance Considerations

### Large Data Sets

- ✅ System designed for thousands of customers
- ✅ Tens of thousands of collections
- ✅ Optimized selectors using `createSelector` (memoization)
- ✅ Normalized storage for O(1) lookups

### Persistence Strategy

- ✅ Batch multiple state updates before persisting
- ✅ Use `Promise.all()` for parallel persistence
- ✅ Don't persist on every state change

### Report Generation

- ✅ Monthly report uses memoized selector
- ✅ Recomputes only when dependencies change
- ✅ Efficient day-wise aggregation

---

## 16. Security Considerations

### Data Protection

- ✅ KYC numbers are masked before display
- ✅ Sensitive data stored locally only (no cloud sync yet)
- ✅ Device fingerprint for session binding

### Agent Authorization

- ✅ Agent can only collect for assigned customers (or delegated)
- ✅ Primary agent stored in customer record
- ✅ Delegation checked before allowing collection

### Audit Trail

- ✅ All operations logged with actor information
- ✅ Provides accountability and traceability

---

## Summary Checklist

### Authentication ✅

- [x] Session validation on app start
- [x] Graceful handling of corrupted storage
- [x] Logout preserves offline queue
- [x] Device fingerprint tracking

### Customers ✅

- [x] Customer code generation (CUST-####)
- [x] Duplicate detection (phone, name+address)
- [x] Required field validation
- [x] Edit preserves historical collections
- [x] KYC append-only storage

### Delegations ✅

- [x] Time-bound validity
- [x] Amount and collection limits
- [x] Conflict detection
- [x] Offline expiry handling

### Collections ✅

- [x] Receipt number generation
- [x] Idempotency key for duplicates
- [x] Business date in branch timezone
- [x] Backdate prevention
- [x] Reversal (no deletion)
- [x] Delegation enforcement

### Ledger ✅

- [x] Append-only entries
- [x] Balance calculation from ledger
- [x] Reversal entries

### Settlements ✅

- [x] Variance calculation
- [x] Notes required if variance != 0
- [x] Status flow (DRAFT → SUBMITTED → APPROVED/REJECTED)
- [x] Edit only in DRAFT status

### Reports ✅

- [x] Monthly collection matrix
- [x] Reconciliation checks
- [x] Daily summary
- [x] Agent performance
- [x] Overdue customers

### Sync Queue ✅

- [x] Exponential backoff retry
- [x] Partial failure handling
- [x] Persistent across restarts
- [x] Manual retry options

### Audit ✅

- [x] All operations logged
- [x] Before/after data tracking
- [x] Actor identification
- [x] Append-only storage

---

All business rules are implemented and enforced in the Redux slices and business logic utilities. The system is production-ready for offline-first operations with future API sync capability.


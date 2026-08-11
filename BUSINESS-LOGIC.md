# Pigmy Collection - Business Logic (Plain Language)

This is a single-source-of-truth for **what the business does** and **the rules it must follow**. It intentionally avoids code, screens, and file paths. Every rule below is already defined in this repo (in `utils/businessLogic.ts` and the Redux slices). Nothing here is a proposal - it's what exists and must stay intact.

---

## 1. The Business, In One Paragraph

A cooperative bank runs a **Pigmy scheme**: customers commit to depositing a small fixed amount (e.g. ₹500) every day, week, or month for a fixed period. **Field agents** walk assigned **routes** and collect these deposits at the customer's doorstep, hand out a printed/digital receipt, and hand in the day's cash at the branch. The mobile app runs **offline-first** on the agent's device and later syncs to the server.

---

## 2. Actors

| Actor | What they do |
|---|---|
| **Agent** | Collects deposits, adds customers, closes the day. Uses the app. |
| **Primary Agent** | The agent officially assigned to a customer. |
| **Secondary Agent (Delegate)** | An agent temporarily allowed to collect on another agent's behalf. |
| **Branch** | The bank's local office. Owns customers, routes, agents, and a timezone. |
| **Admin** *(off-app)* | Approves settlements, reviews delegations, creates schemes. |

---

## 3. Core Objects & Their Identity

| Object | ID Rule |
|---|---|
| Customer | Internal UUID + a human code `CUST-####` (sequential per branch, zero-padded to 4 digits). |
| Account | Internal UUID + a human number `ACCT-{YEAR}-####` (sequential per year; resets each year). |
| Collection (receipt) | Internal UUID + a receipt number `{PREFIX}-{YEAR}-####` (e.g. `RCPT-2025-0001`). Sequential, monotonic, resets on year change. |
| Idempotency key (per collection) | `{deviceFingerprint}-{accountId}-{collectedAtTimestamp}` - prevents the same collection being recorded twice from the same device. |

---

## 4. Business Date - The Golden Rule

Every collection, ledger entry, and settlement is stamped with a **business date** (`YYYY-MM-DD`).

- The business date is computed from the collection timestamp **in the branch's timezone**, not the device timezone.
- Example: If the branch is `Asia/Kolkata` but the agent's phone is in Dubai (`Asia/Dubai`), the business date is still calculated in Kolkata time.
- This governs which "day" a collection belongs to for reporting and settlement.

---

## 5. Authentication & Session

| Rule |
|---|
| Agent identifies with mobile number + OTP + a 4-digit **MPIN**. |
| MPIN is what unlocks the app on subsequent logins (the device stays "linked" to the agent). |
| A session stores: `agentId`, `branchId`, `deviceFingerprint`, `mpinHash`, `mpinSetAt`, `loggedInAt`. |
| Only one active session per device. |
| Logout clears session data **but preserves the offline sync queue and audit logs** - unsynced work is never lost by logging out. |
| If local storage is corrupted, the app falls back to empty defaults rather than crashing. |

---

## 6. Customer Management

**Required to create a customer:** full name, address line 1, city, state, pincode, branch, route, primary agent.
**Optional:** phone (must be a valid Indian mobile if given: 10 digits starting with 6-9), address line 2, KYC.

### Duplicate detection (warn, don't block)
Before saving a new customer, check within the same branch for:
1. **Same phone number** (after normalising - strip spaces and dashes).
2. **Similar name + overlapping address** (heuristic match).

If potential duplicates are found, warn the user and let them proceed anyway.

### Editing a customer
- All fields can be edited.
- **Changing route or primary agent applies only to future cycles.** Historical collection records are never mutated - they keep the old primary agent stamped on them.

### Customer status
- **ACTIVE** - normal operations.
- **INACTIVE** - no new accounts; existing accounts can still be collected.
- **BLOCKED** - no operations of any kind.

### KYC documents
- Append-only. Never delete a KYC doc, only add new ones.
- Supported types: AADHAR, PAN, VOTER_ID, OTHER.
- KYC numbers are stored **masked** for display (e.g. `XXXXXXXX1234` - last 4 digits visible).
- Each doc keeps a reference to the uploaded file/URI and a verification timestamp if verified.

---

## 7. Accounts & Schemes

Every deposit account belongs to one customer and follows one **scheme**.

| Field | Rule |
|---|---|
| Frequency | `DAILY` (every day), `WEEKLY` (every 7 days), or `MONTHLY` (every 30 days). |
| Installment amount | Fixed per account (e.g. ₹500/day). |
| Penalty per day | Defined per scheme. |
| Initial balance | Zero. The **current balance is always derivable from the ledger** - the stored balance is just a cache. |
| Status | ACTIVE / CLOSED / BLOCKED. |

### Due & Penalty Calculation
For an account on a given business date:

1. Find the **last non-reversed collection**.
2. Count days since it (or since account opening if never collected).
3. Divide by the scheme frequency to get **missed cycles** (missed days).
4. `dueAmount = installmentAmount * (missedDays + 1)` (missed cycles plus today's).
5. `penaltyAmount = missedDays * penaltyPerDay`.
6. `totalDue = dueAmount + penaltyAmount`.

---

## 8. Delegations (Temporary Substitution)

A **primary agent** can delegate collection of a customer to a **secondary agent** for a limited time.

| Rule |
|---|
| Delegation can cover **all accounts** of a customer, or a **specific account** only. |
| Every delegation has a start time and end time. Outside this window it does not apply. |
| Optional daily caps: **max amount per day** and **max collections per day** (per delegation). |
| Delegation can be manually **revoked** before its end time. |
| Once end time passes, delegation is expired. |

### Conflict detection
When creating a delegation, block it if there is any overlapping active delegation for the same customer (or same customer + same account) already assigned to a different secondary agent.

### Enforcement on collection
When a collection is attempted and `collectedByAgent != primaryAgent`:
1. Find an applicable, active delegation for this agent + customer (and account if specific).
2. Verify current time is within the delegation window.
3. Verify today's collection count for this delegation is below `maxCollectionsPerDay`.
4. Verify today's collected amount for this delegation is below `maxAmountPerDay`.

If any check fails, the collection is blocked with a reason. Every collection record stores `primaryAgentId`, `collectedByAgentId`, and (if used) `delegationId`.

### Offline delegation edge case
If a delegation expires or is revoked while the agent is offline mid-day:
- The collection is still allowed locally.
- The sync queue item is flagged **NEEDS_REVIEW** with reason "Delegation expired during offline collection".
- Admin reviews and approves/rejects on server sync.

---

## 9. Collections (The Core Transaction)

Every collection captures:

**Required:** branchId, customerId, accountId, primaryAgentId, collectedByAgentId, amount, penaltyAmount, mode (`CASH` or `UPI`), collectedAt (ISO timestamp), businessDate (derived), receiptNumber (generated), idempotencyKey (generated).
**Optional:** delegationId, GPS latitude, GPS longitude.

### Rules
| Rule |
|---|
| Amount must be > 0. |
| Receipt number is generated atomically and never re-used. |
| Business date is computed in the **branch timezone**. |
| Idempotency key prevents duplicate saves from the same device. |
| Status flow: `CREATED` (offline) -> `SYNCED` (server accepted) -> `FAILED` (retry pending) -> `REVERSED` (voided). |
| **Collections can never be deleted**, only reversed. |
| GPS is captured when available (not required). |

### Duplicate detection at collection time
A collection is treated as a possible duplicate if all match: same **accountId**, same **businessDate**, same **amount**, same **collectedByAgent**, and within a **5-minute** window.
The idempotency key acts as the hard block; the 5-minute check is a soft warning.

### Backdating
- Default: **backdating is not allowed** (`allow_backdate_days = 0`).
- Per-branch setting can allow N days of backdating.
- Rule: `targetBusinessDate >= currentBusinessDate - allow_backdate_days`.

### Reversal
- Never delete a collection.
- To reverse: set the original status to `REVERSED`, keep the receipt number immutable, and post a reversal entry in the ledger.
- Recalculate the account balance from the ledger.
- Log the reversal in the audit trail.
- Enqueue a `REVERSE` action for the sync queue.

---

## 10. Ledger (Immutable Accounting)

The ledger is the source of truth for account balances. It is **append-only**.

### Entry types
| Type | Effect on balance |
|---|---|
| **CREDIT** | Adds (a collection's principal amount). |
| **PENALTY** | Adds (the penalty portion of a collection). |
| **ADJUSTMENT** | Adds (admin-only manual correction). |
| **REVERSAL** | Subtracts (offsets a previous entry). |

### Rules
- Every collection creates 1 CREDIT entry, plus 1 PENALTY entry if `penaltyAmount > 0`.
- Every reversal creates matching negative-impact REVERSAL entries linked back to the original collection.
- No entry is ever modified or deleted.
- `accountBalance = sum(CREDIT + PENALTY + ADJUSTMENT) - sum(|REVERSAL|)`.
- Balance is **deterministic** - the same ledger always produces the same balance.

---

## 11. Settlement (Day Close / Cash Reconciliation)

At end of day, the agent reconciles cash on hand against expected cash.

### Summary computation (for a business date, per agent)
- `cashTotal` = sum of all non-reversed CASH collections.
- `upiTotal` = sum of all non-reversed UPI collections.
- `totalCollection` = cashTotal + upiTotal.

### Variance
`variance = cashInHand (entered by agent) - cashTotal (expected)`

### Rules
| Rule |
|---|
| If `variance == 0`, notes are optional. Agent can submit. |
| If `variance != 0`, notes are **required** and must explain the mismatch. |
| Status flow: **DRAFT** -> **SUBMITTED** -> **APPROVED** or **REJECTED** (admin decides on server). Rejected settlements return to DRAFT. |
| Edit is allowed **only in DRAFT status**. Once SUBMITTED, agent cannot change it. |
| Submission creates a `SUBMIT` action in the sync queue. |

---

## 12. Offline Sync Queue

Every create/update/reverse/submit operation on Customer, Delegation, Collection, or Settlement is enqueued locally for later server sync.

### Queue item shape
- Entity type (`CUSTOMER` | `DELEGATION` | `COLLECTION` | `SETTLEMENT`).
- Action (`CREATE` | `UPDATE` | `REVERSE` | `SUBMIT` | `REVOKE`).
- Status (`PENDING` | `FAILED` | `DONE`).
- Retry count, last error message, last attempt time, next retry time.
- Payload: full JSON snapshot of what the server needs.

### Retry with exponential backoff
`delay = min(baseDelay * 2^retryCount, maxDelay)` with `baseDelay = 1s` and `maxDelay = 1 hour`. Retry sequence: **1s, 2s, 4s, 8s, 16s ... up to 1 hour**, then holds at 1 hour.

### Rules
| Rule |
|---|
| Partial failure isolation - one failed item never blocks other items. |
| Retry can be automatic (when `nextRetryAt` passes) or manual (retry one, or retry all failed). |
| On successful sync, item is marked `DONE`. Done items can be cleared to save storage. |
| Queue persists across app restarts and survives logout. |

---

## 13. Reports

### Monthly Collection Matrix
A grid: rows = accounts (with account number and customer name), columns = day 1..N of the month, plus a monthly total per row. Footer row = daily totals per column. Bottom-right corner = grand total.

**Filters:** month + year (required), route (optional), agent (optional), status = Active accounts.

**Reconciliation check (automatic):**
- Sum of all row totals must equal the grand total.
- Sum of all column (daily) totals must equal the grand total.
- Sum of the footer daily totals must equal the grand total.

The report exposes an `isAuditSuccessful` flag and an `auditErrors[]` list. Small rounding differences (< ₹0.01) are ignored.

### Daily Summary
For a business date: total cash, total UPI, total collection, collection count, per-agent breakdown.

### Date-Range Summary
Same as daily but aggregated over a start/end date range, optionally filtered by agent.

### Overdue Customers
Accounts with no collection in the last N days, where N is defined by the scheme frequency.

### Agent Performance
For a date range: per-agent totals (cash/UPI/total/count), sorted by total amount desc.

---

## 14. Audit Trail

Every significant operation is logged. Audit records are append-only.

### What is logged
- Create, update, reverse, submit actions on any core entity.
- Login and logout.
- Delegation create/revoke.
- Settlement create/submit.

### Fields
- Actor (user ID or agent ID).
- Action name (e.g. `CREATE_CUSTOMER`, `REVERSE_COLLECTION`).
- Entity type + entity ID.
- Before data (JSON, optional).
- After data (JSON, optional).
- Created-at timestamp.

### Rules
| Rule |
|---|
| Never delete. Never modify. |
| Kept even after logout - required for compliance and dispute resolution. |
| Can be synced to server for regulatory audits. |

---

## 15. Storage Model

### Local storage keys (AsyncStorage)
All data is namespaced under `@pigmy/*`:
`metadata, session, settings, branches, agents, routes, schemes, customers, kyc_docs, accounts, collections, ledger_entries, delegations, settlements, sync_queue, audit_logs, receipt_series`.

### Normalized shape
Every entity collection is stored as `{ byId: {}, allIds: [] }` for O(1) lookup and ordered iteration.

### Versioning
- A `metadata` record stores the storage schema version (currently `1`) and last migration timestamp.
- Migrations run automatically when the version doesn't match.

---

## 16. Data Protection & Authorization

| Rule |
|---|
| KYC numbers are always **masked** when displayed. |
| Session is bound to a **device fingerprint** (so a stolen session can't be trivially replayed on another device). |
| Agents can only collect for customers where they are the **primary agent**, or where an **active delegation** grants them permission. |

---

## 17. Edge Cases & How They Resolve

| Scenario | Resolution |
|---|---|
| Two devices try to collect for the same account offline | Idempotency key ensures each is unique; whichever syncs first wins, the other is rejected. |
| Agent taps "Collect" twice quickly | Same idempotency key -> the second save is blocked. |
| Report totals disagree | Reconciliation check fails, `isAuditSuccessful = false`, `auditErrors[]` explains where. |
| Storage quota exceeded | Cleared completed sync items and (optionally) old audit logs. |
| Delegation expires while offline | Collection saved locally; sync queue item flagged for admin review. |
| Duplicate phone at customer creation | Warn with matching customer(s); allow override. |
| Agent changes route on a customer | Historical collections keep the old route/agent; only future collections use the new mapping. |
| Corrupted local storage | Return safe empty defaults; app remains usable; manual "clear all data" available. |
| Cash variance at day close | Notes required; settlement cannot be submitted without them. |

---

## 18. Performance Expectations

- Designed for **thousands of customers** and **tens of thousands of collections** per device.
- Selectors are memoized (recompute only when inputs change).
- State updates are batched before being persisted.
- Persistence uses parallel writes where possible.

---

## 19. Money & Locale

- Currency: **INR** (`₹`).
- Numbers displayed with Indian grouping (`en-IN`).
- Phone numbers: Indian mobile format (`+91`, 10 digits starting with 6-9).
- Default branch timezone: `Asia/Kolkata`. Configurable per branch.

---

## 20. Non-Negotiables (Summary)

The following rules must never be broken:

1. **No deletions** of collections, ledger entries, KYC docs, or audit logs. Only reversals and appends.
2. **Balance from ledger** - never trust the cached balance; recompute after any reversal.
3. **Branch timezone** decides the business date, not the device.
4. **Idempotency** on every collection.
5. **Offline queue is sacred** - logout does not clear it.
6. **Historical records are frozen** - editing a customer never rewrites past collections.
7. **Delegation is checked on every cross-agent collection**.
8. **Variance requires notes**.
9. **Monthly reports self-audit**.
10. **Everything significant is logged in the audit trail.**

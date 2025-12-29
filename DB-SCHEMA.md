# Co-operative Pigmy Collection System – Database Schema

---

## ENUMS

- user_role: SUPER_ADMIN, BRANCH_ADMIN, SUPERVISOR, AGENT, AUDITOR
- user_status: ACTIVE, SUSPENDED, DISABLED
- agent_status: ACTIVE, INACTIVE
- customer_status: ACTIVE, INACTIVE, BLOCKED
- account_status: ACTIVE, CLOSED, BLOCKED
- scheme_frequency: DAILY, WEEKLY, MONTHLY
- collection_mode: CASH, UPI
- collection_status: CREATED, SYNCED, FAILED, REVERSED
- ledger_type: CREDIT, PENALTY, ADJUSTMENT, REVERSAL
- delegation_status: ACTIVE, EXPIRED, REVOKED
- settlement_status: DRAFT, SUBMITTED, APPROVED, REJECTED
- kyc_type: AADHAR, PAN, VOTER_ID, OTHER

---

## ORGANIZATION

### coops

- id (uuid, PK)
- name
- code
- created_at

### branches

- id (uuid, PK)
- coop_id (FK → coops.id)
- name
- code
- address
- timezone
- created_at

---

## USERS & AGENTS

### users

- id (uuid, PK)
- branch_id (FK → branches.id)
- role (user_role)
- name
- phone
- email
- status (user_status)
- created_at

### agents

- id (uuid, PK)
- branch_id (FK → branches.id)
- agent_code
- name
- phone
- status (agent_status)
- created_at

### agent_devices

- id (uuid, PK)
- agent_id (FK → agents.id)
- device_fingerprint
- os
- app_version
- is_active
- bound_at
- last_seen_at

---

## ROUTES & ASSIGNMENT

### routes

- id (uuid, PK)
- branch_id (FK → branches.id)
- route_code
- name
- created_at

---

## CUSTOMERS

### customers

- id (uuid, PK)
- branch_id (FK → branches.id)
- customer_code
- full_name
- phone
- address_line1
- address_line2
- city
- state
- pincode
- route_id (FK → routes.id)
- primary_agent_id (FK → agents.id)
- status (customer_status)
- created_at
- updated_at

---

## KYC

### customer_kyc

- id (uuid, PK)
- customer_id (FK → customers.id)
- kyc_type (kyc_type)
- kyc_number_masked
- document_ref
- verified_at
- created_at

---

## SCHEMES & ACCOUNTS

### schemes

- id (uuid, PK)
- branch_id (FK → branches.id)
- name
- frequency (scheme_frequency)
- min_amount
- penalty_per_day
- created_at

### accounts

- id (uuid, PK)
- customer_id (FK → customers.id)
- scheme_id (FK → schemes.id)
- account_number
- installment_amount
- current_balance
- status (account_status)
- opened_at
- closed_at

---

## DELEGATION (TEMPORARY ASSIGNMENT)

### delegations

- id (uuid, PK)
- customer_id (FK → customers.id)
- account_id (FK → accounts.id, nullable)
- primary_agent_id (FK → agents.id)
- secondary_agent_id (FK → agents.id)
- start_at
- end_at
- max_amount_per_day
- status (delegation_status)
- created_by (FK → users.id)
- created_at

---

## COLLECTIONS & RECEIPTS

### receipt_series

- id (uuid, PK)
- branch_id (FK → branches.id)
- prefix
- year
- current_number
- updated_at

### collections

- id (uuid, PK)
- branch_id (FK → branches.id)
- customer_id (FK → customers.id)
- account_id (FK → accounts.id)
- primary_agent_id (FK → agents.id)
- collected_by_agent_id (FK → agents.id)
- delegation_id (FK → delegations.id, nullable)
- amount
- penalty_amount
- mode (collection_mode)
- receipt_no
- collected_at
- gps_lat
- gps_lng
- status (collection_status)
- idempotency_key (unique)
- created_at

---

## LEDGER (IMMUTABLE)

### ledger_entries

- id (uuid, PK)
- account_id (FK → accounts.id)
- collection_id (FK → collections.id, nullable)
- entry_type (ledger_type)
- amount
- narration
- posted_at
- created_at

---

## OFFLINE SYNC SUPPORT

### offline_transactions

- id (uuid, PK)
- collection_id (FK → collections.id)
- agent_id (FK → agents.id)
- local_created_at
- sync_status (PENDING, FAILED)
- last_error

---

## END OF DAY SETTLEMENT

### agent_day_closures

- id (uuid, PK)
- agent_id (FK → agents.id)
- business_date
- cash_total
- upi_total
- total_collection
- cash_in_hand
- variance
- notes
- status (settlement_status)
- submitted_at
- reviewed_by (FK → users.id)
- reviewed_at

---

## REPORTING SUPPORT

### daily_collection_summary

- id (uuid, PK)
- branch_id (FK → branches.id)
- business_date
- total_cash
- total_upi
- total_amount

### monthly_collection_snapshot

- id (uuid, PK)
- branch_id (FK → branches.id)
- year
- month
- day
- total_amount

---

## AUDIT

### audit_logs

- id (uuid, PK)
- actor_user_id (FK → users.id, nullable)
- actor_agent_id (FK → agents.id, nullable)
- action
- entity_type
- entity_id
- before_data (jsonb)
- after_data (jsonb)
- created_at

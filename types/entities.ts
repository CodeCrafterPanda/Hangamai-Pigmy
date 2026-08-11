/**
 * Core Domain Entity Types
 * These types represent the local-first data model for the pigmy collection system
 */

// ===========================
// ENUMS
// ===========================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  AGENT = 'AGENT',
  AUDITOR = 'AUDITOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  BLOCKED = 'BLOCKED',
}

export enum SchemeFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum CollectionMode {
  CASH = 'CASH',
  UPI = 'UPI',
}

export enum CollectionStatus {
  CREATED = 'CREATED',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum LedgerType {
  CREDIT = 'CREDIT',
  PENALTY = 'PENALTY',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL',
}

export enum DelegationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum SettlementStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum KYCType {
  AADHAR = 'AADHAR',
  PAN = 'PAN',
  VOTER_ID = 'VOTER_ID',
  OTHER = 'OTHER',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  DONE = 'DONE',
}

export enum SyncEntityType {
  CUSTOMER = 'CUSTOMER',
  DELEGATION = 'DELEGATION',
  COLLECTION = 'COLLECTION',
  SETTLEMENT = 'SETTLEMENT',
}

export enum SyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  REVERSE = 'REVERSE',
  SUBMIT = 'SUBMIT',
  REVOKE = 'REVOKE',
}

// ===========================
// ORGANIZATION ENTITIES
// ===========================

export interface Coop {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  coopId: string;
  name: string;
  code: string;
  address: string;
  timezone: string; // IANA timezone string e.g., "Asia/Kolkata"
  createdAt: string;
}

// ===========================
// USERS & AGENTS
// ===========================

export interface Agent {
  id: string;
  branchId: string;
  agentCode: string;
  name: string;
  phone: string;
  status: AgentStatus;
  createdAt: string;
}

export interface AgentDevice {
  id: string;
  agentId: string;
  deviceFingerprint: string;
  os: string;
  appVersion: string;
  isActive: boolean;
  boundAt: string;
  lastSeenAt: string;
}

// ===========================
// ROUTES
// ===========================

export interface Route {
  id: string;
  branchId: string;
  routeCode: string;
  name: string;
  createdAt: string;
}

// ===========================
// CUSTOMERS
// ===========================

export interface Customer {
  id: string;
  branchId: string;
  customerCode: string; // e.g., "CUST-0001" or "PENDING-GEN" before save
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  routeId: string;
  primaryAgentId: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// KYC
// ===========================

export interface CustomerKYC {
  id: string;
  customerId: string;
  kycType: KYCType;
  kycNumberMasked: string; // e.g., "XXXX-XXXX-1234"
  documentRef?: string; // URI or file path reference
  verifiedAt?: string;
  createdAt: string;
}

// ===========================
// SCHEMES & ACCOUNTS
// ===========================

export interface Scheme {
  id: string;
  branchId: string;
  name: string;
  frequency: SchemeFrequency;
  minAmount: number;
  penaltyPerDay: number;
  createdAt: string;
}

export interface Account {
  id: string;
  customerId: string;
  schemeId: string;
  accountNumber: string; // e.g., "ACCT-YYYY-0001"
  installmentAmount: number;
  currentBalance: number; // cached from ledger
  status: AccountStatus;
  openedAt: string;
  closedAt?: string;
}

// ===========================
// DELEGATION
// ===========================

export interface Delegation {
  id: string;
  customerId: string;
  accountId?: string; // null means applies to all accounts of customer
  primaryAgentId: string;
  secondaryAgentId: string; // agent receiving the delegation
  startAt: string; // ISO timestamp
  endAt: string; // ISO timestamp
  maxAmountPerDay?: number;
  maxCollectionsPerDay?: number;
  status: DelegationStatus;
  createdBy: string; // user id or agent id
  createdAt: string;
  revokedAt?: string;
}

// ===========================
// COLLECTIONS & RECEIPTS
// ===========================

export interface ReceiptSeries {
  id: string;
  branchId: string;
  prefix: string; // e.g., "RCPT"
  year: number;
  currentNumber: number;
  updatedAt: string;
}

export interface Collection {
  id: string;
  branchId: string;
  customerId: string;
  accountId: string;
  primaryAgentId: string; // owner agent
  collectedByAgentId: string; // agent who collected (can differ if delegated)
  delegationId?: string;
  amount: number;
  penaltyAmount: number;
  mode: CollectionMode;
  receiptNo: string; // e.g., "RCPT-2025-0001"
  collectedAt: string; // ISO timestamp
  businessDate: string; // YYYY-MM-DD in branch timezone
  gpsLat?: number;
  gpsLng?: number;
  status: CollectionStatus;
  idempotencyKey: string; // unique per device per transaction
  createdAt: string;
  reversedAt?: string;
}

// ===========================
// LEDGER (IMMUTABLE)
// ===========================

export interface LedgerEntry {
  id: string;
  accountId: string;
  collectionId?: string; // null for adjustments
  entryType: LedgerType;
  amount: number; // positive for credit/penalty, negative for reversal
  narration: string;
  postedAt: string; // ISO timestamp
  createdAt: string;
}

// ===========================
// SETTLEMENT
// ===========================

export interface Settlement {
  id: string;
  agentId: string;
  branchId: string;
  businessDate: string; // YYYY-MM-DD
  cashTotal: number;
  upiTotal: number;
  totalCollection: number;
  cashInHand: number;
  variance: number; // cashInHand - cashTotal
  notes?: string;
  status: SettlementStatus;
  submittedAt?: string;
  reviewedBy?: string; // user id
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===========================
// OFFLINE SYNC QUEUE
// ===========================

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  action: SyncAction;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  lastAttemptAt?: string;
  nextRetryAt?: string; // ISO timestamp for exponential backoff
  payload: Record<string, any>; // JSON snapshot of entity to sync
  createdAt: string;
  updatedAt: string;
}

// ===========================
// AUDIT
// ===========================

export interface AuditLog {
  id: string;
  actorUserId?: string;
  actorAgentId?: string;
  action: string; // e.g., "CREATE_CUSTOMER", "COLLECT_DEPOSIT"
  entityType: string; // e.g., "CUSTOMER", "COLLECTION"
  entityId: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  createdAt: string;
}

// ===========================
// SETTINGS
// ===========================

export interface BranchSettings {
  branchId: string;
  timezone: string;
  allowBackdateDays: number; // 0 means no backdate
  receiptPrefix: string;
  currency: string; // e.g., "INR"
  updatedAt: string;
}

// ===========================
// STORAGE METADATA
// ===========================

export interface StorageMetadata {
  version: number;
  lastMigrationAt?: string;
  createdAt: string;
  updatedAt: string;
}


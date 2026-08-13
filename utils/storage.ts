/**
 * Storage Adapter with Versioning and Migrations
 * Provides safe AsyncStorage operations with schema versioning
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Customer,
  Account,
  Collection,
  LedgerEntry,
  Delegation,
  Settlement,
  SyncQueueItem,
  AuditLog,
  Route,
  Agent,
  Branch,
  Scheme,
  CustomerKYC,
  BranchSettings,
  StorageMetadata,
} from '@/types';

// ===========================
// STORAGE KEYS
// ===========================

export const STORAGE_KEYS = {
  // Metadata
  METADATA: '@pigmy/metadata',
  
  // Entity stores (normalized by ID)
  BRANCHES: '@pigmy/branches',
  AGENTS: '@pigmy/agents',
  ROUTES: '@pigmy/routes',
  SCHEMES: '@pigmy/schemes',
  CUSTOMERS: '@pigmy/customers',
  ACCOUNTS: '@pigmy/accounts',
  COLLECTIONS: '@pigmy/collections',
  LEDGER_ENTRIES: '@pigmy/ledger_entries',
  DELEGATIONS: '@pigmy/delegations',
  SETTLEMENTS: '@pigmy/settlements',
  KYC_DOCS: '@pigmy/kyc_docs',
  
  // Ordered ID arrays (for list rendering)
  CUSTOMER_IDS: '@pigmy/customer_ids',
  COLLECTION_IDS: '@pigmy/collection_ids',
  DELEGATION_IDS: '@pigmy/delegation_ids',
  SETTLEMENT_IDS: '@pigmy/settlement_ids',
  
  // Sync queue
  SYNC_QUEUE: '@pigmy/sync_queue',
  SYNC_QUEUE_IDS: '@pigmy/sync_queue_ids',
  
  // Audit
  AUDIT_LOGS: '@pigmy/audit_logs',
  AUDIT_LOG_IDS: '@pigmy/audit_log_ids',
  
  // Settings
  SETTINGS: '@pigmy/settings',
  
  // Receipt series counters
  RECEIPT_SERIES: '@pigmy/receipt_series',
  
  // Session
  SESSION: '@pigmy/session',
} as const;

export const CURRENT_STORAGE_VERSION = 2;

/** Seed payload version tracked on StorageMetadata to prevent duplicate seeding */
export const CURRENT_SEED_VERSION = 2;

// ===========================
// STORAGE INTERFACES
// ===========================

export interface NormalizedStore<T> {
  byId: Record<string, T>;
  allIds: string[];
}

export interface SessionData {
  agentId?: string;
  branchId?: string;
  deviceFingerprint?: string;
  loggedInAt?: string;
  mpinHash?: string; // Hashed MPIN for verification
  mpinSetAt?: string; // When MPIN was set
}

// ===========================
// SAFE STORAGE OPERATIONS
// ===========================

/**
 * Safely get an item from AsyncStorage with error handling
 */
export async function getItemSafe<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[Storage] Error reading key "${key}":`, error);
    // Log to audit if available
    return fallback;
  }
}

/**
 * Safely set an item in AsyncStorage with error handling
 */
export async function setItemSafe<T>(key: string, value: T): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[Storage] Error writing key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from AsyncStorage
 */
export async function removeItemSafe(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing key "${key}":`, error);
    return false;
  }
}

/**
 * Get multiple items in parallel (optimized)
 */
export async function getMultipleItemsSafe(keys: string[]): Promise<Record<string, any>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, any> = {};
    
    for (const [key, value] of pairs) {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value);
        } catch (parseError) {
          console.error(`[Storage] Error parsing key "${key}":`, parseError);
          result[key] = null;
        }
      } else {
        result[key] = null;
      }
    }
    
    return result;
  } catch (error) {
    console.error('[Storage] Error in multiGet:', error);
    return {};
  }
}

/**
 * Set multiple items in parallel (optimized)
 */
export async function setMultipleItemsSafe(keyValuePairs: Array<[string, any]>): Promise<boolean> {
  try {
    const serializedPairs: Array<[string, string]> = keyValuePairs.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(serializedPairs);
    return true;
  } catch (error) {
    console.error('[Storage] Error in multiSet:', error);
    return false;
  }
}

// ===========================
// STORAGE VERSIONING & MIGRATIONS
// ===========================

/**
 * Initialize storage metadata
 */
export async function initializeStorage(): Promise<StorageMetadata> {
  const metadata = await getItemSafe<StorageMetadata | null>(STORAGE_KEYS.METADATA, null);
  
  if (!metadata) {
    // First time initialization
    const newMetadata: StorageMetadata = {
      version: CURRENT_STORAGE_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setItemSafe(STORAGE_KEYS.METADATA, newMetadata);
    return newMetadata;
  }
  
  // Check if migration needed
  if (metadata.version < CURRENT_STORAGE_VERSION) {
    await migrateStorage(metadata.version, CURRENT_STORAGE_VERSION);
    metadata.version = CURRENT_STORAGE_VERSION;
    metadata.lastMigrationAt = new Date().toISOString();
    metadata.updatedAt = new Date().toISOString();
    await setItemSafe(STORAGE_KEYS.METADATA, metadata);
  }
  
  return metadata;
}

/**
 * Whether baseline seed data has already been applied for the current seed version.
 * Reuses StorageMetadata — does not introduce a second init/versioning system.
 */
export async function hasCompletedSeed(
  seedVersion: number = CURRENT_SEED_VERSION,
): Promise<boolean> {
  const metadata = await getItemSafe<StorageMetadata | null>(STORAGE_KEYS.METADATA, null);
  return metadata?.seedVersion === seedVersion && Boolean(metadata.seededAt);
}

/**
 * Mark seed as completed on StorageMetadata after a successful seedDummyData run.
 */
export async function markSeedCompleted(
  seedVersion: number = CURRENT_SEED_VERSION,
): Promise<boolean> {
  const metadata = await getItemSafe<StorageMetadata | null>(STORAGE_KEYS.METADATA, null);
  const now = new Date().toISOString();

  const next: StorageMetadata = metadata
    ? {
        ...metadata,
        seedVersion,
        seededAt: now,
        updatedAt: now,
      }
    : {
        version: CURRENT_STORAGE_VERSION,
        createdAt: now,
        updatedAt: now,
        seedVersion,
        seededAt: now,
      };

  return setItemSafe(STORAGE_KEYS.METADATA, next);
}

/**
 * Run migrations from oldVersion to newVersion
 */
async function migrateStorage(oldVersion: number, newVersion: number): Promise<void> {
  console.log(`[Storage] Migrating from v${oldVersion} to v${newVersion}`);
  
  // Run migrations sequentially
  for (let version = oldVersion; version < newVersion; version++) {
    switch (version) {
      case 1:
        await migrateV1ToV2();
        break;
      // Add more migration cases as needed
      default:
        console.warn(`[Storage] No migration defined for v${version} to v${version + 1}`);
    }
  }
  
  console.log('[Storage] Migration completed');
}

/**
 * v1 → v2: add Scheme.penaltyType default (NONE) for existing persisted schemes.
 */
async function migrateV1ToV2(): Promise<void> {
  const schemes = await getItemSafe<NormalizedStore<any> | null>(STORAGE_KEYS.SCHEMES, null);
  if (!schemes?.byId) {
    return;
  }

  let changed = false;
  for (const id of Object.keys(schemes.byId)) {
    const scheme = schemes.byId[id];
    if (scheme && scheme.penaltyType == null) {
      schemes.byId[id] = {
        ...scheme,
        penaltyType: 'NONE',
      };
      changed = true;
    }
  }

  if (changed) {
    await setItemSafe(STORAGE_KEYS.SCHEMES, schemes);
  }
}

// ===========================
// NORMALIZED STORE HELPERS
// ===========================

/**
 * Create an empty normalized store
 */
export function createEmptyStore<T>(): NormalizedStore<T> {
  return {
    byId: {},
    allIds: [],
  };
}

/**
 * Add an entity to a normalized store
 */
export function addEntityToStore<T extends { id: string }>(
  store: NormalizedStore<T>,
  entity: T
): NormalizedStore<T> {
  return {
    byId: {
      ...store.byId,
      [entity.id]: entity,
    },
    allIds: store.allIds.includes(entity.id) ? store.allIds : [...store.allIds, entity.id],
  };
}

/**
 * Update an entity in a normalized store
 */
export function updateEntityInStore<T extends { id: string }>(
  store: NormalizedStore<T>,
  id: string,
  updates: Partial<T>
): NormalizedStore<T> {
  const existing = store.byId[id];
  if (!existing) {
    return store;
  }
  
  return {
    ...store,
    byId: {
      ...store.byId,
      [id]: {
        ...existing,
        ...updates,
      },
    },
  };
}

/**
 * Remove an entity from a normalized store
 */
export function removeEntityFromStore<T extends { id: string }>(
  store: NormalizedStore<T>,
  id: string
): NormalizedStore<T> {
  const { [id]: removed, ...restById } = store.byId;
  return {
    byId: restById,
    allIds: store.allIds.filter(itemId => itemId !== id),
  };
}

/**
 * Get entities as array from normalized store
 */
export function getEntitiesArray<T>(store: NormalizedStore<T>): T[] {
  return store.allIds.map(id => store.byId[id]).filter(Boolean);
}

// ===========================
// CLEAR OPERATIONS
// ===========================

/**
 * Clear all session data (on logout)
 */
export async function clearSessionData(): Promise<void> {
  await removeItemSafe(STORAGE_KEYS.SESSION);
}

/**
 * Clear all data except sync queue (for fresh start)
 */
export async function clearAllDataExceptQueue(): Promise<void> {
  const keysToRemove = [
    STORAGE_KEYS.BRANCHES,
    STORAGE_KEYS.AGENTS,
    STORAGE_KEYS.ROUTES,
    STORAGE_KEYS.SCHEMES,
    STORAGE_KEYS.CUSTOMERS,
    STORAGE_KEYS.ACCOUNTS,
    STORAGE_KEYS.COLLECTIONS,
    STORAGE_KEYS.LEDGER_ENTRIES,
    STORAGE_KEYS.DELEGATIONS,
    STORAGE_KEYS.SETTLEMENTS,
    STORAGE_KEYS.KYC_DOCS,
    STORAGE_KEYS.CUSTOMER_IDS,
    STORAGE_KEYS.COLLECTION_IDS,
    STORAGE_KEYS.DELEGATION_IDS,
    STORAGE_KEYS.SETTLEMENT_IDS,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.RECEIPT_SERIES,
    STORAGE_KEYS.SESSION,
    // Note: SYNC_QUEUE and AUDIT_LOGS are preserved
  ];
  
  await AsyncStorage.multiRemove(keysToRemove);
}

/**
 * Nuclear option: clear everything including queue
 */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
  await initializeStorage();
}

// ===========================
// EXPORTS
// ===========================

export default {
  getItemSafe,
  setItemSafe,
  removeItemSafe,
  getMultipleItemsSafe,
  setMultipleItemsSafe,
  initializeStorage,
  hasCompletedSeed,
  markSeedCompleted,
  createEmptyStore,
  addEntityToStore,
  updateEntityInStore,
  removeEntityFromStore,
  getEntitiesArray,
  clearSessionData,
  clearAllDataExceptQueue,
  clearAllData,
  STORAGE_KEYS,
  CURRENT_STORAGE_VERSION,
  CURRENT_SEED_VERSION,
};


/**
 * Collections Slice
 * Manages collection/receipt data and operations (core business logic)
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Collection, CollectionMode, CollectionStatus } from '@/types';
import {
  STORAGE_KEYS,
  getItemSafe,
  setItemSafe,
  createEmptyStore,
  addEntityToStore,
  updateEntityInStore,
  getEntitiesArray,
  type NormalizedStore,
} from '@/utils/storage';
import {
  generateReceiptNumber,
  getBusinessDate,
  generateIdempotencyKey,
} from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface ReceiptSeries {
  prefix: string;
  year: number;
  currentNumber: number;
}

export interface CollectionsState {
  collections: NormalizedStore<Collection>;
  receiptSeries: ReceiptSeries;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: CollectionsState = {
  collections: createEmptyStore<Collection>(),
  receiptSeries: {
    prefix: 'RCPT',
    year: new Date().getFullYear(),
    currentNumber: 0,
  },
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate collections from storage
 */
export const hydrateCollections = createAsyncThunk(
  'collections/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const collections = await getItemSafe<NormalizedStore<Collection>>(
        STORAGE_KEYS.COLLECTIONS,
        createEmptyStore<Collection>()
      );
      
      const receiptSeries = await getItemSafe<ReceiptSeries>(STORAGE_KEYS.RECEIPT_SERIES, {
        prefix: 'RCPT',
        year: new Date().getFullYear(),
        currentNumber: 0,
      });
      
      // Auto-update receipt series for new year
      const currentYear = new Date().getFullYear();
      if (receiptSeries.year !== currentYear) {
        receiptSeries.year = currentYear;
        receiptSeries.currentNumber = 0;
      }
      
      return { collections, receiptSeries };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate collections');
    }
  }
);

/**
 * Persist collections to storage
 */
export const persistCollections = createAsyncThunk(
  'collections/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { collections, receiptSeries } = state.collections;
      
      await setItemSafe(STORAGE_KEYS.COLLECTIONS, collections);
      await setItemSafe(STORAGE_KEYS.RECEIPT_SERIES, receiptSeries);
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist collections');
    }
  }
);

// ===========================
// SLICE
// ===========================

export interface CreateCollectionPayload {
  branchId: string;
  customerId: string;
  accountId: string;
  primaryAgentId: string;
  collectedByAgentId: string;
  delegationId?: string;
  amount: number;
  penaltyAmount: number;
  mode: CollectionMode;
  collectedAt: string; // ISO timestamp
  timezone: string; // Branch timezone
  deviceFingerprint: string;
  gpsLat?: number;
  gpsLng?: number;
}

const slice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    /**
     * Create a new collection
     * Generates receipt number and idempotency key
     */
    createCollection: (state, { payload }: PayloadAction<CreateCollectionPayload>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      // Generate receipt number
      const { receiptNo, nextNumber } = generateReceiptNumber(state.receiptSeries);
      state.receiptSeries.currentNumber = nextNumber;
      
      // Generate business date from collected timestamp
      const businessDate = getBusinessDate(payload.collectedAt, payload.timezone);
      
      // Generate idempotency key
      const idempotencyKey = generateIdempotencyKey(
        payload.deviceFingerprint,
        payload.accountId,
        payload.collectedAt
      );
      
      const collection: Collection = {
        id,
        branchId: payload.branchId,
        customerId: payload.customerId,
        accountId: payload.accountId,
        primaryAgentId: payload.primaryAgentId,
        collectedByAgentId: payload.collectedByAgentId,
        delegationId: payload.delegationId,
        amount: payload.amount,
        penaltyAmount: payload.penaltyAmount,
        mode: payload.mode,
        receiptNo,
        collectedAt: payload.collectedAt,
        businessDate,
        gpsLat: payload.gpsLat,
        gpsLng: payload.gpsLng,
        status: 'CREATED',
        idempotencyKey,
        createdAt: now,
      };
      
      state.collections = addEntityToStore(state.collections, collection);
      state.error = undefined;
    },
    
    /**
     * Reverse a collection
     * Does not delete, marks as REVERSED
     */
    reverseCollection: (state, { payload }: PayloadAction<string>) => {
      const now = new Date().toISOString();
      state.collections = updateEntityInStore(state.collections, payload, {
        status: 'REVERSED',
        reversedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Update collection status
     */
    updateCollectionStatus: (
      state,
      { payload }: PayloadAction<{ id: string; status: CollectionStatus }>
    ) => {
      state.collections = updateEntityInStore(state.collections, payload.id, {
        status: payload.status,
      });
      state.error = undefined;
    },
    
    /**
     * Set error
     */
    setError: (state, { payload }: PayloadAction<string>) => {
      state.error = payload;
    },
    
    /**
     * Clear error
     */
    clearError: state => {
      state.error = undefined;
    },
    
    /**
     * Reset collections state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateCollections.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateCollections.fulfilled, (state, { payload }) => {
      state.collections = payload.collections;
      state.receiptSeries = payload.receiptSeries;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateCollections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistCollections.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistCollections.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistCollections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Base selector - get collections store
 */
const selectCollectionsStore = (state: State) => state.collections.collections;

/**
 * Get all collections as array (memoized)
 */
export const selectAllCollections = createSelector(
  [selectCollectionsStore],
  (collections) => getEntitiesArray(collections)
);

/**
 * Get collection by ID
 */
export const selectCollectionById = (state: State, id: string): Collection | undefined => {
  return state.collections.collections.byId[id];
};

/**
 * Get collections by account (memoized)
 */
export const selectCollectionsByAccount = createSelector(
  [selectAllCollections, (_state: State, accountId: string) => accountId],
  (collections, accountId) =>
    collections
      .filter(c => c.accountId === accountId)
      .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
);

/**
 * Get collections by customer (memoized)
 */
export const selectCollectionsByCustomer = createSelector(
  [selectAllCollections, (_state: State, customerId: string) => customerId],
  (collections, customerId) =>
    collections
      .filter(c => c.customerId === customerId)
      .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
);

/**
 * Get collections by business date (memoized)
 */
export const selectCollectionsByBusinessDate = createSelector(
  [selectAllCollections, (_state: State, businessDate: string) => businessDate],
  (collections, businessDate) =>
    collections.filter(c => c.businessDate === businessDate)
);

/**
 * Get collections by agent and business date (memoized)
 */
export const selectCollectionsByAgentAndDate = createSelector(
  [
    selectAllCollections,
    (_state: State, agentId: string, _businessDate: string) => agentId,
    (_state: State, _agentId: string, businessDate: string) => businessDate,
  ],
  (collections, agentId, businessDate) =>
    collections.filter(
      c => c.collectedByAgentId === agentId && c.businessDate === businessDate
    )
);

/**
 * Get today's collections for agent (memoized)
 */
export const selectTodayCollectionsByAgent = createSelector(
  [
    selectAllCollections,
    (_state: State, agentId: string, _timezone: string) => agentId,
    (_state: State, _agentId: string, timezone: string) => timezone,
  ],
  (collections, agentId, timezone) => {
    const today = getBusinessDate(new Date().toISOString(), timezone);
    return collections.filter(
      c => c.collectedByAgentId === agentId && c.businessDate === today
    );
  }
);

/**
 * Get total collected today by agent (excluding reversed) (memoized)
 */
export const selectTotalCollectedToday = createSelector(
  [
    selectAllCollections,
    (_state: State, agentId: string, _timezone: string) => agentId,
    (_state: State, _agentId: string, timezone: string) => timezone,
  ],
  (collections, agentId, timezone) => {
    const today = getBusinessDate(new Date().toISOString(), timezone);
    return collections
      .filter(
        c =>
          c.collectedByAgentId === agentId &&
          c.businessDate === today &&
          c.status !== 'REVERSED'
      )
      .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  }
);

/**
 * Get collections needing sync (CREATED or FAILED status) (memoized)
 */
export const selectCollectionsNeedingSync = createSelector(
  [selectAllCollections],
  (collections) =>
    collections.filter(c => c.status === 'CREATED' || c.status === 'FAILED')
);

/**
 * Get collection by idempotency key (for duplicate check)
 */
export const selectCollectionByIdempotencyKey = createSelector(
  [selectAllCollections, (_state: State, idempotencyKey: string) => idempotencyKey],
  (collections, idempotencyKey) =>
    collections.find(c => c.idempotencyKey === idempotencyKey)
);

/**
 * Get delegated collections by delegation (memoized)
 */
export const selectCollectionsByDelegation = createSelector(
  [selectAllCollections, (_state: State, delegationId: string) => delegationId],
  (collections, delegationId) =>
    collections.filter(c => c.delegationId === delegationId)
);

/**
 * Get collection count for delegation on a specific date (memoized)
 */
export const selectDelegationCollectionCountForDate = createSelector(
  [
    selectAllCollections,
    (_state: State, delegationId: string, _businessDate: string) => delegationId,
    (_state: State, _delegationId: string, businessDate: string) => businessDate,
  ],
  (collections, delegationId, businessDate) =>
    collections.filter(
      c =>
        c.delegationId === delegationId &&
        c.businessDate === businessDate &&
        c.status !== 'REVERSED'
    ).length
);

/**
 * Get collection amount for delegation on a specific date (memoized)
 */
export const selectDelegationCollectionAmountForDate = createSelector(
  [
    selectAllCollections,
    (_state: State, delegationId: string, _businessDate: string) => delegationId,
    (_state: State, _delegationId: string, businessDate: string) => businessDate,
  ],
  (collections, delegationId, businessDate) =>
    collections
      .filter(
        c =>
          c.delegationId === delegationId &&
          c.businessDate === businessDate &&
          c.status !== 'REVERSED'
      )
      .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0)
);

// ===========================
// CUSTOM HOOK
// ===========================

export function useCollectionsSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.collections);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateCollections: () => dispatch(hydrateCollections()),
    persistCollections: () => dispatch(persistCollections()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  createCollection,
  reverseCollection,
  updateCollectionStatus,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;


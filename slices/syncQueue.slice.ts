/**
 * Sync Queue Slice
 * Manages offline sync queue for API synchronization
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { SyncQueueItem, SyncEntityType, SyncAction, SyncStatus } from '@/types';
import {
  STORAGE_KEYS,
  getItemSafe,
  setItemSafe,
  createEmptyStore,
  addEntityToStore,
  updateEntityInStore,
  removeEntityFromStore,
  getEntitiesArray,
  type NormalizedStore,
} from '@/utils/storage';
import { calculateNextRetryTime } from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface SyncQueueState {
  queue: NormalizedStore<SyncQueueItem>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: SyncQueueState = {
  queue: createEmptyStore<SyncQueueItem>(),
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate sync queue from storage
 */
export const hydrateSyncQueue = createAsyncThunk(
  'syncQueue/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const queue = await getItemSafe<NormalizedStore<SyncQueueItem>>(
        STORAGE_KEYS.SYNC_QUEUE,
        createEmptyStore<SyncQueueItem>()
      );
      
      return { queue };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate sync queue');
    }
  }
);

/**
 * Persist sync queue to storage
 */
export const persistSyncQueue = createAsyncThunk(
  'syncQueue/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { queue } = state.syncQueue;
      
      await setItemSafe(STORAGE_KEYS.SYNC_QUEUE, queue);
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist sync queue');
    }
  }
);

// ===========================
// SLICE
// ===========================

export interface EnqueueActionPayload {
  entityType: SyncEntityType;
  action: SyncAction;
  payload: Record<string, any>;
}

const slice = createSlice({
  name: 'syncQueue',
  initialState,
  reducers: {
    /**
     * Enqueue a new sync action
     */
    enqueueAction: (state, { payload }: PayloadAction<EnqueueActionPayload>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      const queueItem: SyncQueueItem = {
        id,
        entityType: payload.entityType,
        action: payload.action,
        status: 'PENDING',
        retryCount: 0,
        payload: payload.payload,
        createdAt: now,
        updatedAt: now,
      };
      
      state.queue = addEntityToStore(state.queue, queueItem);
      state.error = undefined;
    },
    
    /**
     * Mark sync item as failed with error message
     */
    markSyncFailed: (
      state,
      { payload }: PayloadAction<{ id: string; error: string }>
    ) => {
      const existing = state.queue.byId[payload.id];
      if (!existing) {
        state.error = 'Queue item not found';
        return;
      }
      
      const now = new Date().toISOString();
      const retryCount = existing.retryCount + 1;
      const nextRetryAt = calculateNextRetryTime(retryCount);
      
      state.queue = updateEntityInStore(state.queue, payload.id, {
        status: 'FAILED',
        retryCount,
        lastError: payload.error,
        lastAttemptAt: now,
        nextRetryAt,
        updatedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Mark sync item as done (successfully synced)
     */
    markSyncDone: (state, { payload }: PayloadAction<string>) => {
      const now = new Date().toISOString();
      state.queue = updateEntityInStore(state.queue, payload, {
        status: 'DONE',
        lastAttemptAt: now,
        updatedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Retry a failed sync item (reset to PENDING)
     */
    retrySync: (state, { payload }: PayloadAction<string>) => {
      const now = new Date().toISOString();
      state.queue = updateEntityInStore(state.queue, payload, {
        status: 'PENDING',
        lastError: undefined,
        nextRetryAt: undefined,
        updatedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Retry all failed items
     */
    retryAllFailed: state => {
      const now = new Date().toISOString();
      const failedItems = getEntitiesArray(state.queue).filter(item => item.status === 'FAILED');
      
      failedItems.forEach(item => {
        state.queue = updateEntityInStore(state.queue, item.id, {
          status: 'PENDING',
          lastError: undefined,
          nextRetryAt: undefined,
          updatedAt: now,
        });
      });
      state.error = undefined;
    },
    
    /**
     * Remove a queue item (use cautiously, typically only for DONE items)
     */
    removeQueueItem: (state, { payload }: PayloadAction<string>) => {
      state.queue = removeEntityFromStore(state.queue, payload);
      state.error = undefined;
    },
    
    /**
     * Clear all completed items from queue
     */
    clearCompleted: state => {
      const doneItems = getEntitiesArray(state.queue).filter(item => item.status === 'DONE');
      doneItems.forEach(item => {
        state.queue = removeEntityFromStore(state.queue, item.id);
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
     * Reset sync queue state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateSyncQueue.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateSyncQueue.fulfilled, (state, { payload }) => {
      state.queue = payload.queue;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateSyncQueue.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistSyncQueue.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistSyncQueue.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistSyncQueue.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Get all queue items as array
 */
export const selectAllQueueItems = (state: State): SyncQueueItem[] => {
  return getEntitiesArray(state.syncQueue.queue).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

/**
 * Get queue item by ID
 */
export const selectQueueItemById = (state: State, id: string): SyncQueueItem | undefined => {
  return state.syncQueue.queue.byId[id];
};

/**
 * Get pending queue items
 */
export const selectPendingQueueItems = (state: State): SyncQueueItem[] => {
  return getEntitiesArray(state.syncQueue.queue)
    .filter(item => item.status === 'PENDING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

/**
 * Get failed queue items
 */
export const selectFailedQueueItems = (state: State): SyncQueueItem[] => {
  return getEntitiesArray(state.syncQueue.queue)
    .filter(item => item.status === 'FAILED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

/**
 * Get queue items ready for retry (failed items past their nextRetryAt)
 */
export const selectRetryableQueueItems = (state: State): SyncQueueItem[] => {
  const now = new Date().toISOString();
  return getEntitiesArray(state.syncQueue.queue).filter(
    item =>
      item.status === 'FAILED' &&
      item.nextRetryAt &&
      item.nextRetryAt <= now
  );
};

/**
 * Get queue items by entity type
 */
export const selectQueueItemsByEntityType = (
  state: State,
  entityType: SyncEntityType
): SyncQueueItem[] => {
  return getEntitiesArray(state.syncQueue.queue)
    .filter(item => item.entityType === entityType)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

/**
 * Get sync status summary
 */
export const selectSyncStatusSummary = (state: State) => {
  const allItems = getEntitiesArray(state.syncQueue.queue);
  
  const pending = allItems.filter(item => item.status === 'PENDING').length;
  const failed = allItems.filter(item => item.status === 'FAILED').length;
  const done = allItems.filter(item => item.status === 'DONE').length;
  
  // Calculate total amount from collection items
  const totalAmount = allItems
    .filter(item => item.entityType === 'COLLECTION' && item.status === 'PENDING')
    .reduce((sum, item) => {
      const amount = item.payload.amount || 0;
      const penalty = item.payload.penaltyAmount || 0;
      return sum + amount + penalty;
    }, 0);
  
  return {
    pendingCount: pending,
    failedCount: failed,
    doneCount: done,
    totalCount: allItems.length,
    totalAmount,
  };
};

/**
 * Check if sync is needed
 */
export const selectNeedsSyncQueue = (state: State): boolean => {
  return getEntitiesArray(state.syncQueue.queue).some(
    item => item.status === 'PENDING' || item.status === 'FAILED'
  );
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useSyncQueueSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.syncQueue);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateSyncQueue: () => dispatch(hydrateSyncQueue()),
    persistSyncQueue: () => dispatch(persistSyncQueue()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  enqueueAction,
  markSyncFailed,
  markSyncDone,
  retrySync,
  retryAllFailed,
  removeQueueItem,
  clearCompleted,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;


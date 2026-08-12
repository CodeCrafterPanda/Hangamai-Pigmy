/**
 * Delegations Slice
 * Manages delegation data and operations (temporary agent assignments)
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Delegation, DelegationStatus } from '@/types';
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
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface DelegationsState {
  delegations: NormalizedStore<Delegation>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: DelegationsState = {
  delegations: createEmptyStore<Delegation>(),
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate delegations from storage
 */
export const hydrateDelegations = createAsyncThunk(
  'delegations/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const delegations = await getItemSafe<NormalizedStore<Delegation>>(
        STORAGE_KEYS.DELEGATIONS,
        createEmptyStore<Delegation>()
      );
      
      return { delegations };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate delegations');
    }
  }
);

/**
 * Persist delegations to storage
 */
export const persistDelegations = createAsyncThunk(
  'delegations/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { delegations } = state.delegations;
      
      // setItemSafe swallows the write error and reports false, so the caller can only
      // learn that a delegation change never reached storage if we reject here.
      const persisted = await setItemSafe(STORAGE_KEYS.DELEGATIONS, delegations);
      if (!persisted) {
        return rejectWithValue('Failed to persist delegations to device storage');
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist delegations');
    }
  }
);

// ===========================
// SLICE
// ===========================

const slice = createSlice({
  name: 'delegations',
  initialState,
  reducers: {
    /**
     * Create a new delegation
     * Validates no conflicting delegations exist
     */
    createDelegation: (
      state,
      { payload }: PayloadAction<Omit<Delegation, 'id' | 'createdAt' | 'status'>>
    ) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      const delegation: Delegation = {
        ...payload,
        id,
        status: 'ACTIVE',
        createdAt: now,
      };
      
      state.delegations = addEntityToStore(state.delegations, delegation);
      state.error = undefined;
    },
    
    /**
     * Revoke a delegation
     */
    revokeDelegation: (state, { payload }: PayloadAction<string>) => {
      const now = new Date().toISOString();
      state.delegations = updateEntityInStore(state.delegations, payload, {
        status: 'REVOKED',
        revokedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Update delegation status (used for auto-expiry)
     */
    updateDelegationStatus: (
      state,
      { payload }: PayloadAction<{ id: string; status: DelegationStatus }>
    ) => {
      state.delegations = updateEntityInStore(state.delegations, payload.id, {
        status: payload.status,
      });
      state.error = undefined;
    },
    
    /**
     * Check and expire delegations past their endAt time
     */
    expireOverdueDelegations: state => {
      const now = new Date().toISOString();
      const allDelegations = getEntitiesArray(state.delegations);
      
      allDelegations.forEach(delegation => {
        if (delegation.status === 'ACTIVE' && delegation.endAt < now) {
          state.delegations = updateEntityInStore(state.delegations, delegation.id, {
            status: 'EXPIRED',
          });
        }
      });
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
     * Reset delegations state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateDelegations.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateDelegations.fulfilled, (state, { payload }) => {
      state.delegations = payload.delegations;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateDelegations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistDelegations.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistDelegations.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistDelegations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Base selector - get delegations store
 */
const selectDelegationsStore = (state: State) => state.delegations.delegations;

/**
 * Get all delegations as array (memoized)
 */
export const selectAllDelegations = createSelector(
  [selectDelegationsStore],
  (delegations) => getEntitiesArray(delegations)
);

/**
 * Get delegation by ID
 */
export const selectDelegationById = (state: State, id: string): Delegation | undefined => {
  return state.delegations.delegations.byId[id];
};

/**
 * Get active delegations (memoized)
 */
export const selectActiveDelegations = createSelector([selectAllDelegations], (delegations) => {
  const now = new Date().toISOString();
  return delegations.filter(d => d.status === 'ACTIVE' && d.startAt <= now && d.endAt >= now);
});

/**
 * Get delegations for a customer (memoized)
 */
export const selectDelegationsByCustomer = createSelector(
  [selectAllDelegations, (_state: State, customerId: string) => customerId],
  (delegations, customerId) => delegations.filter(d => d.customerId === customerId)
);

/**
 * Get active delegations for a customer (memoized)
 */
export const selectActiveDelegationsByCustomer = createSelector(
  [selectAllDelegations, (_state: State, customerId: string) => customerId],
  (delegations, customerId) => {
    const now = new Date().toISOString();
    return delegations.filter(
      d =>
        d.customerId === customerId &&
        d.status === 'ACTIVE' &&
        d.startAt <= now &&
        d.endAt >= now
    );
  }
);

/**
 * Get delegations assigned to a secondary agent (memoized)
 */
export const selectDelegationsBySecondaryAgent = createSelector(
  [selectAllDelegations, (_state: State, agentId: string) => agentId],
  (delegations, agentId) => {
    const now = new Date().toISOString();
    return delegations.filter(
      d =>
        d.secondaryAgentId === agentId &&
        d.status === 'ACTIVE' &&
        d.startAt <= now &&
        d.endAt >= now
    );
  }
);

/**
 * Check for conflicting delegations
 * Returns conflicting delegation if found
 */
export const selectConflictingDelegation = (
  state: State,
  customerId: string,
  accountId: string | undefined,
  secondaryAgentId: string,
  startAt: string,
  endAt: string
): Delegation | undefined => {
  return getEntitiesArray(state.delegations.delegations).find(d => {
    // Skip revoked/expired
    if (d.status !== 'ACTIVE') return false;
    
    // Check customer match
    if (d.customerId !== customerId) return false;
    
    // Check account match
    // If either is null, it applies to all accounts - conflict
    // If both are specific, they must match to conflict
    if (d.accountId === null || accountId === undefined) {
      // One or both apply to all accounts - conflict
    } else if (d.accountId !== accountId) {
      // Different specific accounts - no conflict
      return false;
    }
    
    // Check agent match
    if (d.secondaryAgentId !== secondaryAgentId) return false;
    
    // Check time overlap
    const existingStart = new Date(d.startAt).getTime();
    const existingEnd = new Date(d.endAt).getTime();
    const newStart = new Date(startAt).getTime();
    const newEnd = new Date(endAt).getTime();
    
    // Check if time ranges overlap
    const overlap = newStart <= existingEnd && newEnd >= existingStart;
    
    return overlap;
  });
};

/**
 * Get applicable delegation for collection
 */
export const selectApplicableDelegation = (
  state: State,
  customerId: string,
  accountId: string,
  secondaryAgentId: string,
  currentTimestamp: string
): Delegation | undefined => {
  const now = new Date(currentTimestamp).getTime();
  
  return getEntitiesArray(state.delegations.delegations).find(d => {
    // Check status
    if (d.status !== 'ACTIVE') return false;
    
    // Check customer
    if (d.customerId !== customerId) return false;
    
    // Check account (null means all accounts)
    if (d.accountId && d.accountId !== accountId) return false;
    
    // Check agent
    if (d.secondaryAgentId !== secondaryAgentId) return false;
    
    // Check time window
    const start = new Date(d.startAt).getTime();
    const end = new Date(d.endAt).getTime();
    
    return now >= start && now <= end;
  });
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useDelegationsSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.delegations);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateDelegations: () => dispatch(hydrateDelegations()),
    persistDelegations: () => dispatch(persistDelegations()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  createDelegation,
  revokeDelegation,
  updateDelegationStatus,
  expireOverdueDelegations,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;


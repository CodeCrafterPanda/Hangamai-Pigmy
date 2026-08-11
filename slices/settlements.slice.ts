/**
 * Settlements Slice
 * Manages end-of-day settlement/day closure data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Settlement, SettlementStatus } from '@/types';
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
import { calculateVariance } from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface SettlementsState {
  settlements: NormalizedStore<Settlement>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: SettlementsState = {
  settlements: createEmptyStore<Settlement>(),
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate settlements from storage
 */
export const hydrateSettlements = createAsyncThunk(
  'settlements/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const settlements = await getItemSafe<NormalizedStore<Settlement>>(
        STORAGE_KEYS.SETTLEMENTS,
        createEmptyStore<Settlement>()
      );
      
      return { settlements };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate settlements');
    }
  }
);

/**
 * Persist settlements to storage
 */
export const persistSettlements = createAsyncThunk(
  'settlements/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { settlements } = state.settlements;
      
      await setItemSafe(STORAGE_KEYS.SETTLEMENTS, settlements);
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist settlements');
    }
  }
);

// ===========================
// SLICE
// ===========================

export interface CreateSettlementPayload {
  agentId: string;
  branchId: string;
  businessDate: string;
  cashTotal: number;
  upiTotal: number;
  totalCollection: number;
  cashInHand: number;
  notes?: string;
}

const slice = createSlice({
  name: 'settlements',
  initialState,
  reducers: {
    /**
     * Create a new settlement (day closure)
     */
    createSettlement: (state, { payload }: PayloadAction<CreateSettlementPayload>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      // Calculate variance
      const variance = calculateVariance(payload.cashInHand, payload.cashTotal);
      
      const settlement: Settlement = {
        id,
        agentId: payload.agentId,
        branchId: payload.branchId,
        businessDate: payload.businessDate,
        cashTotal: payload.cashTotal,
        upiTotal: payload.upiTotal,
        totalCollection: payload.totalCollection,
        cashInHand: payload.cashInHand,
        variance,
        notes: payload.notes,
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      };
      
      state.settlements = addEntityToStore(state.settlements, settlement);
      state.error = undefined;
    },
    
    /**
     * Update settlement (only allowed in DRAFT status)
     */
    updateSettlement: (
      state,
      { payload }: PayloadAction<{ id: string; updates: Partial<CreateSettlementPayload> }>
    ) => {
      const { id, updates } = payload;
      const existing = state.settlements.byId[id];
      
      if (!existing) {
        state.error = 'Settlement not found';
        return;
      }
      
      if (existing.status !== 'DRAFT') {
        state.error = 'Cannot update submitted settlement';
        return;
      }
      
      // Recalculate variance if cash values changed
      const cashInHand = updates.cashInHand ?? existing.cashInHand;
      const cashTotal = updates.cashTotal ?? existing.cashTotal;
      const variance = calculateVariance(cashInHand, cashTotal);
      
      state.settlements = updateEntityInStore(state.settlements, id, {
        ...updates,
        variance,
        updatedAt: new Date().toISOString(),
      });
      state.error = undefined;
    },
    
    /**
     * Submit settlement (lock for review)
     */
    submitSettlement: (state, { payload }: PayloadAction<string>) => {
      const now = new Date().toISOString();
      const existing = state.settlements.byId[payload];
      
      if (!existing) {
        state.error = 'Settlement not found';
        return;
      }
      
      if (existing.status !== 'DRAFT') {
        state.error = 'Settlement already submitted';
        return;
      }
      
      // Validate: if variance != 0, notes required
      if (existing.variance !== 0 && !existing.notes) {
        state.error = 'Notes required when variance is not zero';
        return;
      }
      
      state.settlements = updateEntityInStore(state.settlements, payload, {
        status: 'SUBMITTED',
        submittedAt: now,
        updatedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Approve settlement (admin action, will be used later)
     */
    approveSettlement: (
      state,
      { payload }: PayloadAction<{ id: string; reviewedBy: string }>
    ) => {
      const now = new Date().toISOString();
      state.settlements = updateEntityInStore(state.settlements, payload.id, {
        status: 'APPROVED',
        reviewedBy: payload.reviewedBy,
        reviewedAt: now,
        updatedAt: now,
      });
      state.error = undefined;
    },
    
    /**
     * Reject settlement (admin action, will be used later)
     */
    rejectSettlement: (
      state,
      { payload }: PayloadAction<{ id: string; reviewedBy: string; notes: string }>
    ) => {
      const now = new Date().toISOString();
      state.settlements = updateEntityInStore(state.settlements, payload.id, {
        status: 'REJECTED',
        reviewedBy: payload.reviewedBy,
        reviewedAt: now,
        notes: payload.notes,
        updatedAt: now,
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
     * Reset settlements state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateSettlements.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateSettlements.fulfilled, (state, { payload }) => {
      state.settlements = payload.settlements;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateSettlements.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistSettlements.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistSettlements.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistSettlements.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Get all settlements as array
 */
export const selectAllSettlements = (state: State): Settlement[] => {
  return getEntitiesArray(state.settlements.settlements).sort(
    (a, b) => b.businessDate.localeCompare(a.businessDate)
  );
};

/**
 * Get settlement by ID
 */
export const selectSettlementById = (state: State, id: string): Settlement | undefined => {
  return state.settlements.settlements.byId[id];
};

/**
 * Get settlements by agent
 */
export const selectSettlementsByAgent = (state: State, agentId: string): Settlement[] => {
  return getEntitiesArray(state.settlements.settlements)
    .filter(s => s.agentId === agentId)
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate));
};

/**
 * Get settlement by agent and business date
 */
export const selectSettlementByAgentAndDate = (
  state: State,
  agentId: string,
  businessDate: string
): Settlement | undefined => {
  return getEntitiesArray(state.settlements.settlements).find(
    s => s.agentId === agentId && s.businessDate === businessDate
  );
};

/**
 * Check if settlement exists for date
 */
export const selectHasSettlementForDate = (
  state: State,
  agentId: string,
  businessDate: string
): boolean => {
  return !!selectSettlementByAgentAndDate(state, agentId, businessDate);
};

/**
 * Get pending settlements (DRAFT or SUBMITTED)
 */
export const selectPendingSettlements = (state: State): Settlement[] => {
  return getEntitiesArray(state.settlements.settlements)
    .filter(s => s.status === 'DRAFT' || s.status === 'SUBMITTED')
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate));
};

/**
 * Get settlements with variance
 */
export const selectSettlementsWithVariance = (state: State): Settlement[] => {
  return getEntitiesArray(state.settlements.settlements)
    .filter(s => s.variance !== 0)
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate));
};

/**
 * Get settlements by status
 */
export const selectSettlementsByStatus = (
  state: State,
  status: SettlementStatus
): Settlement[] => {
  return getEntitiesArray(state.settlements.settlements)
    .filter(s => s.status === status)
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate));
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useSettlementsSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.settlements);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateSettlements: () => dispatch(hydrateSettlements()),
    persistSettlements: () => dispatch(persistSettlements()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  createSettlement,
  updateSettlement,
  submitSettlement,
  approveSettlement,
  rejectSettlement,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;


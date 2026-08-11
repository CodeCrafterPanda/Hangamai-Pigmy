/**
 * Ledger Slice
 * Manages ledger entries (immutable accounting records)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { LedgerEntry } from '@/types';
import {
  STORAGE_KEYS,
  getItemSafe,
  setItemSafe,
  createEmptyStore,
  addEntityToStore,
  getEntitiesArray,
  type NormalizedStore,
} from '@/utils/storage';
import { calculateAccountBalance } from '@/utils/businessLogic';

// ===========================
// STATE INTERFACE
// ===========================

export interface LedgerState {
  ledgerEntries: NormalizedStore<LedgerEntry>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: LedgerState = {
  ledgerEntries: createEmptyStore<LedgerEntry>(),
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate ledger from storage
 */
export const hydrateLedger = createAsyncThunk(
  'ledger/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const ledgerEntries = await getItemSafe<NormalizedStore<LedgerEntry>>(
        STORAGE_KEYS.LEDGER_ENTRIES,
        createEmptyStore<LedgerEntry>()
      );
      
      return { ledgerEntries };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate ledger');
    }
  }
);

/**
 * Persist ledger to storage
 */
export const persistLedger = createAsyncThunk(
  'ledger/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { ledgerEntries } = state.ledger;
      
      await setItemSafe(STORAGE_KEYS.LEDGER_ENTRIES, ledgerEntries);
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist ledger');
    }
  }
);

// ===========================
// SLICE
// ===========================

const slice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    /**
     * Add a ledger entry (append-only)
     * NEVER mutate existing entries
     */
    addLedgerEntry: (state, { payload }: PayloadAction<LedgerEntry>) => {
      state.ledgerEntries = addEntityToStore(state.ledgerEntries, payload);
      state.error = undefined;
    },
    
    /**
     * Add multiple ledger entries (batch operation)
     */
    addLedgerEntries: (state, { payload }: PayloadAction<LedgerEntry[]>) => {
      payload.forEach(entry => {
        state.ledgerEntries = addEntityToStore(state.ledgerEntries, entry);
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
     * Reset ledger state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateLedger.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateLedger.fulfilled, (state, { payload }) => {
      state.ledgerEntries = payload.ledgerEntries;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateLedger.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistLedger.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistLedger.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistLedger.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Get all ledger entries as array
 */
export const selectAllLedgerEntries = (state: State): LedgerEntry[] => {
  return getEntitiesArray(state.ledger.ledgerEntries).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
};

/**
 * Get ledger entry by ID
 */
export const selectLedgerEntryById = (state: State, id: string): LedgerEntry | undefined => {
  return state.ledger.ledgerEntries.byId[id];
};

/**
 * Get ledger entries by account
 */
export const selectLedgerEntriesByAccount = (state: State, accountId: string): LedgerEntry[] => {
  return getEntitiesArray(state.ledger.ledgerEntries)
    .filter(e => e.accountId === accountId)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
};

/**
 * Get ledger entries by collection
 */
export const selectLedgerEntriesByCollection = (
  state: State,
  collectionId: string
): LedgerEntry[] => {
  return getEntitiesArray(state.ledger.ledgerEntries)
    .filter(e => e.collectionId === collectionId)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
};

/**
 * Calculate account balance from ledger
 */
export const selectAccountBalance = (state: State, accountId: string): number => {
  const entries = selectLedgerEntriesByAccount(state, accountId);
  return calculateAccountBalance(entries);
};

/**
 * Get ledger entries in date range
 */
export const selectLedgerEntriesInDateRange = (
  state: State,
  accountId: string,
  startDate: string,
  endDate: string
): LedgerEntry[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return getEntitiesArray(state.ledger.ledgerEntries)
    .filter(e => {
      if (e.accountId !== accountId) return false;
      const postedAt = new Date(e.postedAt).getTime();
      return postedAt >= start && postedAt <= end;
    })
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
};

/**
 * Get total credits for account
 */
export const selectTotalCredits = (state: State, accountId: string): number => {
  return getEntitiesArray(state.ledger.ledgerEntries)
    .filter(e => e.accountId === accountId && (e.entryType === 'CREDIT' || e.entryType === 'PENALTY'))
    .reduce((sum, e) => sum + e.amount, 0);
};

/**
 * Get total reversals for account
 */
export const selectTotalReversals = (state: State, accountId: string): number => {
  return getEntitiesArray(state.ledger.ledgerEntries)
    .filter(e => e.accountId === accountId && e.entryType === 'REVERSAL')
    .reduce((sum, e) => sum + e.amount, 0);
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useLedgerSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.ledger);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateLedger: () => dispatch(hydrateLedger()),
    persistLedger: () => dispatch(persistLedger()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const { addLedgerEntry, addLedgerEntries, setError, clearError, reset } = slice.actions;

export default slice.reducer;


/**
 * Accounts Slice
 * Manages account data (read-only for now, will add create later)
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Account, Scheme, AccountStatus } from '@/types';
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
import { generateAccountNumber } from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface AccountsState {
  accounts: NormalizedStore<Account>;
  schemes: NormalizedStore<Scheme>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
  lastAccountNumber: number;
}

/**
 * Account creation payload.
 * `accountNumber` is optional: when omitted the sequential number is generated, when
 * supplied the caller's manually entered number is used as-is.
 */
export type AddAccountPayload = Omit<
  Account,
  'id' | 'accountNumber' | 'currentBalance' | 'openedAt'
> & {
  accountNumber?: string;
};

const initialState: AccountsState = {
  accounts: createEmptyStore<Account>(),
  schemes: createEmptyStore<Scheme>(),
  loading: false,
  error: undefined,
  hydrated: false,
  lastAccountNumber: 0,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate accounts from storage
 */
export const hydrateAccounts = createAsyncThunk(
  'accounts/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const accounts = await getItemSafe<NormalizedStore<Account>>(
        STORAGE_KEYS.ACCOUNTS,
        createEmptyStore<Account>(),
      );

      const schemes = await getItemSafe<NormalizedStore<Scheme>>(
        STORAGE_KEYS.SCHEMES,
        createEmptyStore<Scheme>(),
      );

      // Calculate last account number
      let lastNumber = 0;
      getEntitiesArray(accounts).forEach(account => {
        const match = account.accountNumber.match(/ACCT-\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > lastNumber) {
            lastNumber = num;
          }
        }
      });

      return { accounts, schemes, lastAccountNumber: lastNumber };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate accounts');
    }
  },
);

/**
 * Persist accounts to storage
 */
export const persistAccounts = createAsyncThunk(
  'accounts/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { accounts, schemes } = state.accounts;

      // setItemSafe swallows the write error and reports false, so the caller can only
      // learn that a new account never reached storage if we reject here.
      const persisted = await setItemSafe(STORAGE_KEYS.ACCOUNTS, accounts);
      const persistedSchemes = await setItemSafe(STORAGE_KEYS.SCHEMES, schemes);
      if (!persisted || !persistedSchemes) {
        return rejectWithValue('Failed to persist accounts to device storage');
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist accounts');
    }
  },
);

// ===========================
// SLICE
// ===========================

const slice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    /**
     * Add a new account
     */
    addAccount: (state, { payload }: PayloadAction<AddAccountPayload>) => {
      const { accountNumber: manualAccountNumber, ...accountData } = payload;
      const id = generateUUID();
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();

      const trimmedManualNumber = manualAccountNumber?.trim();
      let accountNumber: string;

      if (trimmedManualNumber) {
        // A manually entered number sits outside the generated series, so the counter is
        // left alone rather than consuming a sequence number no account will ever use.
        accountNumber = trimmedManualNumber;
      } else {
        state.lastAccountNumber += 1;
        accountNumber = generateAccountNumber(currentYear, state.lastAccountNumber);
      }

      const account: Account = {
        ...accountData,
        id,
        accountNumber,
        currentBalance: 0, // Will be calculated from ledger
        openedAt: now,
      };

      state.accounts = addEntityToStore(state.accounts, account);
      state.error = undefined;
    },

    /**
     * Update account balance (typically called after ledger updates)
     */
    updateAccountBalance: (state, { payload }: PayloadAction<{ id: string; balance: number }>) => {
      const existing = state.accounts.byId[payload.id];
      if (existing) {
        state.accounts = updateEntityInStore(state.accounts, payload.id, {
          currentBalance: payload.balance,
        } as Partial<Account>);
      }
    },

    /**
     * Update an account's number (manual passbook number correction).
     * The account id and the owning customer are never touched, so ledger, collection and
     * delegation references stay intact. A blank number is ignored: there is no path back
     * to the generated series for an existing account.
     */
    updateAccountNumber: (
      state,
      { payload }: PayloadAction<{ id: string; accountNumber: string }>,
    ) => {
      const trimmed = payload.accountNumber.trim();
      const existing = state.accounts.byId[payload.id];
      if (!existing || !trimmed) return;

      // A manually entered number sits outside the generated series, so `lastAccountNumber`
      // is left alone here as well.
      state.accounts = updateEntityInStore(state.accounts, payload.id, {
        accountNumber: trimmed,
      } as Partial<Account>);
      state.error = undefined;
    },

    /**
     * Update account status
     */
    updateAccountStatus: (
      state,
      { payload }: PayloadAction<{ id: string; status: AccountStatus }>,
    ) => {
      const now = new Date().toISOString();
      const updates: Partial<Account> = {
        status: payload.status,
      };

      // If closing, set closedAt
      if (payload.status === 'CLOSED') {
        updates.closedAt = now;
      }

      state.accounts = updateEntityInStore(state.accounts, payload.id, updates);
      state.error = undefined;
    },

    /**
     * Add or update scheme
     */
    addScheme: (state, { payload }: PayloadAction<Scheme>) => {
      state.schemes = addEntityToStore(state.schemes, payload);
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
     * Reset accounts state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateAccounts.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateAccounts.fulfilled, (state, { payload }) => {
      state.accounts = payload.accounts;
      state.schemes = payload.schemes;
      state.lastAccountNumber = payload.lastAccountNumber;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateAccounts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });

    // Persist
    builder.addCase(persistAccounts.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistAccounts.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistAccounts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Base selector - get accounts store
 */
const selectAccountsStore = (state: State) => state.accounts.accounts;

/**
 * Get all accounts as array (memoized)
 */
export const selectAllAccounts = createSelector([selectAccountsStore], (accounts) =>
  getEntitiesArray(accounts)
);

/**
 * Get account by ID
 */
export const selectAccountById = (state: State, id: string): Account | undefined => {
  return state.accounts.accounts.byId[id];
};

/**
 * Get accounts by customer (memoized)
 */
export const selectAccountsByCustomer = createSelector(
  [selectAllAccounts, (_state: State, customerId: string) => customerId],
  (accounts, customerId) => accounts.filter(a => a.customerId === customerId)
);

/**
 * Get active accounts by customer (memoized)
 */
export const selectActiveAccountsByCustomer = createSelector(
  [selectAllAccounts, (_state: State, customerId: string) => customerId],
  (accounts, customerId) =>
    accounts.filter(a => a.customerId === customerId && a.status === 'ACTIVE')
);

/**
 * Get scheme by ID
 */
export const selectSchemeById = (state: State, id: string): Scheme | undefined => {
  return state.accounts.schemes.byId[id];
};

/**
 * Get all schemes
 */
export const selectAllSchemes = (state: State): Scheme[] => {
  return getEntitiesArray(state.accounts.schemes);
};

/**
 * Get scheme for account
 */
export const selectSchemeForAccount = (state: State, accountId: string): Scheme | undefined => {
  const account = selectAccountById(state, accountId);
  if (!account) return undefined;
  return selectSchemeById(state, account.schemeId);
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useAccountsSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.accounts);

  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateAccounts: () => dispatch(hydrateAccounts()),
    persistAccounts: () => dispatch(persistAccounts()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  addAccount,
  updateAccountBalance,
  updateAccountNumber,
  updateAccountStatus,
  addScheme,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;

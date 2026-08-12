/**
 * Customers Slice
 * Manages customer data and operations
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Customer, CustomerKYC, CustomerStatus } from '@/types';
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
import { generateCustomerCode, normalizePhone } from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface CustomersState {
  customers: NormalizedStore<Customer>;
  kycDocs: NormalizedStore<CustomerKYC>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
  lastCustomerNumber: number;
}

const initialState: CustomersState = {
  customers: createEmptyStore<Customer>(),
  kycDocs: createEmptyStore<CustomerKYC>(),
  loading: false,
  error: undefined,
  hydrated: false,
  lastCustomerNumber: 0,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate customers from storage
 */
export const hydrateCustomers = createAsyncThunk(
  'customers/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const customers = await getItemSafe<NormalizedStore<Customer>>(
        STORAGE_KEYS.CUSTOMERS,
        createEmptyStore<Customer>(),
      );

      const kycDocs = await getItemSafe<NormalizedStore<CustomerKYC>>(
        STORAGE_KEYS.KYC_DOCS,
        createEmptyStore<CustomerKYC>(),
      );

      // Calculate last customer number
      let lastNumber = 0;
      getEntitiesArray(customers).forEach(customer => {
        const match = customer.customerCode.match(/CUST-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > lastNumber) {
            lastNumber = num;
          }
        }
      });

      return { customers, kycDocs, lastCustomerNumber: lastNumber };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate customers');
    }
  },
);

/**
 * Persist customers to storage
 */
export const persistCustomers = createAsyncThunk(
  'customers/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { customers, kycDocs } = state.customers;

      // setItemSafe swallows the write error and reports false, so the caller can only
      // learn that a customer edit never reached storage if we reject here.
      const persisted = await setItemSafe(STORAGE_KEYS.CUSTOMERS, customers);
      const persistedKyc = await setItemSafe(STORAGE_KEYS.KYC_DOCS, kycDocs);
      if (!persisted || !persistedKyc) {
        return rejectWithValue('Failed to persist customers to device storage');
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist customers');
    }
  },
);

// ===========================
// SLICE
// ===========================

const slice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    /**
     * Add a new customer
     */
    addCustomer: (
      state,
      { payload }: PayloadAction<Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt'>>,
    ) => {
      const id = generateUUID();
      const now = new Date().toISOString();

      // Generate customer code
      state.lastCustomerNumber += 1;
      const customerCode = generateCustomerCode(state.lastCustomerNumber);

      const customer: Customer = {
        ...payload,
        id,
        customerCode,
        createdAt: now,
        updatedAt: now,
      };

      state.customers = addEntityToStore(state.customers, customer);
      state.error = undefined;
    },

    /**
     * Update customer details
     * Note: Changing route/agent applies only to future cycles
     */
    updateCustomer: (
      state,
      { payload }: PayloadAction<{ id: string; updates: Partial<Customer> }>,
    ) => {
      const { id, updates } = payload;

      state.customers = updateEntityInStore(state.customers, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      state.error = undefined;
    },

    /**
     * Update customer status
     */
    updateCustomerStatus: (
      state,
      { payload }: PayloadAction<{ id: string; status: CustomerStatus }>,
    ) => {
      state.customers = updateEntityInStore(state.customers, payload.id, {
        status: payload.status,
        updatedAt: new Date().toISOString(),
      } as Partial<Customer>);
      state.error = undefined;
    },

    /**
     * Add KYC document (append-only, never delete)
     */
    addKYCDocument: (state, { payload }: PayloadAction<Omit<CustomerKYC, 'id' | 'createdAt'>>) => {
      const id = generateUUID();
      const kycDoc: CustomerKYC = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
      };

      state.kycDocs = addEntityToStore(state.kycDocs, kycDoc);
      state.error = undefined;
    },

    /**
     * Verify KYC document
     */
    verifyKYCDocument: (state, { payload }: PayloadAction<string>) => {
      state.kycDocs = updateEntityInStore(state.kycDocs, payload, {
        verifiedAt: new Date().toISOString(),
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
     * Reset customers state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateCustomers.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateCustomers.fulfilled, (state, { payload }) => {
      state.customers = payload.customers;
      state.kycDocs = payload.kycDocs;
      state.lastCustomerNumber = payload.lastCustomerNumber;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });

    // Persist
    builder.addCase(persistCustomers.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistCustomers.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Base selector - get customers store
 */
const selectCustomersStore = (state: State) => state.customers.customers;
const selectKYCDocsStore = (state: State) => state.customers.kycDocs;

/**
 * Get all customers as array (memoized)
 */
export const selectAllCustomers = createSelector([selectCustomersStore], customers =>
  getEntitiesArray(customers),
);

/**
 * Get customer by ID
 */
export const selectCustomerById = (state: State, id: string): Customer | undefined => {
  return state.customers.customers.byId[id];
};

/**
 * Get customers by route (memoized)
 */
export const selectCustomersByRoute = createSelector(
  [selectAllCustomers, (_state: State, routeId: string) => routeId],
  (customers, routeId) => customers.filter(c => c.routeId === routeId),
);

/**
 * Get customers by agent (memoized)
 */
export const selectCustomersByAgent = createSelector(
  [selectAllCustomers, (_state: State, agentId: string) => agentId],
  (customers, agentId) => customers.filter(c => c.primaryAgentId === agentId),
);

/**
 * Get active customers (memoized)
 */
export const selectActiveCustomers = createSelector([selectAllCustomers], customers =>
  customers.filter(c => c.status === 'ACTIVE'),
);

/**
 * Get KYC documents for customer (memoized)
 */
export const selectKYCDocsByCustomer = createSelector(
  [selectKYCDocsStore, (_state: State, customerId: string) => customerId],
  (kycDocs, customerId) => getEntitiesArray(kycDocs).filter(doc => doc.customerId === customerId),
);

/**
 * Check for potential duplicate customer (memoized)
 */
export const selectPotentialDuplicates = createSelector(
  [
    selectAllCustomers,
    (_state: State, branchId: string) => branchId,
    (_state: State, _branchId: string, phone?: string) => phone,
    (_state: State, _branchId: string, _phone?: string, name?: string) => name,
    (_state: State, _branchId: string, _phone?: string, _name?: string, addressLine1?: string) =>
      addressLine1,
  ],
  (customers, branchId, phone, name, addressLine1) => {
    const filteredCustomers = customers.filter(
      c => c.branchId === branchId && c.status !== 'BLOCKED',
    );

    const duplicates: Customer[] = [];

    // Check phone duplicate
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      const phoneMatches = filteredCustomers.filter(
        c => c.phone && normalizePhone(c.phone) === normalizedPhone,
      );
      duplicates.push(...phoneMatches);
    }

    // Check name + address heuristic
    if (name && addressLine1) {
      const nameMatches = filteredCustomers.filter(c => {
        const nameSimilar = c.fullName.toLowerCase() === name.toLowerCase();
        const addressSimilar =
          c.addressLine1.toLowerCase().includes(addressLine1.toLowerCase()) ||
          addressLine1.toLowerCase().includes(c.addressLine1.toLowerCase());
        return nameSimilar && addressSimilar;
      });
      duplicates.push(...nameMatches);
    }

    // Remove duplicates from array
    return Array.from(new Set(duplicates));
  },
);

// ===========================
// CUSTOM HOOK
// ===========================

export function useCustomersSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.customers);

  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateCustomers: () => dispatch(hydrateCustomers()),
    persistCustomers: () => dispatch(persistCustomers()),
    // Selector helpers
    getAllCustomers: () => selectAllCustomers({ customers: state } as State),
    getCustomerById: (id: string) => selectCustomerById({ customers: state } as State, id),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  addCustomer,
  updateCustomer,
  updateCustomerStatus,
  addKYCDocument,
  verifyKYCDocument,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;

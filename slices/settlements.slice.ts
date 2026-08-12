/**
 * Settlements Slice
 * Manages end-of-day settlement/day closure data
 */

import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { Collection, Settlement, SettlementStatus } from '@/types';
import { SettlementScope } from '@/types';
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
import { calculateSettlementSummary, calculateVariance } from '@/utils/businessLogic';
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
 * Settlement records written before settlementScope existed have no `scope` field.
 */
type PersistedSettlement = Omit<Settlement, 'scope'> & { scope?: SettlementScope };

/**
 * Hydrate settlements from storage
 *
 * Legacy records with no `scope` are read as PRIMARY. They were written when a settlement
 * closed the agent's whole day, and PRIMARY is the agent's own book, so this keeps the
 * record (never discarded, storage never cleared) and leaves that business date's
 * DELEGATED closure still open rather than silently blocking it.
 */
export const hydrateSettlements = createAsyncThunk(
  'settlements/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const stored = await getItemSafe<NormalizedStore<PersistedSettlement>>(
        STORAGE_KEYS.SETTLEMENTS,
        createEmptyStore<PersistedSettlement>(),
      );

      const byId: Record<string, Settlement> = {};
      Object.keys(stored.byId).forEach(id => {
        const record = stored.byId[id];
        byId[id] = { ...record, scope: record.scope ?? SettlementScope.PRIMARY };
      });

      const settlements: NormalizedStore<Settlement> = { ...stored, byId };

      return { settlements };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate settlements');
    }
  },
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

      // setItemSafe swallows the write error and reports false, so the caller can only
      // learn that a day closure never reached storage if we reject here.
      const persisted = await setItemSafe(STORAGE_KEYS.SETTLEMENTS, settlements);
      if (!persisted) {
        return rejectWithValue('Failed to persist settlements to device storage');
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist settlements');
    }
  },
);

// ===========================
// SLICE
// ===========================

export interface CreateSettlementPayload {
  agentId: string;
  branchId: string;
  businessDate: string;
  scope: SettlementScope;
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
        scope: payload.scope,
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
      { payload }: PayloadAction<{ id: string; updates: Partial<CreateSettlementPayload> }>,
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
     * Roll a submission back to DRAFT because its storage write failed.
     *
     * Mirrors commitCollection tagging an unpersisted collection FAILED: the record stays
     * in memory so the agent can retry the same day closure, but back in DRAFT it is
     * excluded from selectSettledCashTotal, so a day closure that never reached storage
     * can never reduce live cash in hand. Only a SUBMITTED record is rolled back - this is
     * a persistence-failure path, not part of the dormant approval flow.
     */
    revertSettlementSubmission: (state, { payload }: PayloadAction<string>) => {
      const existing = state.settlements.byId[payload];

      if (!existing || existing.status !== 'SUBMITTED') {
        return;
      }

      state.settlements = updateEntityInStore(state.settlements, payload, {
        status: 'DRAFT',
        submittedAt: undefined,
        updatedAt: new Date().toISOString(),
      });
    },

    /**
     * Approve settlement (admin action, will be used later)
     */
    approveSettlement: (state, { payload }: PayloadAction<{ id: string; reviewedBy: string }>) => {
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
      { payload }: PayloadAction<{ id: string; reviewedBy: string; notes: string }>,
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
 * Base selectors - raw normalized stores.
 *
 * getEntitiesArray() builds a new array on every call, so it must never be used directly
 * as a createSelector input: Reselect compares inputs by reference and would both warn
 * about unstable inputs and recompute on every read. The array is built once here, in a
 * memoized layer, and every derived selector takes it from that layer instead.
 */
const selectSettlementsStore = (state: State) => state.settlements.settlements;
const selectCollectionsStore = (state: State) => state.collections.collections;

const selectSettlementEntities = createSelector([selectSettlementsStore], store =>
  getEntitiesArray(store),
);

const selectCollectionEntities = createSelector([selectCollectionsStore], store =>
  getEntitiesArray(store),
);

/**
 * Get all settlements as array
 */
export const selectAllSettlements = createSelector([selectSettlementEntities], settlements =>
  [...settlements].sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

/**
 * Get settlement by ID
 */
export const selectSettlementById = (state: State, id: string): Settlement | undefined => {
  return state.settlements.settlements.byId[id];
};

/**
 * Get settlements by agent
 */
export const selectSettlementsByAgent = createSelector(
  [selectSettlementEntities, (_state: State, agentId: string) => agentId],
  (settlements, agentId) =>
    settlements
      .filter(s => s.agentId === agentId)
      .sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

/**
 * Get settlements by agent for a month prefix (YYYY-MM)
 */
export const selectSettlementsByAgentAndMonth = createSelector(
  [
    selectSettlementEntities,
    (_state: State, agentId: string, _monthPrefix: string) => agentId,
    (_state: State, _agentId: string, monthPrefix: string) => monthPrefix,
  ],
  (settlements, agentId, monthPrefix) =>
    settlements
      .filter(s => s.agentId === agentId && s.businessDate.startsWith(monthPrefix))
      .sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

/**
 * Get the settlement for an agent's business date within one scope.
 * Settlement identity is agentId + businessDate + scope, so an agent can close their
 * PRIMARY and DELEGATED books for the same date independently.
 */
export const selectSettlementByAgentAndDate = (
  state: State,
  agentId: string,
  businessDate: string,
  scope: SettlementScope,
): Settlement | undefined => {
  return selectSettlementEntities(state).find(
    s => s.agentId === agentId && s.businessDate === businessDate && s.scope === scope,
  );
};

/**
 * Check if settlement exists for date within a scope
 */
export const selectHasSettlementForDate = (
  state: State,
  agentId: string,
  businessDate: string,
  scope: SettlementScope,
): boolean => {
  return !!selectSettlementByAgentAndDate(state, agentId, businessDate, scope);
};

/**
 * Get pending settlements (DRAFT or SUBMITTED)
 */
export const selectPendingSettlements = createSelector([selectSettlementEntities], settlements =>
  settlements
    .filter(s => s.status === 'DRAFT' || s.status === 'SUBMITTED')
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

/**
 * Get settlements with variance
 */
export const selectSettlementsWithVariance = createSelector(
  [selectSettlementEntities],
  settlements =>
    settlements
      .filter(s => s.variance !== 0)
      .sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

/**
 * Get settlements by status
 */
export const selectSettlementsByStatus = createSelector(
  [selectSettlementEntities, (_state: State, status: SettlementStatus) => status],
  (settlements, status) =>
    settlements
      .filter(s => s.status === status)
      .sort((a, b) => b.businessDate.localeCompare(a.businessDate)),
);

// ===========================
// SCOPE + CASH-IN-HAND SELECTORS
// ===========================

/**
 * Which book a collection belongs to. Reuses the existing domain distinction -
 * Collection.delegationId is set only when the collection was made under a delegation.
 */
export function getCollectionSettlementScope(collection: Collection): SettlementScope {
  return collection.delegationId ? SettlementScope.DELEGATED : SettlementScope.PRIMARY;
}

/**
 * The agent's collections for one business date within one scope - the exact set a
 * settlement of that scope closes, and the input for calculateSettlementSummary.
 */
export const selectScopedDayCollections = createSelector(
  [
    selectCollectionEntities,
    (_state: State, agentId: string, _businessDate: string, _scope: SettlementScope) => agentId,
    (_state: State, _agentId: string, businessDate: string, _scope: SettlementScope) =>
      businessDate,
    (_state: State, _agentId: string, _businessDate: string, scope: SettlementScope) => scope,
  ],
  (collections, agentId, businessDate, scope) =>
    collections.filter(
      c =>
        c.collectedByAgentId === agentId &&
        c.businessDate === businessDate &&
        getCollectionSettlementScope(c) === scope,
    ),
);

/**
 * Cash the agent physically collected on a business date in one scope, before any closure.
 * Delegates to calculateSettlementSummary, so which collections count as cash is decided
 * in exactly one place.
 */
export const selectEligibleCashCollected = createSelector(
  [selectScopedDayCollections],
  collections => calculateSettlementSummary(collections).cashTotal,
);

/**
 * The settlement records that close one agent's business date within one scope.
 * Settlement identity is agentId + businessDate + scope.
 */
export const selectScopedDateSettlements = createSelector(
  [
    selectSettlementEntities,
    (_state: State, agentId: string, _businessDate: string, _scope: SettlementScope) => agentId,
    (_state: State, _agentId: string, businessDate: string, _scope: SettlementScope) =>
      businessDate,
    (_state: State, _agentId: string, _businessDate: string, scope: SettlementScope) => scope,
  ],
  (settlements, agentId, businessDate, scope) =>
    settlements.filter(
      s => s.agentId === agentId && s.businessDate === businessDate && s.scope === scope,
    ),
);

/**
 * Cash already handed over through a day closure.
 *
 * Uses Settlement.cashTotal (system-computed collected cash) — NOT Settlement.cashInHand,
 * which is the agent-declared physical count and exists only to produce `variance` for
 * reconciliation. Only settlements at SUBMITTED status or later count; DRAFT is still
 * mutable/discardable and must not reduce the running balance.
 *
 * Takes an already scope/date-filtered set so reporting can apply the same rule to a
 * month's worth of closures without restating it.
 */
export function sumSettledCash(settlements: Settlement[]): number {
  return settlements.filter(s => s.status !== 'DRAFT').reduce((sum, s) => sum + s.cashTotal, 0);
}

export const selectSettledCashTotal = createSelector([selectScopedDateSettlements], sumSettledCash);

/**
 * The unsettled cash rule itself: eligible collected CASH − cash already handed over.
 *
 * Derived on every read rather than stored as a mutable number, so a collection made
 * after settlement raises it again automatically and a repeated settlement can never
 * reduce it twice. UPI never contributes. Both arguments must already be narrowed to one
 * agent + scope (and, for a single day, one business date) by the caller; PRIMARY and
 * DELEGATED balances are independent and must never be pooled.
 *
 * Distinct concept from Settlement.cashInHand — see sumSettledCash.
 */
export function calculateCashInHand(collections: Collection[], settlements: Settlement[]): number {
  return calculateSettlementSummary(collections).cashTotal - sumSettledCash(settlements);
}

/**
 * Authoritative unsettled cash balance for an agent on a business date, within one scope.
 */
export const selectCashInHand = (
  state: State,
  agentId: string,
  businessDate: string,
  scope: SettlementScope,
): number => {
  return calculateCashInHand(
    selectScopedDayCollections(state, agentId, businessDate, scope),
    selectScopedDateSettlements(state, agentId, businessDate, scope),
  );
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
  revertSettlementSubmission,
  approveSettlement,
  rejectSettlement,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;

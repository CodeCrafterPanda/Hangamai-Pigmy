/**
 * Settings Slice
 * Manages app settings and configuration
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { BranchSettings, Branch, Agent, Route } from '@/types';
import {
  STORAGE_KEYS,
  getItemSafe,
  setItemSafe,
  createEmptyStore,
  addEntityToStore,
  updateEntityInStore,
  getEntitiesArray,
  type NormalizedStore,
  type SessionData,
} from '@/utils/storage';

// ===========================
// STATE INTERFACE
// ===========================

export interface SettingsState {
  branchSettings: BranchSettings;
  branches: NormalizedStore<Branch>;
  agents: NormalizedStore<Agent>;
  routes: NormalizedStore<Route>;
  session: SessionData;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: SettingsState = {
  branchSettings: {
    branchId: '',
    timezone: 'Asia/Kolkata',
    allowBackdateDays: 0,
    receiptPrefix: 'RCPT',
    currency: 'INR',
    updatedAt: new Date().toISOString(),
  },
  branches: createEmptyStore<Branch>(),
  agents: createEmptyStore<Agent>(),
  routes: createEmptyStore<Route>(),
  session: {},
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate settings from storage
 */
export const hydrateSettings = createAsyncThunk(
  'settings/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const branchSettings = await getItemSafe<BranchSettings>(STORAGE_KEYS.SETTINGS, {
        branchId: '',
        timezone: 'Asia/Kolkata',
        allowBackdateDays: 0,
        receiptPrefix: 'RCPT',
        currency: 'INR',
        updatedAt: new Date().toISOString(),
      });
      
      const branches = await getItemSafe<NormalizedStore<Branch>>(
        STORAGE_KEYS.BRANCHES,
        createEmptyStore<Branch>()
      );
      
      const agents = await getItemSafe<NormalizedStore<Agent>>(
        STORAGE_KEYS.AGENTS,
        createEmptyStore<Agent>()
      );
      
      const routes = await getItemSafe<NormalizedStore<Route>>(
        STORAGE_KEYS.ROUTES,
        createEmptyStore<Route>()
      );
      
      const session = await getItemSafe<SessionData>(STORAGE_KEYS.SESSION, {});
      
      return { branchSettings, branches, agents, routes, session };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate settings');
    }
  }
);

/**
 * Persist settings to storage
 */
export const persistSettings = createAsyncThunk(
  'settings/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { branchSettings, branches, agents, routes, session } = state.settings;
      
      // setItemSafe swallows the write error and reports false, so the caller can only
      // learn that a route or session change never reached storage if we reject here.
      const results = await Promise.all([
        setItemSafe(STORAGE_KEYS.SETTINGS, branchSettings),
        setItemSafe(STORAGE_KEYS.BRANCHES, branches),
        setItemSafe(STORAGE_KEYS.AGENTS, agents),
        setItemSafe(STORAGE_KEYS.ROUTES, routes),
        setItemSafe(STORAGE_KEYS.SESSION, session),
      ]);
      if (results.some(persisted => !persisted)) {
        return rejectWithValue('Failed to persist settings to device storage');
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist settings');
    }
  }
);

// ===========================
// SLICE
// ===========================

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Update branch settings
     */
    updateBranchSettings: (state, { payload }: PayloadAction<Partial<BranchSettings>>) => {
      state.branchSettings = {
        ...state.branchSettings,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      state.error = undefined;
    },
    
    /**
     * Add or update branch
     */
    addBranch: (state, { payload }: PayloadAction<Branch>) => {
      state.branches = addEntityToStore(state.branches, payload);
      state.error = undefined;
    },
    
    /**
     * Add or update agent
     */
    addAgent: (state, { payload }: PayloadAction<Agent>) => {
      state.agents = addEntityToStore(state.agents, payload);
      state.error = undefined;
    },
    
    /**
     * Add or update route
     */
    addRoute: (state, { payload }: PayloadAction<Route>) => {
      state.routes = addEntityToStore(state.routes, payload);
      state.error = undefined;
    },
    
    /**
     * Update session data
     */
    updateSession: (state, { payload }: PayloadAction<Partial<SessionData>>) => {
      state.session = {
        ...state.session,
        ...payload,
      };
      state.error = undefined;
    },
    
    /**
     * Clear session data (but preserve MPIN for re-login)
     */
    clearSession: state => {
      const mpinHash = state.session.mpinHash;
      const mpinSetAt = state.session.mpinSetAt;
      state.session = { mpinHash, mpinSetAt };
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
     * Reset settings state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateSettings.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateSettings.fulfilled, (state, { payload }) => {
      state.branchSettings = payload.branchSettings;
      state.branches = payload.branches;
      state.agents = payload.agents;
      state.routes = payload.routes;
      state.session = payload.session;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistSettings.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistSettings.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Get branch settings
 */
export const selectBranchSettings = (state: State): BranchSettings => {
  return state.settings.branchSettings;
};

/**
 * Get session data
 */
export const selectSession = (state: State): SessionData => {
  return state.settings.session;
};

/**
 * Get current agent ID from session
 */
export const selectCurrentAgentId = (state: State): string | undefined => {
  return state.settings.session.agentId;
};

/**
 * Get current branch ID from session
 */
export const selectCurrentBranchId = (state: State): string | undefined => {
  return state.settings.session.branchId;
};

/**
 * Get branch by ID
 */
export const selectBranchById = (state: State, id: string): Branch | undefined => {
  return state.settings.branches.byId[id];
};

/**
 * Get current branch
 */
export const selectCurrentBranch = (state: State): Branch | undefined => {
  const branchId = selectCurrentBranchId(state);
  return branchId ? selectBranchById(state, branchId) : undefined;
};

/** Documented fallback when session has no resolved branch (matches seeded default). */
export const DEFAULT_BRANCH_TIMEZONE = 'Asia/Kolkata';

/**
 * Authoritative branch timezone for business-date calculation.
 * Reads Branch.timezone via session.branchId — not BranchSettings.timezone cache.
 */
export const selectBranchTimezone = (state: State): string => {
  return selectCurrentBranch(state)?.timezone || DEFAULT_BRANCH_TIMEZONE;
};

/**
 * Get agent by ID
 */
export const selectAgentById = (state: State, id: string): Agent | undefined => {
  return state.settings.agents.byId[id];
};

/**
 * Get current agent
 */
export const selectCurrentAgent = (state: State): Agent | undefined => {
  const agentId = selectCurrentAgentId(state);
  return agentId ? selectAgentById(state, agentId) : undefined;
};

/**
 * Get agents by branch
 */
export const selectAgentsByBranch = (state: State, branchId: string): Agent[] => {
  return getEntitiesArray(state.settings.agents).filter(a => a.branchId === branchId);
};

/**
 * Get active agents by branch
 */
export const selectActiveAgentsByBranch = (state: State, branchId: string): Agent[] => {
  return getEntitiesArray(state.settings.agents).filter(
    a => a.branchId === branchId && a.status === 'ACTIVE'
  );
};

/**
 * Base selectors
 */
const selectRoutesStore = (state: State) => state.settings.routes;
const selectBranchesStore = (state: State) => state.settings.branches;
const selectAgentsStore = (state: State) => state.settings.agents;

/**
 * Get all routes (memoized)
 */
export const selectAllRoutes = createSelector([selectRoutesStore], (routes) =>
  getEntitiesArray(routes)
);

/**
 * Get route by ID
 */
export const selectRouteById = (state: State, id: string): Route | undefined => {
  return state.settings.routes.byId[id];
};

/**
 * Get routes by branch (memoized)
 */
export const selectRoutesByBranch = createSelector(
  [selectAllRoutes, (_state: State, branchId: string) => branchId],
  (routes, branchId) => routes.filter(r => r.branchId === branchId)
);

/**
 * Get all branches (memoized)
 */
export const selectAllBranches = createSelector([selectBranchesStore], (branches) =>
  getEntitiesArray(branches)
);

/**
 * Get all agents (memoized)
 */
export const selectAllAgents = createSelector([selectAgentsStore], (agents) =>
  getEntitiesArray(agents)
);

// ===========================
// CUSTOM HOOK
// ===========================

export function useSettingsSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.settings);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateSettings: () => dispatch(hydrateSettings()),
    persistSettings: () => dispatch(persistSettings()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const {
  updateBranchSettings,
  addBranch,
  addAgent,
  addRoute,
  updateSession,
  clearSession,
  setError,
  clearError,
  reset,
} = slice.actions;

export default slice.reducer;


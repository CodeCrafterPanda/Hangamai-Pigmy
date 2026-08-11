/**
 * Audit Slice
 * Manages audit log trail for all operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import type { AuditLog } from '@/types';
import {
  STORAGE_KEYS,
  getItemSafe,
  setItemSafe,
  createEmptyStore,
  addEntityToStore,
  getEntitiesArray,
  type NormalizedStore,
} from '@/utils/storage';
import { generateUUID } from '@/utils/uuid';

// ===========================
// STATE INTERFACE
// ===========================

export interface AuditState {
  auditLogs: NormalizedStore<AuditLog>;
  loading: boolean;
  error?: string;
  hydrated: boolean;
}

const initialState: AuditState = {
  auditLogs: createEmptyStore<AuditLog>(),
  loading: false,
  error: undefined,
  hydrated: false,
};

// ===========================
// ASYNC THUNKS
// ===========================

/**
 * Hydrate audit logs from storage
 */
export const hydrateAuditLogs = createAsyncThunk(
  'audit/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const auditLogs = await getItemSafe<NormalizedStore<AuditLog>>(
        STORAGE_KEYS.AUDIT_LOGS,
        createEmptyStore<AuditLog>()
      );
      
      return { auditLogs };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to hydrate audit logs');
    }
  }
);

/**
 * Persist audit logs to storage
 */
export const persistAuditLogs = createAsyncThunk(
  'audit/persist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as State;
      const { auditLogs } = state.audit;
      
      await setItemSafe(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to persist audit logs');
    }
  }
);

// ===========================
// SLICE
// ===========================

export interface LogEventPayload {
  actorUserId?: string;
  actorAgentId?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}

const slice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    /**
     * Log an audit event
     */
    logEvent: (state, { payload }: PayloadAction<LogEventPayload>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      const auditLog: AuditLog = {
        id,
        actorUserId: payload.actorUserId,
        actorAgentId: payload.actorAgentId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        beforeData: payload.beforeData,
        afterData: payload.afterData,
        createdAt: now,
      };
      
      state.auditLogs = addEntityToStore(state.auditLogs, auditLog);
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
     * Reset audit state
     */
    reset: () => initialState,
  },
  extraReducers: builder => {
    // Hydrate
    builder.addCase(hydrateAuditLogs.pending, state => {
      state.loading = true;
      state.error = undefined;
    });
    builder.addCase(hydrateAuditLogs.fulfilled, (state, { payload }) => {
      state.auditLogs = payload.auditLogs;
      state.loading = false;
      state.hydrated = true;
    });
    builder.addCase(hydrateAuditLogs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.hydrated = true;
    });
    
    // Persist
    builder.addCase(persistAuditLogs.pending, state => {
      state.loading = true;
    });
    builder.addCase(persistAuditLogs.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(persistAuditLogs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===========================
// SELECTORS
// ===========================

/**
 * Get all audit logs as array (sorted by latest first)
 */
export const selectAllAuditLogs = (state: State): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get audit log by ID
 */
export const selectAuditLogById = (state: State, id: string): AuditLog | undefined => {
  return state.audit.auditLogs.byId[id];
};

/**
 * Get audit logs by entity
 */
export const selectAuditLogsByEntity = (
  state: State,
  entityType: string,
  entityId: string
): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs)
    .filter(log => log.entityType === entityType && log.entityId === entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get audit logs by actor (user)
 */
export const selectAuditLogsByUser = (state: State, userId: string): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs)
    .filter(log => log.actorUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get audit logs by actor (agent)
 */
export const selectAuditLogsByAgent = (state: State, agentId: string): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs)
    .filter(log => log.actorAgentId === agentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get audit logs by action
 */
export const selectAuditLogsByAction = (state: State, action: string): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs)
    .filter(log => log.action === action)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get recent audit logs (last N)
 */
export const selectRecentAuditLogs = (state: State, limit: number = 50): AuditLog[] => {
  return getEntitiesArray(state.audit.auditLogs)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// ===========================
// CUSTOM HOOK
// ===========================

export function useAuditSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector((state: State) => state.audit);
  
  return {
    dispatch,
    ...state,
    ...slice.actions,
    // Async actions
    hydrateAuditLogs: () => dispatch(hydrateAuditLogs()),
    persistAuditLogs: () => dispatch(persistAuditLogs()),
  };
}

// ===========================
// EXPORTS
// ===========================

export const { logEvent, setError, clearError, reset } = slice.actions;

export default slice.reducer;


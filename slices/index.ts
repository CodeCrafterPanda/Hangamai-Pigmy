// Core slice
export { useAppSlice } from './app.slice';

// Domain slices
export { useCustomersSlice, hydrateCustomers } from './customers.slice';
export { useAccountsSlice, hydrateAccounts } from './accounts.slice';
export { useDelegationsSlice, hydrateDelegations } from './delegations.slice';
export { useCollectionsSlice, hydrateCollections } from './collections.slice';
export { useLedgerSlice, hydrateLedger } from './ledger.slice';
export { useSettlementsSlice, hydrateSettlements } from './settlements.slice';

// System slices
export { useSyncQueueSlice, hydrateSyncQueue } from './syncQueue.slice';
export { useAuditSlice, hydrateAuditLogs } from './audit.slice';
export { useSettingsSlice, hydrateSettings } from './settings.slice';

// Reports (selector-only, no hook)
export { default as reportsSelectors } from './reports.slice';

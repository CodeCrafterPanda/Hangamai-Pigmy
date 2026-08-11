/**
 * Navigation Utilities
 * Helper functions and types for type-safe navigation
 */

import { router } from 'expo-router';

// ===========================
// ROUTE PARAMETER TYPES
// ===========================

export type CustomerDetailParams = {
  id: string;
};

export type CollectDepositParams = {
  accountId: string;
};

export type RouteCustomersParams = {
  routeId: string;
};

export type ReceiptModalParams = {
  collectionId: string;
};

export type SettlementModalParams = {
  businessDate?: string;
};

export type ConfirmModalParams = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

// ===========================
// NAVIGATION HELPERS
// ===========================

/**
 * Navigate to customer detail screen
 * Can be called from any tab
 */
export function navigateToCustomerDetail(customerId: string, fromTab?: 'home' | 'route') {
  const tab = fromTab || 'home';
  router.push(`/(app)/(${tab})/customer-detail/${customerId}`);
}

/**
 * Navigate to collect deposit screen
 * Can be called from any tab
 */
export function navigateToCollectDeposit(accountId: string, fromTab?: 'home' | 'route') {
  const tab = fromTab || 'home';
  router.push(`/(app)/(${tab})/collect-deposit/${accountId}`);
}

/**
 * Open receipt modal after successful collection
 */
export function openReceiptModal(collectionId: string) {
  router.push({
    pathname: '/(modals)/receipt',
    params: { collectionId },
  });
}

/**
 * Open settlement modal for day closure
 */
export function openSettlementModal(businessDate?: string) {
  router.push({
    pathname: '/(modals)/settlement',
    params: businessDate ? { businessDate } : {},
  });
}

/**
 * Open search customer modal
 */
export function openSearchCustomer() {
  router.push('/(modals)/search-customer');
}

/**
 * Open offline queue modal
 */
export function openOfflineQueueModal() {
  router.push('/(modals)/offline-queue-modal');
}

/**
 * Open confirmation dialog
 */
export function openConfirmDialog(params: ConfirmModalParams) {
  router.push({
    pathname: '/(modals)/confirm',
    params,
  });
}

/**
 * Navigate to monthly collections report
 */
export function navigateToMonthlyCollections() {
  router.push('/(app)/(history)/monthly-collections');
}

/**
 * Navigate to offline queue screen (as a regular screen)
 */
export function navigateToOfflineQueue() {
  router.push('/(app)/(history)/offline-queue');
}

/**
 * Navigate to delegated customers
 */
export function navigateToDelegatedCustomers() {
  router.push('/(app)/(route)/delegated-customers');
}

/**
 * Navigate to route customers
 */
export function navigateToRouteCustomers(routeId: string) {
  router.push(`/(app)/(route)/route-customers/${routeId}`);
}

/**
 * Navigate to receipt detail
 */
export function navigateToReceiptDetail(receiptId: string) {
  router.push(`/(app)/(history)/receipt-detail/${receiptId}`);
}

/**
 * Navigate to settlement history
 */
export function navigateToSettlementHistory() {
  router.push('/(app)/(history)/settlement-history');
}

/**
 * Switch to a specific tab
 */
export function switchToTab(tab: 'home' | 'route' | 'history' | 'profile') {
  router.push(`/(app)/(${tab})`);
}

/**
 * Go back in navigation stack
 */
export function goBack() {
  if (router.canGoBack()) {
    router.back();
  }
}

/**
 * Replace current route (no back navigation)
 */
export function replaceRoute(href: string) {
  router.replace(href);
}

/**
 * Logout and return to auth flow
 */
export function logout() {
  router.replace('/(auth)/login');
}

// ===========================
// COLLECTION FLOW HELPERS
// ===========================

/**
 * Complete collection flow
 * Navigate from collect deposit to receipt modal
 */
export function completeCollectionFlow(collectionId: string) {
  openReceiptModal(collectionId);
}

/**
 * Cancel collection flow
 * Show confirmation before leaving collect deposit screen
 */
export function cancelCollectionFlow(onConfirm: () => void) {
  openConfirmDialog({
    title: 'Cancel Collection',
    message: 'Are you sure you want to cancel? Any unsaved data will be lost.',
    confirmText: 'Yes, Cancel',
    cancelText: 'No, Continue',
  });
  // Note: In real implementation, you'd need to pass the callback through navigation params
  // or use a global state/event system
}

// ===========================
// EXPORTS
// ===========================

export default {
  navigateToCustomerDetail,
  navigateToCollectDeposit,
  openReceiptModal,
  openSettlementModal,
  openSearchCustomer,
  openOfflineQueueModal,
  openConfirmDialog,
  navigateToMonthlyCollections,
  navigateToOfflineQueue,
  navigateToDelegatedCustomers,
  navigateToRouteCustomers,
  navigateToReceiptDetail,
  navigateToSettlementHistory,
  switchToTab,
  goBack,
  replaceRoute,
  logout,
  completeCollectionFlow,
  cancelCollectionFlow,
};


/**
 * Type definitions for Delegated Customers data
 */

export interface DelegatedCustomer {
  id: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  accountNumberMasked: string;
  avatarUrl?: string;
  primaryAgent: string;
  validTill: string;
  delegatedDate: string;
}

export interface DelegationInfo {
  showBanner: boolean;
  message: string;
  title: string;
}


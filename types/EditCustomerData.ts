/**
 * Type definitions for Edit Customer screen data
 */

export interface CustomerBasicInfo {
  id: string;
  customerId: string;
  name: string;
  idNumber: string;
  avatarUrl?: string;
  isVerified: boolean;
  assignedAgent: string;
  activeAccountsCount: number;
}

export interface CustomerPersonalInfo {
  fullName: string;
  mobileNumber: string;
  address: string;
  customerId: string;
  currentBalance: number;
  accountNumber: string;
  homeBranch: string;
}

export interface CollectionMapping {
  assignedRoute: string;
  routeId: string;
  primaryAgent: string;
  agentId: string;
}

export interface KYCDocument {
  id: string;
  type: string;
  verifiedDate: string;
  isVerified: boolean;
}

export interface AssociatedAccount {
  id: string;
  type: string;
  accountNumber: string;
  status: string;
  icon: string;
  iconColor: string;
}

export interface EditCustomerData {
  basicInfo: CustomerBasicInfo;
  personalInfo: CustomerPersonalInfo;
  collectionMapping: CollectionMapping;
  kycDocuments: KYCDocument[];
  associatedAccounts: AssociatedAccount[];
}


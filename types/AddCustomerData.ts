/**
 * Type definitions for Add New Customer form data
 */

export interface PersonalDetails {
  fullName: string;
  mobileNumber: string;
  customerId: string;
  accountNumber: string;
}

export interface AddressDetails {
  fullAddress: string;
}

export interface Assignment {
  branch: string;
  route: string;
  primaryAgent: string;
}

export interface KYCDetails {
  documentType: string;
  documentNumber: string;
  documentFile?: any;
}

export interface PigmyAccountDetails {
  createAccount: boolean;
  schemeType: string;
  dailyAmount: number;
  startDate: string;
}

export interface AddCustomerFormData {
  personal: PersonalDetails;
  address: AddressDetails;
  assignment: Assignment;
  kyc: KYCDetails;
  pigmyAccount: PigmyAccountDetails;
}


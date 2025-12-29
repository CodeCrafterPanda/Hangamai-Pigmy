/**
 * Type definitions for Add New Customer form data
 */

export interface PersonalDetails {
  fullName: string;
  mobileNumber: string;
  customerId: string;
}

export interface AddressDetails {
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  state: string;
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


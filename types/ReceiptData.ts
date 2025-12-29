/**
 * Type definitions for Receipt screen data
 */

export interface ReceiptData {
  receiptNumber: string;
  totalAmount: number;
  customerName: string;
  accountNumber: string;
  accountNumberMasked: string;
  date: string;
  time: string;
  paymentMode: string;
  agentId: string;
  isSavedLocally: boolean;
  initials: string;
}

export type ShareMethod = 'whatsapp' | 'sms' | 'pdf';


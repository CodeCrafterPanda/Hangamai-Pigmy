/**
 * English translations — the single source of truth for the translation key shape.
 *
 * Rules for this file:
 * - Keys are stable identifiers grouped by screen/component; never use the English text
 *   itself as a key.
 * - Only user-facing static text belongs here. Dynamic business data (customer names, route
 *   names, account numbers, receipt numbers, amounts, generated ids) is never translated.
 * - Enum-keyed groups (`ledgerEntryType`, `accountStatus`, ...) map a domain value to its
 *   display label. Business logic keeps reading the domain value, never the label.
 *
 * Adding another language: copy this file to `<code>.ts`, translate the values only, keep the
 * keys identical, then register it in `./index.ts` and add the code to `Language` in
 * `../types.ts`.
 */

const en = {
  accountCard: {
    dueToday: 'Due Today',
    type: {
      pigmy: 'PIGMY',
      loan: 'LOAN',
    },
    status: {
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
    },
  },

  customerDetail: {
    title: 'Customer Details',
    notFoundTitle: 'Customer not found',
    notFoundHint: 'This customer may have been removed or the link is invalid.',
    customerCode: 'Customer Code',
    status: 'Status',
    route: 'Route',
    agent: 'Agent',
    kyc: 'KYC',
    kycNotCaptured: 'Not captured',
    accountBalance: 'Account Balance',
    accountsTitle: 'ACTIVE ACCOUNTS',
    accountCountOne: '{{count}} Account',
    accountCountOther: '{{count}} Accounts',
    noAccounts: 'No accounts linked to this customer.',
    callCustomer: 'Call Customer',
    viewPassbook: 'View Passbook',
    viewReceipt: 'View Receipt',
    collectDeposit: 'Collect Deposit',
    missingCollectContext: 'Customer or account data not found',
  },

  passbook: {
    title: 'Passbook',
    notFoundTitle: 'Account not found',
    notFoundHint: 'This account may have been closed or the link is invalid.',
    accountBalance: 'ACCOUNT BALANCE',
    balanceHint: 'Derived from posted ledger entries',
    accountNumber: 'Account Number',
    scheme: 'Scheme',
    installment: 'Installment',
    accountStatus: 'Account Status',
    openedOn: 'Opened On',
    transactionsTitle: 'Transactions',
    transactionCountOne: '{{count}} entry',
    transactionCountOther: '{{count}} entries',
    noTransactions: 'No transactions have been posted to this account yet.',
    runningBalance: 'Balance',
    receiptReference: 'Receipt',
    receiptHint: 'Tap an entry with a receipt to view it.',
    newestFirst: 'Newest first',
  },

  profile: {
    branch: 'BRANCH',
    lastSynced: 'LAST SYNCED',
    appVersion: 'APP VERSION',
    build: 'Build {{buildNumber}}',
    appearance: 'Appearance',
    themeDark: 'Dark',
    themeLight: 'Light',
    helpSupport: 'Help & Support',
    logOut: 'Log Out',
    logOutMessage: 'Are you sure you want to log out? You can log back in using your MPIN.',
    cancel: 'Cancel',
  },

  language: {
    label: 'Language',
    selectTitle: 'Select Language',
    selectMessage: 'Static app text will be shown in the language you choose.',
  },

  kycType: {
    AADHAR: 'Aadhaar',
    PAN: 'PAN',
    VOTER_ID: 'Voter ID',
    OTHER: 'Other',
  },

  customerStatus: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    BLOCKED: 'Blocked',
  },

  accountStatus: {
    ACTIVE: 'Active',
    CLOSED: 'Closed',
    BLOCKED: 'Blocked',
  },

  schemeFrequency: {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
  },

  ledgerEntryType: {
    CREDIT: 'Collection',
    PENALTY: 'Penalty',
    ADJUSTMENT: 'Adjustment',
    REVERSAL: 'Reversal',
  },
};

export default en;

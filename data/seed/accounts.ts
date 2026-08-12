import { AccountStatus } from '@/types';
import { DEMO_SCHEME_DAILY_ID, SEED_ACCOUNT_REF, SEED_CUSTOMER_REF } from './ids';
import type { SeedAccount } from './types';

/** One pigmy account per seeded customer, with varying installments for a realistic round. */
export const seedAccounts: SeedAccount[] = [
  {
    ref: SEED_ACCOUNT_REF.SURESH_PATIL_PIGMY,
    customerRef: SEED_CUSTOMER_REF.SURESH_PATIL,
    schemeId: DEMO_SCHEME_DAILY_ID,
    installmentAmount: 500,
    status: AccountStatus.ACTIVE,
  },
  {
    ref: SEED_ACCOUNT_REF.ANITA_DESAI_PIGMY,
    customerRef: SEED_CUSTOMER_REF.ANITA_DESAI,
    schemeId: DEMO_SCHEME_DAILY_ID,
    installmentAmount: 450,
    status: AccountStatus.ACTIVE,
  },
  {
    ref: SEED_ACCOUNT_REF.RAJESH_KUMAR_PIGMY,
    customerRef: SEED_CUSTOMER_REF.RAJESH_KUMAR,
    schemeId: DEMO_SCHEME_DAILY_ID,
    installmentAmount: 400,
    status: AccountStatus.ACTIVE,
  },
  {
    ref: SEED_ACCOUNT_REF.RAMESH_GENERAL_STORES_PIGMY,
    customerRef: SEED_CUSTOMER_REF.RAMESH_GENERAL_STORES,
    schemeId: DEMO_SCHEME_DAILY_ID,
    installmentAmount: 350,
    status: AccountStatus.ACTIVE,
  },
  {
    ref: SEED_ACCOUNT_REF.PRIYA_TEXTILES_PIGMY,
    customerRef: SEED_CUSTOMER_REF.PRIYA_TEXTILES,
    schemeId: DEMO_SCHEME_DAILY_ID,
    installmentAmount: 300,
    status: AccountStatus.ACTIVE,
  },
];

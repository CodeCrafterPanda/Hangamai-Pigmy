import { CustomerStatus } from '@/types';
import {
  DEMO_AGENT_ID,
  DEMO_AGENT_THREE_ID,
  DEMO_AGENT_TWO_ID,
  DEMO_BRANCH_ID,
  DEMO_ROUTE_HANGA,
  DEMO_ROUTE_SUPA,
  SEED_CUSTOMER_REF,
} from './ids';
import type { SeedCustomer } from './types';

/**
 * The demo customer book.
 *
 * `primaryAgentId` decides which flow a customer exercises: the three owned by DEMO_AGENT_ID
 * are the primary round, and the two owned by the other agents are reached only through the
 * delegations in `delegations.ts`.
 *
 * `fullName` + `phone` together identify a seeded customer on a recovery re-seed, so they must
 * stay unique within this list.
 */
export const seedCustomers: SeedCustomer[] = [
  {
    ref: SEED_CUSTOMER_REF.SURESH_PATIL,
    branchId: DEMO_BRANCH_ID,
    routeId: DEMO_ROUTE_SUPA,
    primaryAgentId: DEMO_AGENT_ID,
    fullName: 'Suresh Patil',
    phone: '9876543210',
    addressLine1: 'Shop #4, Market Street',
    addressLine2: 'Gandhi Nagar',
    city: 'Mumbai',
    pincode: '400001',
    state: 'Maharashtra',
    status: CustomerStatus.ACTIVE,
  },
  {
    ref: SEED_CUSTOMER_REF.ANITA_DESAI,
    branchId: DEMO_BRANCH_ID,
    routeId: DEMO_ROUTE_SUPA,
    primaryAgentId: DEMO_AGENT_ID,
    fullName: 'Anita Desai',
    phone: '9876543211',
    addressLine1: 'Market Lane, Shop 12',
    addressLine2: 'Near City Center',
    city: 'Mumbai',
    pincode: '400002',
    state: 'Maharashtra',
    status: CustomerStatus.ACTIVE,
  },
  {
    ref: SEED_CUSTOMER_REF.RAJESH_KUMAR,
    branchId: DEMO_BRANCH_ID,
    routeId: DEMO_ROUTE_SUPA,
    primaryAgentId: DEMO_AGENT_ID,
    fullName: 'Rajesh Kumar',
    phone: '9876543212',
    addressLine1: 'Home, Sector 15',
    addressLine2: 'Residential Area',
    city: 'Mumbai',
    pincode: '400003',
    state: 'Maharashtra',
    status: CustomerStatus.ACTIVE,
  },
  {
    ref: SEED_CUSTOMER_REF.RAMESH_GENERAL_STORES,
    branchId: DEMO_BRANCH_ID,
    routeId: DEMO_ROUTE_HANGA,
    primaryAgentId: DEMO_AGENT_TWO_ID,
    fullName: 'Ramesh General Stores',
    phone: '9876543213',
    addressLine1: 'Shop #45, Main Road',
    addressLine2: 'Industrial Area',
    city: 'Mumbai',
    pincode: '400004',
    state: 'Maharashtra',
    status: CustomerStatus.ACTIVE,
  },
  {
    ref: SEED_CUSTOMER_REF.PRIYA_TEXTILES,
    branchId: DEMO_BRANCH_ID,
    routeId: DEMO_ROUTE_HANGA,
    primaryAgentId: DEMO_AGENT_THREE_ID,
    fullName: 'Priya Textiles',
    phone: '9876543214',
    addressLine1: 'Shop 78, Textile Market',
    addressLine2: 'Commercial Zone',
    city: 'Mumbai',
    pincode: '400005',
    state: 'Maharashtra',
    status: CustomerStatus.ACTIVE,
  },
];

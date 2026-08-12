import { DEMO_BRANCH_ID, DEMO_ROUTE_HANGA, DEMO_ROUTE_PARNER, DEMO_ROUTE_SUPA } from './ids';
import type { SeedRoute } from './types';

export const seedRoutes: SeedRoute[] = [
  {
    id: DEMO_ROUTE_SUPA,
    branchId: DEMO_BRANCH_ID,
    routeCode: 'SUPA',
    name: 'SUPA ROUTE',
  },
  {
    id: DEMO_ROUTE_PARNER,
    branchId: DEMO_BRANCH_ID,
    routeCode: 'PARNER',
    name: 'PARNER ROUTE',
  },
  {
    id: DEMO_ROUTE_HANGA,
    branchId: DEMO_BRANCH_ID,
    routeCode: 'HANGA',
    name: 'HANGA ROUTE',
  },
];

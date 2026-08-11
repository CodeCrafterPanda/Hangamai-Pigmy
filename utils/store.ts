import { configureStore } from '@reduxjs/toolkit';
import app from '@/slices/app.slice';
import customers from '@/slices/customers.slice';
import accounts from '@/slices/accounts.slice';
import delegations from '@/slices/delegations.slice';
import collections from '@/slices/collections.slice';
import ledger from '@/slices/ledger.slice';
import settlements from '@/slices/settlements.slice';
import syncQueue from '@/slices/syncQueue.slice';
import audit from '@/slices/audit.slice';
import settings from '@/slices/settings.slice';
import config from '@/utils/config';
import { Env } from '@/types/env';
import logger from 'redux-logger';

const store = configureStore({
  reducer: {
    app,
    customers,
    accounts,
    delegations,
    collections,
    ledger,
    settlements,
    syncQueue,
    audit,
    settings,
  },
  middleware: getDefaultMiddleware =>
    config.env === Env.dev ? getDefaultMiddleware() : getDefaultMiddleware().concat(logger),
  devTools: config.env === Env.dev,
});

export type State = ReturnType<typeof store.getState>;
export type Dispatch = typeof store.dispatch;

export default store;

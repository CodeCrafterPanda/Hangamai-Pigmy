import { useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { User } from '@/types';

/** Explicit hydration/init lifecycle — additive to splash-screen gating */
export type AppInitStatus =
  | 'NOT_INITIALIZED'
  | 'INITIALIZING'
  | 'HYDRATING'
  | 'READY'
  | 'FAILED';

export interface AppState {
  checked: boolean;
  loggedIn: boolean;
  status: AppInitStatus;
  user?: User;
}

const initialState: AppState = {
  checked: false,
  loggedIn: false,
  status: 'NOT_INITIALIZED',
  user: undefined,
};

const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoggedIn: (state: AppState, { payload }: PayloadAction<boolean>) => {
      state.checked = true;
      state.loggedIn = payload;
    },
    setInitStatus: (state: AppState, { payload }: PayloadAction<AppInitStatus>) => {
      state.status = payload;
    },
    setUser: (state: AppState, { payload }: PayloadAction<User | undefined>) => {
      state.user = payload;
    },
    reset: () => initialState,
  },
});

export function useAppSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ app }: State) => app);
  return { dispatch, ...state, ...slice.actions };
}

export const { setLoggedIn, setInitStatus, setUser, reset } = slice.actions;

export default slice.reducer;

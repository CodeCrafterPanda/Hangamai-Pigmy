import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { loadImages, loadFonts } from '@/theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hasCompletedSeed, initializeStorage, markSeedCompleted } from '@/utils/storage';
import { seedDummyData } from '@/utils/seedData';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { setInitStatus, setLoggedIn } from '@/slices/app.slice';
import {
  hydrateSettings,
  hydrateCustomers,
  hydrateAccounts,
  hydrateDelegations,
  hydrateCollections,
  hydrateLedger,
  hydrateSettlements,
  hydrateSyncQueue,
  hydrateAuditLogs,
} from '@/slices';
import { selectSession } from '@/slices/settings.slice';
import Provider from '@/providers';
import { useTheme } from '@/theme';

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

function Router() {
  const { isDark } = useTheme();
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const session = useSelector(selectSession);

  /**
   * Initialize app: Load assets and hydrate data stores
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function initializeApp() {
      try {
        console.log('[App] Starting initialization...');
        dispatch(setInitStatus('INITIALIZING'));

        // Set timeout to ensure we don't hang forever
        timeoutId = setTimeout(() => {
          console.warn('[App] Initialization timeout - forcing to auth screen');
          dispatch(setInitStatus('FAILED'));
          dispatch(setLoggedIn(false));
          SplashScreen.hideAsync();
        }, 10000); // 10 second timeout

        // Load assets
        console.log('[App] Loading assets...');
        await Promise.all([loadImages(), loadFonts()]);
        console.log('[App] Assets loaded');

        // Initialize storage schema
        console.log('[App] Initializing storage...');
        await initializeStorage();
        console.log('[App] Storage initialized');

        // Hydrate all slices from AsyncStorage
        console.log('[App] Hydrating slices...');
        dispatch(setInitStatus('HYDRATING'));
        const hydrateResults = await Promise.allSettled([
          dispatch(hydrateSettings()),
          dispatch(hydrateCustomers()),
          dispatch(hydrateAccounts()),
          dispatch(hydrateDelegations()),
          dispatch(hydrateCollections()),
          dispatch(hydrateLedger()),
          dispatch(hydrateSettlements()),
          dispatch(hydrateSyncQueue()),
          dispatch(hydrateAuditLogs()),
        ]);

        // Log any failed hydrations
        hydrateResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`[App] Slice ${index} hydration failed:`, result.reason);
          }
        });
        console.log('[App] Slices hydrated');

        // Clear timeout
        clearTimeout(timeoutId);

        // Seed once when uninitialized, or recover if the seed marker exists but
        // required persisted domain baseline failed to hydrate (prior marker-only bug).
        // Do NOT reseed when hydrated domain state is present.
        const alreadySeeded = await hasCompletedSeed();
        const stateAfterHydrate = store.getState();
        const baselineMissing =
          stateAfterHydrate.settings.branches.allIds.length === 0 ||
          stateAfterHydrate.settings.agents.allIds.length === 0 ||
          stateAfterHydrate.settings.routes.allIds.length === 0 ||
          !stateAfterHydrate.settings.session?.branchId ||
          !stateAfterHydrate.settings.session?.agentId;

        if (!alreadySeeded || baselineMissing) {
          console.log(
            alreadySeeded
              ? '[App] Seed marker present but required domain baseline missing after hydrate — recovering seed once...'
              : '[App] Seeding dummy data...',
          );
          await seedDummyData(dispatch, store.getState);
          await markSeedCompleted();
          console.log('[App] Dummy data seeded and persisted');
        } else {
          console.log('[App] Seed already completed and domain hydrated - skipping seedDummyData');
        }

        // TODO: Auth temporarily disabled - always set logged in to true
        // When re-enabling auth, uncomment the session check below:
        /*
        // Check session and set logged in state
        console.log('[App] Checking session:', session);
        if (session?.agentId && session?.branchId) {
          console.log('[App] User is logged in');
          dispatch(setLoggedIn(true));
        } else {
          console.log('[App] User is not logged in');
          dispatch(setLoggedIn(false));
        }
        */

        // For now: Skip auth and set as logged in
        console.log('[App] Auth disabled - setting logged in to true');
        dispatch(setLoggedIn(true));
        dispatch(setInitStatus('READY'));

        // Hide splash screen
        console.log('[App] Hiding splash screen');
        await SplashScreen.hideAsync();
        console.log('[App] Initialization complete');
      } catch (error) {
        console.error('[App] Initialization error:', error);
        clearTimeout(timeoutId);
        // Non-destructive: narrate failure only — do not clear persisted local data
        dispatch(setInitStatus('FAILED'));
        dispatch(setLoggedIn(false));
        await SplashScreen.hideAsync();
      }
    }

    initializeApp();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider>
        <Router />
      </Provider>
    </SafeAreaProvider>
  );
}

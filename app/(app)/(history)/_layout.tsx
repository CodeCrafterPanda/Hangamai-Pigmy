import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import HistoryHeader from '@/components/elements/HistoryHeader';

/**
 * Anchor this stack at the History root.
 *
 * The Home "In Hand" tile pushes straight to `settlement`, which lives in this stack but is
 * reached from another tab. Without an anchor the section is built holding only that one
 * route, so History had no root beneath it: selecting the History tab reopened Settlement,
 * and the tab-press reset in `app/(app)/_layout.tsx` correctly did nothing because a
 * single-entry stack is already at its top. Anchoring puts `index` underneath any route
 * entered this way, which is what makes History open at History and back leave Settlement.
 */
export const unstable_settings = {
  anchor: 'index',
};

export default function HistoryStack() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background.app,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: () => <HistoryHeader />,
        }}
      />
      <Stack.Screen
        name="monthly-collections"
        options={{
          title: 'Monthly Collections',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="receipt-detail/[id]"
        options={{
          title: 'Receipt Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="offline-queue"
        options={{
          title: 'Offline Queue',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settlement-history"
        options={{
          title: 'Settlement History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settlement"
        options={{
          title: 'Settlement',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settlement-detail/[id]"
        options={{
          title: 'Settlement Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
}


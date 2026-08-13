import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';
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
  const { t } = useTranslation();

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
          title: t('monthlyCollections.title'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="receipt-detail/[id]"
        options={{
          title: t('receipt.title'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="offline-queue"
        options={{
          title: t('offlineQueue.title'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settlement-history"
        options={{
          title: t('settlementHistory.title'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settlement"
        options={{
          title: t('settlement.title'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settlement-detail/[id]"
        options={{
          title: t('settlementDetail.title'),
          headerShown: false,
        }}
      />
    </Stack>
  );
}


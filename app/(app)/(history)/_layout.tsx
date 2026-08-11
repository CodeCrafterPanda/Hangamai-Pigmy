import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import HistoryHeader from '@/components/elements/HistoryHeader';

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
    </Stack>
  );
}


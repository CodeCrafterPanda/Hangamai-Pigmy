import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import ProfileHeader from '@/components/elements/ProfileHeader';
import type { UserProfile } from '@/types/HomeData';
import { useTheme } from '@/theme';
import { selectCurrentAgent, selectCurrentBranch } from '@/slices/settings.slice';

export default function HomeStack() {
  const { theme } = useTheme();
  const agent = useSelector(selectCurrentAgent);
  const branch = useSelector(selectCurrentBranch);

  const userProfile: UserProfile = {
    name: agent?.name || 'Agent',
    branch: branch?.name || '—',
    // The MVP is offline-first with no backend: there is nothing to be online with.
    isOnline: false,
  };

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
          headerTitle: () => <ProfileHeader profile={userProfile} />,
        }}
      />
      <Stack.Screen
        name="customer-detail/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="collect-deposit/[accountId]"
        options={{
          title: 'Collect Deposit',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

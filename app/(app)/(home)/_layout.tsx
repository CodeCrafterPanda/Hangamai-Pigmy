import { Stack } from 'expo-router';
import ProfileHeader from '@/components/elements/ProfileHeader';
import type { UserProfile } from '@/types/HomeData';
import { useTheme } from '@/theme';

export default function HomeStack() {
  const { theme } = useTheme();

  // Mock data - TODO: Replace with actual data from Redux/Context
  const userProfile: UserProfile = {
    name: 'Rahul K.',
    branch: 'Shivaji Nagar Branch',
    isOnline: true,
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


import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function ProfileStack() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background.app,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Sync Status',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: 'Help & Support',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
          headerShown: true,
        }}
      />
    </Stack>
  );
}


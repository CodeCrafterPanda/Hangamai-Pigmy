import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function CustomersStack() {
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
          title: 'Customers',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

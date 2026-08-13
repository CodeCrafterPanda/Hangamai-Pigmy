import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';

export default function CustomersStack() {
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
          title: t('customers.title'),
          headerShown: true,
        }}
      />
    </Stack>
  );
}

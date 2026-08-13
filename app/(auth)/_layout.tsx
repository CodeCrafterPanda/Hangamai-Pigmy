import { Stack } from 'expo-router';
import { useTranslation } from '@/i18n';

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" options={{ headerShown: true, title: t('auth.agentLogin') }} />
      <Stack.Screen name="mpin" options={{ headerShown: true, title: t('auth.mpin') }} />
    </Stack>
  );
}


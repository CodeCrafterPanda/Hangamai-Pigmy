import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';
import SyncHeader from '@/components/elements/SyncHeader';

export default function ProfileStack() {
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
          fontWeight: '700',
          fontSize: 20,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: () => <SyncHeader />,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: t('help.title'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: t('about.title'),
          headerShown: true,
        }}
      />
    </Stack>
  );
}


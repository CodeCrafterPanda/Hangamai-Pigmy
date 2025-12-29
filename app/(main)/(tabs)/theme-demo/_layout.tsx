import { Stack } from 'expo-router';
import { useTheme, typography } from '@/theme';

export default function ThemeDemoStackLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colors.text.primary,
        headerStyle: { backgroundColor: theme.colors.brand.primary },
        headerTitleStyle: {
          fontSize: typography(theme, 'sectionTitle').fontSize,
          fontWeight: typography(theme, 'sectionTitle').fontWeight,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Theme Demo',
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
}


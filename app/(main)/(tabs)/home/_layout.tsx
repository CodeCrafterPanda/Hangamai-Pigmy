import { Stack, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import NavigationHeaderLeft from '@/components/layouts/NavigationHeaderLeft';
import NavigationHeaderTitle from '@/components/layouts/NavigationHeaderTitle';
import { useTheme, typography } from '@/theme';

export default function HomeStackLayout() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const toggleDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
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
          title: 'Home',
          headerTitle: () => <NavigationHeaderTitle />,
          headerLeft: () => <NavigationHeaderLeft onPress={toggleDrawer} />,
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}

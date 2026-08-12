import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native';
import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabListenerProps {
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase>;
}

/**
 * Selecting a root section always opens that section's root screen.
 *
 * Each tab owns a Stack, and a tab switch alone does not unwind it, so a section would
 * otherwise reopen on whatever nested screen was last visited (Settlement under History,
 * Customer Detail under Route). Popping the target section's stack on tab press is scoped
 * to root-navigator selection only: pushes and back gestures inside a section are
 * untouched, because no tab press is involved in them.
 */
function resetSectionOnTabPress({ navigation, route }: TabListenerProps) {
  return {
    tabPress: () => {
      const section = navigation.getState().routes.find(r => r.key === route.key);
      const stack = section?.state;

      if (stack?.type !== 'stack' || !stack.key) return;
      if ((stack.index ?? 0) === 0) return;

      navigation.dispatch({ ...StackActions.popToTop(), target: stack.key });
    },
  };
}

export default function AppLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.card,
          borderTopColor: theme.colors.background.divider,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        listeners={resetSectionOnTabPress}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(route)"
        listeners={resetSectionOnTabPress}
        options={{
          title: 'Route',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(history)"
        listeners={resetSectionOnTabPress}
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        listeners={resetSectionOnTabPress}
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


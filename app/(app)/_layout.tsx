import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';
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
 * Customer Detail under Route). Jump to that stack's `index` from the tab navigator
 * itself — do not dispatch POP_TO_TOP at a nested stack key. Tab state can still list
 * nested routes after the native stack has already remounted at the root, which makes
 * POP_TO_TOP unhandled ("Is there any screen to go back to?").
 */
function resetSectionOnTabPress({ navigation, route }: TabListenerProps) {
  return {
    tabPress: () => {
      const section = navigation.getState().routes.find(r => r.key === route.key);
      const stack = section?.state;
      const currentName = stack?.routes?.[stack.index ?? 0]?.name;

      if (stack?.type !== 'stack' || !currentName || currentName === 'index') {
        return;
      }

      navigation.navigate(route.name, { screen: 'index' });
    },
  };
}

export default function AppLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(route)"
        listeners={resetSectionOnTabPress}
        options={{
          title: t('tabs.route'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(customers)"
        listeners={resetSectionOnTabPress}
        options={{
          title: t('tabs.customers'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(history)"
        listeners={resetSectionOnTabPress}
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        listeners={resetSectionOnTabPress}
        options={{
          title: t('tabs.sync'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


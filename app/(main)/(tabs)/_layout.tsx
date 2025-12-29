import { Tabs } from 'expo-router';
import { AntDesign, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarInactiveBackgroundColor: theme.colors.background.card,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarActiveBackgroundColor: theme.colors.background.card,
        tabBarStyle: {
          backgroundColor: theme.colors.background.card,
          borderTopColor: theme.colors.background.divider,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AntDesign name="home" size={theme.icons.primarySize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="map-marker-path" size={theme.icons.primarySize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AntDesign name="profile" size={theme.icons.primarySize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="theme-demo"
        options={{
          title: 'Theme',
          tabBarIcon: ({ color }) => <MaterialIcons name="palette" size={theme.icons.primarySize} color={color} />,
        }}
      />
    </Tabs>
  );
}

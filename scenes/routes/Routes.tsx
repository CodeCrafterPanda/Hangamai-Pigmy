import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import RouteCard from '@/components/elements/RouteCard';
import FloatingActionButton from '@/components/elements/FloatingActionButton';
import type { Route, RoutesHeader } from '@/types/RouteData';

export default function Routes() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data from Redux/API
  const headerData: RoutesHeader = {
    date: 'Oct 24, 2023',
    isOnline: true,
  };

  const routes: Route[] = [
    {
      id: '1',
      routeId: 'R-1024',
      name: 'Market Area - Zone A',
      status: 'in_progress',
      progress: 68,
      totalCustomers: 45,
      pendingCustomers: 12,
    },
    {
      id: '2',
      routeId: 'R-2055',
      name: 'Industrial Estate',
      status: 'completed',
      progress: 100,
      totalCustomers: 30,
      pendingCustomers: 0,
    },
    {
      id: '3',
      routeId: 'R-3100',
      name: 'North Extension',
      status: 'not_started',
      progress: 0,
      totalCustomers: 52,
      pendingCustomers: 52,
    },
  ];

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.routeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingBottom: spacing(theme, 'xxl') + 80, // Extra space for FAB
    },
    header: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
      gap: spacing(theme, 'xxs'),
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    onlineStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.status.success,
    },
    onlineText: {
      ...typography(theme, 'body'),
      color: theme.colors.status.success,
      fontWeight: '600',
    },
    syncIcon: {
      fontSize: 20,
    },
    date: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    searchContainer: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      height: 48,
      gap: spacing(theme, 'xs'),
    },
    searchIcon: {
      fontSize: 18,
      color: theme.colors.text.muted,
    },
    searchInput: {
      flex: 1,
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      height: '100%',
    },
    routesList: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'md'),
    },
    emptyState: {
      padding: spacing(theme, 'xxl'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 48,
      opacity: 0.3,
    },
    emptyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  const handleRoutePress = (routeId: string) => {
    console.log('Route pressed:', routeId);
    // TODO: Navigate to route details
  };

  const handleAddRoute = () => {
    console.log('Add new route pressed');
    // TODO: Navigate to add route screen
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>My Routes</Text>
            <View style={styles.headerRight}>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>ONLINE</Text>
              </View>
              <Text style={styles.syncIcon}>🔄</Text>
            </View>
          </View>
          <Text style={styles.date}>{headerData.date}</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Route ID or Name"
              placeholderTextColor={theme.colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.routesList}>
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route) => (
              <RouteCard key={route.id} route={route} onPress={handleRoutePress} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                No routes found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={handleAddRoute} />
    </SafeAreaView>
  );
}


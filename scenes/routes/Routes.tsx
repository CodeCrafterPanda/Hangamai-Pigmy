import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import RouteCard from '@/components/elements/RouteCard';
import FloatingActionButton from '@/components/elements/FloatingActionButton';
import { selectAllRoutes, selectSession } from '@/slices/settings.slice';
import { selectAllCustomers, selectCustomersByAgent } from '@/slices/customers.slice';
import { selectTodayCollectionsByAgent } from '@/slices/collections.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import type { Route } from '@/types/RouteData';

export default function Routes() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Get session and settings
  const session = useSelector(selectSession);
  const timezone = useSelector((state: State) => state.settings.branchSettings.timezone);
  const agentId = session.agentId || 'demo-agent';

  // Get data from Redux
  const allRoutes = useSelector(selectAllRoutes);
  const allCustomers = useSelector(selectAllCustomers);
  const todayCollections = useSelector((state: State) =>
    selectTodayCollectionsByAgent(state, agentId, timezone)
  );

  // Get customers assigned to logged-in agent (primary + delegated)
  const primaryCustomers = useSelector((state: State) => selectCustomersByAgent(state, agentId));
  const myDelegations = useSelector((state: State) => 
    selectDelegationsBySecondaryAgent(state, agentId)
  );
  const delegatedCustomerIds = useMemo(() => {
    return myDelegations.map(d => d.customerId);
  }, [myDelegations]);
  
  const myCustomerIds = useMemo(() => {
    const primary = primaryCustomers.map(c => c.id);
    return new Set([...primary, ...delegatedCustomerIds]);
  }, [primaryCustomers, delegatedCustomerIds]);

  // Calculate route statistics
  const routes: Route[] = useMemo(() => {
    return allRoutes
      .map(route => {
        // Get customers in this route that are assigned to logged-in agent
        const routeCustomers = allCustomers.filter(
          c => c.routeId === route.id && myCustomerIds.has(c.id)
        );
        const totalCustomers = routeCustomers.length;

      // Get collected customer IDs today
      const collectedCustomerIds = new Set(
        todayCollections
          .filter(c => c.status !== 'REVERSED')
          .map(c => c.customerId)
      );

      // Count pending customers (not collected today)
      const pendingCustomers = routeCustomers.filter(
        c => !collectedCustomerIds.has(c.id)
      ).length;

      // Calculate progress
      const collectedCount = totalCustomers - pendingCustomers;
      const progress = totalCustomers > 0 ? Math.round((collectedCount / totalCustomers) * 100) : 0;

      // Determine status
      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in_progress';
      }

      return {
        id: route.id,
        routeId: route.routeCode,
        name: route.name,
        status,
        progress,
        totalCustomers,
        pendingCustomers,
      };
    })
    .filter(route => route.totalCustomers > 0); // Only show routes with customers assigned to this agent
  }, [allRoutes, allCustomers, todayCollections, myCustomerIds]);

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
      paddingVertical: spacing(theme, 'xl'),
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
    router.push(`/(app)/(route)/route-customers/${routeId}`);
  };

  const handleAddRoute = () => {
    console.log('Add new route pressed');
    // TODO: Navigate to add route screen
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
    </View>
  );
}


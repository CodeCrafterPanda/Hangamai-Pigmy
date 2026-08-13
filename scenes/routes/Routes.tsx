import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import RouteCard from '@/components/elements/RouteCard';
import FloatingActionButton from '@/components/elements/FloatingActionButton';
import { selectRoutesByBranch, selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { selectAllCustomers, selectCustomersByAgent } from '@/slices/customers.slice';
import { selectTodayCollectionsByAgent } from '@/slices/collections.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import type { Route } from '@/types/RouteData';

export default function Routes() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Get session and settings
  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agentId = session.agentId || 'demo-agent';
  const branchId = session.branchId || '';

  // Get data from Redux — branch-scoped so newly created empty routes remain visible
  const branchRoutes = useSelector((state: State) => selectRoutesByBranch(state, branchId));
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

  // Calculate route statistics (preserve real progress formula; do not hide zero-customer routes)
  const routes: Route[] = useMemo(() => {
    return branchRoutes.map(route => {
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
    });
  }, [branchRoutes, allCustomers, todayCollections, myCustomerIds]);

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
      paddingTop: spacing(theme, 'sm'),
      paddingBottom: spacing(theme, 'screenPadding') + 56 + spacing(theme, 'sm'),
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
      gap: spacing(theme, 'sm'),
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
    router.push('/(app)/(route)/add-route');
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
                {searchQuery
                  ? t('routes.emptySearch', { query: searchQuery })
                  : t('routes.empty')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={handleAddRoute} />
    </View>
  );
}


import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing } from '@/theme';
import { useTranslation } from '@/i18n';
import CustomerListCard from '@/components/elements/CustomerListCard';
import FloatingActionButton from '@/components/elements/FloatingActionButton';
import { selectSession, selectAllRoutes } from '@/slices/settings.slice';
import { selectAllCustomers, selectCustomersByAgent } from '@/slices/customers.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import type { CustomerListItem } from '@/types/CustomerListData';

export default function Customers() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const session = useSelector(selectSession);
  const agentId = session.agentId || 'demo-agent';

  const allRoutes = useSelector(selectAllRoutes);
  const allCustomers = useSelector(selectAllCustomers);

  // Same operational scope as Routes/RouteDetails: the agent's own customers plus the ones
  // delegated to them
  const primaryCustomers = useSelector((state: State) => selectCustomersByAgent(state, agentId));
  const myDelegations = useSelector((state: State) =>
    selectDelegationsBySecondaryAgent(state, agentId),
  );

  const customers: CustomerListItem[] = useMemo(() => {
    const delegatedCustomerIds = new Set(myDelegations.map(d => d.customerId));
    const scopedCustomers = new Map(primaryCustomers.map(c => [c.id, c]));

    allCustomers
      .filter(c => delegatedCustomerIds.has(c.id))
      .forEach(c => scopedCustomers.set(c.id, c));

    return Array.from(scopedCustomers.values())
      .map(customer => ({
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.fullName,
        routeName: allRoutes.find(r => r.id === customer.routeId)?.name || t('customers.noRoute'),
        status: customer.status,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [primaryCustomers, myDelegations, allCustomers, allRoutes, t]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'lg'),
    },
    customersList: {
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

  const handleCustomerPress = (customerId: string) => {
    router.push(`/(app)/(route)/customer-detail/${customerId}`);
  };

  const handleAddCustomer = () => {
    router.push('/(app)/(route)/add-customer');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.customersList}>
          {customers.length > 0 ? (
            customers.map(customer => (
              <CustomerListCard
                key={customer.id}
                customer={customer}
                onPress={handleCustomerPress}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>{t('customers.empty')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={handleAddCustomer} />
    </View>
  );
}

import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import FilterChip from '@/components/elements/FilterChip';
import CustomerCollectionCard from '@/components/elements/CustomerCollectionCard';
import RouteDetailsHeader from '@/components/elements/RouteDetailsHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import CollectDeposit from '@/scenes/collect-deposit';
import Receipt from '@/scenes/receipt';
import FloatingActionButton from '@/components/elements/FloatingActionButton';
import {
  selectTodayCollectionsByAgent,
  selectCollectionsNeedingSync,
} from '@/slices/collections.slice';
import { selectCustomersByAgent, selectAllCustomers } from '@/slices/customers.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import { selectAllAccounts } from '@/slices/accounts.slice';
import { selectSession } from '@/slices/settings.slice';
import type {
  CustomerCollection,
  RouteDetailsHeader as RouteDetailsHeaderType,
  CollectionStatus,
} from '@/types/CollectionData';

interface RouteDetailsProps {
  routeId?: string;
}

export default function RouteDetails({ routeId }: RouteDetailsProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'pending' | 'collected' | 'all'>('all');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Get session and settings
  const session = useSelector(selectSession);
  const timezone = useSelector((state: State) => state.settings.branchSettings.timezone);
  const agentId = session.agentId || 'demo-agent';

  // Get all customers (both primary and delegated) for this route
  const primaryCustomers = useSelector((state: State) => selectCustomersByAgent(state, agentId));

  // Get delegations where logged-in agent is the secondary agent
  const myDelegations = useSelector((state: State) =>
    selectDelegationsBySecondaryAgent(state, agentId)
  );

  // Get delegated customers
  const allCustomersData = useSelector(selectAllCustomers);
  const delegatedCustomers = useMemo(() => {
    const delegatedCustomerIds = myDelegations.map(d => d.customerId);
    return allCustomersData.filter(c => delegatedCustomerIds.includes(c.id));
  }, [myDelegations, allCustomersData]);

  // Combine primary and delegated customers for this route
  const allRouteCustomers = useMemo(() => {
    return [...primaryCustomers, ...delegatedCustomers].filter(
      c => !routeId || c.routeId === routeId
    );
  }, [primaryCustomers, delegatedCustomers, routeId]);

  // Get all accounts
  const allAccounts = useSelector(selectAllAccounts);

  // Get today's collections
  const todayCollections = useSelector((state: State) =>
    selectTodayCollectionsByAgent(state, agentId, timezone)
  );

  // Use all route customers (no tab filtering)
  const activeCustomers = allRouteCustomers;

  // Mock header data - TODO: Get from route params
  const headerData: RouteDetailsHeaderType = {
    routeName: 'Market Road Route',
    routeNumber: '04',
    totalStops: activeCustomers.length,
    isOnline: true,
  };

  // Convert to CustomerCollection format with real data
  const customers: CustomerCollection[] = useMemo(() => {
    return activeCustomers.map(customer => {
      // Find customer's active accounts
      const customerAccounts = allAccounts.filter(
        a => a.customerId === customer.id && a.status === 'ACTIVE'
      );
      const firstAccount = customerAccounts[0];

      // Check if customer was collected today
      const todayCollection = firstAccount
        ? todayCollections.find(
          c =>
            c.customerId === customer.id &&
            c.accountId === firstAccount.id &&
            c.status !== 'REVERSED'
        )
        : null;

      const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

      return {
        id: customer.id,
        customerId: customer.customerCode,
        customerName: customer.fullName,
        accountType: 'Pigmy',
        accountNumber: firstAccount?.accountNumber || 'N/A',
        status: todayCollection ? 'collected' : 'pending',
        dailyDueAmount: firstAccount?.installmentAmount || 0,
        collectedAmount: todayCollection ? todayCollection.amount : undefined,
        initials: getInitials(customer.fullName),
      };
    });
  }, [activeCustomers, allAccounts, todayCollections]);

  // Calculate filters based on current data
  const filters = useMemo(() => {
    const dueToday = customers.filter(c => c.status === 'pending').length;
    const collected = customers.filter(c => c.status === 'collected').length;

    return {
      dueToday,
      collected,
    };
  }, [customers]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesFilter = activeFilter === 'all' || customer.status === activeFilter;
    return matchesFilter;
  });

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
      paddingBottom: spacing(theme, 'md'),
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      paddingHorizontal: spacing(theme, 'md'),
      height: 48,
      gap: spacing(theme, 'xs'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
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
    voiceButton: {
      padding: spacing(theme, 'xxs'),
    },
    voiceIcon: {
      fontSize: 18,
      color: theme.colors.text.muted,
    },
    filtersContainer: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    filtersScroll: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    customersList: {
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

  const handleCollect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsBottomSheetOpen(true);
  };

  const handleCollectAll = (customerId: string) => {
    console.log('Collect All pressed for customer:', customerId);
    // TODO: Navigate to collection screen with all overdue
  };

  const handleReceipt = (customerId: string) => {
    console.log('Receipt pressed for customer:', customerId);

    // Find the collection for this customer today
    const customer = activeCustomers.find(c => c.id === customerId);
    if (!customer) return;

    const customerAccounts = allAccounts.filter(
      a => a.customerId === customerId && a.status === 'ACTIVE'
    );
    const firstAccount = customerAccounts[0];

    if (firstAccount) {
      const collection = todayCollections.find(
        c =>
          c.customerId === customerId &&
          c.accountId === firstAccount.id &&
          c.status !== 'REVERSED'
      );

      if (collection) {
        setSelectedCollectionId(collection.id);
        setIsReceiptOpen(true);
      }
    }
  };

  const handleVoiceSearch = () => {
    console.log('Voice search pressed');
    // TODO: Implement voice search
  };

  const handleSync = () => {
    console.log('Sync pressed');
    // TODO: Implement sync functionality
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
    setSelectedCustomerId(null);
  };

  const handleAddCustomer = () => {
    router.push('/(app)/(route)/add-customer');
  };

  const handleEdit = (customerId: string) => {
    console.log('Edit customer:', customerId);
    // TODO: Navigate to edit customer screen
    router.push(`/(app)/(route)/edit-customer/${customerId}`);
  };

  const handleDelete = (customerId: string) => {
    console.log('Delete customer:', customerId);
    // TODO: Show confirmation and delete customer
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RouteDetailsHeader
        routeName={headerData.routeName}
        routeNumber={headerData.routeNumber}
        totalStops={headerData.totalStops}
        onSyncPress={handleSync}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersScroll}>
              <FilterChip
                label="Due Today"
                count={filters.dueToday}
                variant="due"
                isActive={activeFilter === 'pending'}
                onPress={() =>
                  setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')
                }
              />
              <FilterChip
                label="Collected"
                count={filters.collected}
                variant="collected"
                isActive={activeFilter === 'collected'}
                onPress={() =>
                  setActiveFilter(activeFilter === 'collected' ? 'all' : 'collected')
                }
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.customersList}>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <CustomerCollectionCard
                key={customer.id}
                customer={customer}
                onCollect={handleCollect}
                onCollectAll={handleCollectAll}
                onReceipt={handleReceipt}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                No customers found{searchQuery ? ` matching "${searchQuery}"` : ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
        {selectedCustomerId && (() => {
          const customer = activeCustomers.find(c => c.id === selectedCustomerId);
          const customerAccounts = allAccounts.filter(
            a => a.customerId === selectedCustomerId && a.status === 'ACTIVE'
          );
          const account = customerAccounts[0];

          // Find delegation if this is a delegated customer
          const delegation = myDelegations.find(d => d.customerId === selectedCustomerId);

          return customer && account ? (
            <CollectDeposit
              onClose={handleCloseBottomSheet}
              customer={customer}
              account={account}
              delegationId={delegation?.id}
            />
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: theme.colors.text.primary }}>
                Customer or account data not found
              </Text>
            </View>
          );
        })()}
      </BottomSheet>

      <BottomSheet isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)}>
        {selectedCollectionId && (
          <Receipt
            collectionId={selectedCollectionId}
            onClose={() => setIsReceiptOpen(false)}
          />
        )}
      </BottomSheet>

      <FloatingActionButton onPress={handleAddCustomer} />
    </SafeAreaView>
  );
}


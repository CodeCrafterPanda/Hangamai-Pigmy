import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import CollectedTodayCard from '@/components/elements/CollectedTodayCard';
import StatCard from '@/components/elements/StatCard';
import AttentionBanner from '@/components/elements/AttentionBanner';
import CustomerCollectionCard from '@/components/elements/CustomerCollectionCard';
import BottomSheet from '@/components/elements/BottomSheet';
import CollectDeposit from '@/scenes/collect-deposit';
import Receipt from '@/scenes/receipt';
import {
  selectTotalCollectedToday,
  selectTodayCollectionsByAgent,
  selectCollectionsNeedingSync,
} from '@/slices/collections.slice';
import { selectCustomersByAgent, selectAllCustomers } from '@/slices/customers.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import { selectAllAccounts } from '@/slices/accounts.slice';
import { selectSession } from '@/slices/settings.slice';
import type { DailyStats, AttentionAlert } from '@/types/HomeData';
import type { CustomerCollection } from '@/types/CollectionData';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'delegated'>('primary');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Get session and settings
  const session = useSelector(selectSession);
  const timezone = useSelector((state: State) => state.settings.branchSettings.timezone);
  const agentId = session.agentId || 'demo-agent';

  // Get customers
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

  // Get all accounts
  const allAccounts = useSelector(selectAllAccounts);

  // Get today's collections
  const collectedToday = useSelector((state: State) =>
    selectTotalCollectedToday(state, agentId, timezone)
  );

  const todayCollections = useSelector((state: State) =>
    selectTodayCollectionsByAgent(state, agentId, timezone)
  );

  const needsSyncCollections = useSelector(selectCollectionsNeedingSync);

  // Filter data based on active tab
  const activeCustomers = activeTab === 'primary' ? primaryCustomers : delegatedCustomers;

  // Convert to CustomerCollection format with account data
  const upNextCustomers: CustomerCollection[] = useMemo(() => {
    return activeCustomers.slice(0, 5).map(customer => {
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

  // Calculate tab-specific stats from real data
  const dailyStats: DailyStats = useMemo(() => {
    // Get customer IDs for active tab
    const activeCustomerIds = activeCustomers.map(c => c.id);

    // Filter today's collections for active tab customers
    const tabCollections = todayCollections.filter(c =>
      activeCustomerIds.includes(c.customerId)
    );

    // Calculate collected amount for this tab (all collections)
    const tabCollectedAmount = tabCollections
      .filter(c => c.status !== 'REVERSED')
      .reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);

    // Calculate in-hand amount (only CASH collections, not yet settled)
    const cashCollections = tabCollections.filter(c => c.status !== 'REVERSED' && c.mode === 'CASH');
    const inHandAmount = cashCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);

    console.log('[Home Stats]', {
      tab: activeTab,
      totalCollections: tabCollections.length,
      cashCollections: cashCollections.length,
      collectedToday: tabCollectedAmount,
      inHandAmount,
      collections: tabCollections.map(c => ({ mode: c.mode, amount: c.amount, status: c.status })),
    });

    // Get customer IDs that were collected today
    const collectedCustomerIds = new Set(
      tabCollections.map(c => c.customerId)
    );

    // Calculate pending (customers not yet collected)
    const pendingCount = activeCustomers.filter(
      c => !collectedCustomerIds.has(c.id)
    ).length;

    return {
      collectedToday: tabCollectedAmount,
      pendingCount: pendingCount,
      inHandAmount: inHandAmount,
    };
  }, [activeCustomers, todayCollections]);

  // Calculate attention alerts from real data
  const attentionAlert: AttentionAlert = {
    overdueCustomers: 0, // TODO: Calculate from accounts slice
    pendingSync: needsSyncCollections.length,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'xl'),
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    startRouteButton: {
      flex: 1,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    searchButton: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    buttonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    searchButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    buttonIcon: {
      fontSize: 18,
    },
    tabsContainer: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
    },
    tabActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    tabText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      fontSize: 14,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    attentionSection: {
      marginBottom: spacing(theme, 'md'),
    },
    upNextSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    upNextHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    upNextTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    viewAllButton: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    customerList: {
      gap: spacing(theme, 'sm'),
    },
  });

  const handleStartRoute = () => {
    console.log('Start Route pressed');
    // TODO: Navigate to route screen
  };

  const handleSearch = () => {
    console.log('Search pressed');
    // TODO: Navigate to search screen
  };

  const handleCollect = (customerId: string) => {
    console.log('Collect pressed for customer:', customerId);
    setSelectedCustomerId(customerId);
    setIsBottomSheetOpen(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false);
    setSelectedCustomerId(null);
  };

  const handleCollectAll = (customerId: string) => {
    console.log('Collect All pressed for customer:', customerId);
    setSelectedCustomerId(customerId);
    setIsBottomSheetOpen(true);
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

  const handleViewAll = () => {
    console.log('View All pressed');
    // TODO: Navigate to customers list
  };

  const handleAttentionPress = () => {
    console.log('Attention banner pressed');
    // TODO: Navigate to attention details
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <CollectedTodayCard amount={dailyStats.collectedToday} />

        <View style={styles.statsRow}>
          <StatCard type="pending" value={dailyStats.pendingCount} />
          <StatCard type="inHand" value={dailyStats.inHandAmount} />
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('primary')}
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'primary' && styles.tabActive,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.tabText, activeTab === 'primary' && styles.tabTextActive]}>
              Primary ({primaryCustomers.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('delegated')}
            style={({ pressed }) => [
              styles.tab,
              activeTab === 'delegated' && styles.tabActive,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.tabText, activeTab === 'delegated' && styles.tabTextActive]}>
              Delegated ({delegatedCustomers.length})
            </Text>
          </Pressable>
        </View>

        <View style={styles.attentionSection}>
          <AttentionBanner alert={attentionAlert} onPress={handleAttentionPress} />
        </View>

        <View style={styles.upNextSection}>
          <View style={styles.upNextHeader}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            <Pressable onPress={handleViewAll}>
              <Text style={styles.viewAllButton}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.customerList}>
            {upNextCustomers.map((customer) => (
              <CustomerCollectionCard
                key={customer.id}
                customer={customer}
                onCollect={handleCollect}
                onCollectAll={handleCollectAll}
                onReceipt={handleReceipt}
              />
            ))}
          </View>
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

          console.log('[Home] Rendering CollectDeposit for:', {
            customerId: selectedCustomerId,
            customerFound: !!customer,
            accountFound: !!account,
            customerName: customer?.fullName,
            accountNumber: account?.accountNumber,
          });

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
    </View>
  );
}

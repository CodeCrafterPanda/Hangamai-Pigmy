import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import FilterChip from '@/components/elements/FilterChip';
import CustomerCollectionCard from '@/components/elements/CustomerCollectionCard';
import type {
  CustomerCollection,
  RouteDetailsHeader,
  CollectionFilters,
  CollectionStatus,
} from '@/types/CollectionData';

export default function RouteDetails() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CollectionStatus | 'all'>('all');

  // Mock data - replace with actual data from Redux/API
  const headerData: RouteDetailsHeader = {
    routeName: 'Market Road Route',
    routeNumber: '04',
    totalStops: 24,
    isOnline: true,
  };

  const filters: CollectionFilters = {
    dueToday: 18,
    overdue: 4,
    collected: 2,
  };

  const customers: CustomerCollection[] = [
    {
      id: '1',
      customerId: 'PG-9902',
      customerName: 'Ramesh General Stores',
      accountType: 'Pigmy',
      accountNumber: 'PG-9902',
      status: 'pending',
      dailyDueAmount: 500,
      initials: 'R',
    },
    {
      id: '2',
      customerId: 'PG-4421',
      customerName: 'Suresh Textiles',
      accountType: 'Pigmy',
      accountNumber: 'PG-4421',
      status: 'overdue',
      totalOverdue: 1200,
      initials: 'S',
    },
    {
      id: '3',
      customerId: 'PG-3205',
      customerName: 'Anjali Flower Shop',
      accountType: 'Pigmy',
      accountNumber: 'PG-3205',
      status: 'pending',
      dailyDueAmount: 200,
      initials: 'A',
    },
    {
      id: '4',
      customerId: 'PG-1102',
      customerName: 'City Bakery',
      accountType: 'Pigmy',
      accountNumber: 'PG-1102',
      status: 'collected',
      collectedAmount: 300,
      initials: 'C',
    },
  ];

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === 'all' || customer.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    header: {
      backgroundColor: theme.colors.background.cardElevated,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing(theme, 'xs'),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'md'),
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    headerTitleSection: {
      flex: 1,
    },
    routeName: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    routeInfo: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: spacing(theme, 'xxs'),
    },
    syncButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceTint.successSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncIcon: {
      fontSize: 20,
    },
    searchContainer: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'md'),
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
    scrollContent: {
      paddingBottom: spacing(theme, 'xxl'),
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

  const handleBack = () => {
    router.back();
  };

  const handleCollect = (customerId: string) => {
    console.log('Collect pressed for customer:', customerId);
    // TODO: Navigate to collection screen
  };

  const handleCollectAll = (customerId: string) => {
    console.log('Collect All pressed for customer:', customerId);
    // TODO: Navigate to collection screen with all overdue
  };

  const handleReceipt = (customerId: string) => {
    console.log('Receipt pressed for customer:', customerId);
    // TODO: Show receipt modal/screen
  };

  const handleVoiceSearch = () => {
    console.log('Voice search pressed');
    // TODO: Implement voice search
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>

            <View style={styles.headerTitleSection}>
              <Text style={styles.routeName}>{headerData.routeName}</Text>
              <Text style={styles.routeInfo}>
                ROUTE #{headerData.routeNumber} • {headerData.totalStops} STOPS
              </Text>
            </View>
          </View>

          <Pressable style={styles.syncButton}>
            <Text style={styles.syncIcon}>☁️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, ID or phone..."
              placeholderTextColor={theme.colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable onPress={handleVoiceSearch} style={styles.voiceButton}>
              <Text style={styles.voiceIcon}>🎤</Text>
            </Pressable>
          </View>
        </View>

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
                label="Overdue"
                count={filters.overdue}
                variant="overdue"
                isActive={activeFilter === 'overdue'}
                onPress={() =>
                  setActiveFilter(activeFilter === 'overdue' ? 'all' : 'overdue')
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
    </SafeAreaView>
  );
}


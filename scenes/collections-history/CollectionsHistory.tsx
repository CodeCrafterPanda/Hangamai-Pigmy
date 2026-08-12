import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTheme, typography, spacing, radius } from '@/theme';
import { selectAllCollections } from '@/slices/collections.slice';
import { selectAllCustomers } from '@/slices/customers.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { getBusinessDate } from '@/utils/businessLogic';

export default function CollectionsHistory() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<'all' | 'synced' | 'pending'>('all');

  // Get session
  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agentId = session.agentId || 'demo-agent';

  // Get collections
  const allCollections = useSelector(selectAllCollections);
  const allCustomers = useSelector(selectAllCustomers);

  // Get only customers where logged-in agent is PRIMARY agent
  const myPrimaryCustomers = useMemo(() => {
    return allCustomers.filter(c => c.primaryAgentId === agentId);
  }, [allCustomers, agentId]);

  const myPrimaryCustomerIds = useMemo(() => {
    return new Set(myPrimaryCustomers.map(c => c.id));
  }, [myPrimaryCustomers]);

  // Filter collections for current month and agent
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthCollections = useMemo(() => {
    return allCollections.filter(c => {
      return (
        c.collectedByAgentId === agentId &&
        myPrimaryCustomerIds.has(c.customerId) && // Only primary customers
        c.businessDate.startsWith(monthPrefix) &&
        c.status !== 'REVERSED'
      );
    });
  }, [allCollections, agentId, monthPrefix, myPrimaryCustomerIds]);

  // Calculate today's and month's stats
  const today = getBusinessDate(new Date().toISOString(), timezone);
  const todayCollections = monthCollections.filter(c => c.businessDate === today);
  const todayAmount = todayCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  const monthAmount = monthCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  const monthProgress = monthAmount > 0 ? Math.round((todayAmount / monthAmount) * 100) : 0;

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get selected day's collections
  const selectedDay = selectedDate.getDate();
  const selectedBusinessDate = getBusinessDate(selectedDate.toISOString(), timezone);
  const dayCollections = monthCollections.filter(c => c.businessDate === selectedBusinessDate);

  // Filter collections based on active filter
  const filteredCollections = dayCollections.filter(c => {
    if (activeFilter === 'synced') return c.status === 'SYNCED';
    if (activeFilter === 'pending') return c.status === 'CREATED' || c.status === 'FAILED';
    return true;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'md'),
    },
    cardsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
    },
    card: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    todayCard: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    cardIcon: {
      fontSize: 16,
      marginBottom: spacing(theme, 'xxs'),
    },
    cardLabel: {
      ...typography(theme, 'caption'),
      fontWeight: '600',
      fontSize: 11,
      marginBottom: spacing(theme, 'xs'),
    },
    todayCardLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    regularCardLabel: {
      color: theme.colors.text.secondary,
    },
    cardAmount: {
      ...typography(theme, 'displayXL'),
      fontSize: 24,
      fontWeight: '700',
      marginBottom: spacing(theme, 'xxs'),
    },
    todayCardAmount: {
      color: '#FFFFFF',
    },
    regularCardAmount: {
      color: theme.colors.text.primary,
    },
    cardPercentage: {
      ...typography(theme, 'caption'),
      fontWeight: '600',
      fontSize: 11,
    },
    todayCardPercentage: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    calendarSection: {
      marginBottom: spacing(theme, 'lg'),
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    monthText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    navButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
    },
    navButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navIcon: {
      fontSize: 18,
      color: theme.colors.text.primary,
    },
    calendarScroll: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    daysContainer: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
    },
    dayButton: {
      width: 56,
      paddingVertical: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'button'),
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      alignItems: 'center',
      gap: 2,
    },
    dayButtonActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    dayName: {
      ...typography(theme, 'caption'),
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    dayNameActive: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    dayNameInactive: {
      color: theme.colors.text.muted,
    },
    dayNumber: {
      ...typography(theme, 'body'),
      fontSize: 16,
      fontWeight: '700',
    },
    dayNumberActive: {
      color: '#FFFFFF',
    },
    dayNumberInactive: {
      color: theme.colors.text.primary,
    },
    transactionsSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    transactionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    transactionsTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    transactionsCount: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    filtersContainer: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      marginBottom: spacing(theme, 'md'),
    },
    filterButton: {
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'xs'),
      borderRadius: radius(theme, 'button'),
      backgroundColor: theme.colors.background.cardElevated,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderColor: theme.colors.brand.primary,
    },
    filterText: {
      ...typography(theme, 'caption'),
      fontSize: 12,
      fontWeight: '600',
    },
    filterTextActive: {
      color: theme.colors.brand.primary,
    },
    filterTextInactive: {
      color: theme.colors.text.secondary,
    },
    transactionsList: {
      gap: spacing(theme, 'sm'),
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'sm'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    transactionInfo: {
      flex: 1,
      gap: 2,
    },
    customerName: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    transactionMeta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    transactionRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    amount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      ...typography(theme, 'caption'),
      fontSize: 10,
      fontWeight: '600',
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

  const getDayName = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().substring(0, 3);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount}`;
  };

  const handleMonthCardPress = () => {
    const month = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    router.push(`/(app)/(history)/monthly-collections?month=${encodeURIComponent(month)}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.todayCard]}>
            <Text style={[styles.cardIcon]}>📅</Text>
            <Text style={[styles.cardLabel, styles.todayCardLabel]}>Today's History</Text>
            <Text style={[styles.cardAmount, styles.todayCardAmount]}>
              {formatAmount(todayAmount)}
            </Text>
            <Text style={[styles.cardPercentage, styles.todayCardPercentage]}>{monthProgress}%</Text>
          </View>

          <Pressable
            onPress={handleMonthCardPress}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.cardIcon]}>📊</Text>
            <Text style={[styles.cardLabel, styles.regularCardLabel]}>This Month</Text>
            <Text style={[styles.cardAmount, styles.regularCardAmount]}>
              {formatAmount(monthAmount)}
            </Text>
          </Pressable>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <View style={styles.navButtons}>
              <Pressable onPress={handlePrevMonth} style={styles.navButton}>
                <Text style={styles.navIcon}>‹</Text>
              </Pressable>
              <Pressable onPress={handleNextMonth} style={styles.navButton}>
                <Text style={styles.navIcon}>›</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarScroll}
          >
            <View style={styles.daysContainer}>
              {monthDays.map(day => {
                const isSelected = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    style={({ pressed }) => [
                      styles.dayButton,
                      isSelected && styles.dayButtonActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.dayName, isSelected ? styles.dayNameActive : styles.dayNameInactive]}>
                      {getDayName(day)}
                    </Text>
                    <Text style={[styles.dayNumber, isSelected ? styles.dayNumberActive : styles.dayNumberInactive]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <View>
              <Text style={styles.transactionsTitle}>Transactions</Text>
              <Text style={styles.transactionsCount}>
                ({filteredCollections.length} {selectedDate.toLocaleDateString('en-US', { month: 'short' })})
              </Text>
            </View>
          </View>

          <View style={styles.filtersContainer}>
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'all' ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('synced')}
              style={[
                styles.filterButton,
                activeFilter === 'synced' && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'synced' ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                Synced
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('pending')}
              style={[
                styles.filterButton,
                activeFilter === 'pending' && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'pending' ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                Pending
              </Text>
            </Pressable>
          </View>

          <View style={styles.transactionsList}>
            {filteredCollections.length > 0 ? (
              filteredCollections.map(collection => {
                const customer = allCustomers.find(c => c.id === collection.customerId);
                const collectionTime = new Date(collection.collectedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                const statusConfig =
                  collection.status === 'SYNCED'
                    ? { color: theme.colors.status.success, label: 'Success' }
                    : { color: theme.colors.status.warning, label: 'Syncing' };

                return (
                  <View key={collection.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.customerName}>
                        {customer?.fullName || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        Ac: {collection.accountId.slice(-4)} • {collectionTime}
                      </Text>
                    </View>

                    <View style={styles.transactionRight}>
                      <Text style={styles.amount}>₹{collection.amount}</Text>
                      <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No transactions on this date</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


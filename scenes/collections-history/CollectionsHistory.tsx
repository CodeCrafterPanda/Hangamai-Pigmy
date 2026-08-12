import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTheme, typography, spacing, radius } from '@/theme';
import BottomSheet from '@/components/elements/BottomSheet';
import Receipt from '@/scenes/receipt';
import { selectAllCollections } from '@/slices/collections.slice';
import { selectAllCustomers } from '@/slices/customers.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { getCurrentBusinessDate } from '@/utils/businessLogic';

/** Day cell width, shared by the strip styles and its opening scroll offset. */
const DAY_BUTTON_WIDTH = 56;

/**
 * History root — today's summary and navigation into Monthly Collections.
 * Month browsing and Collections/Settlements mode live on Monthly Collections.
 */
export default function CollectionsHistory() {
  const router = useRouter();
  const { theme } = useTheme();
  // Day-of-month within the current business month; null follows the current business day.
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agentId = session.agentId || 'demo-agent';

  const allCollections = useSelector(selectAllCollections);
  const allCustomers = useSelector(selectAllCustomers);

  const myPrimaryCustomers = useMemo(() => {
    return allCustomers.filter(c => c.primaryAgentId === agentId);
  }, [allCustomers, agentId]);

  const myPrimaryCustomerIds = useMemo(() => {
    return new Set(myPrimaryCustomers.map(c => c.id));
  }, [myPrimaryCustomers]);

  // Root stays on the current business month — month switching belongs on Monthly
  // Collections. The month is read off the branch business date so the strip cannot drift
  // a day (or a month boundary) away from the dates collections are booked against.
  const today = getCurrentBusinessDate(timezone);
  const monthPrefix = today.slice(0, 7);
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7)) - 1;
  const todayDay = Number(today.slice(8, 10));
  /** Local-noon anchor for month/day labels only — never used to derive a business date. */
  const businessMonthDate = new Date(`${today}T00:00:00`);

  const monthCollections = useMemo(() => {
    return allCollections.filter(c => {
      return (
        c.collectedByAgentId === agentId &&
        myPrimaryCustomerIds.has(c.customerId) &&
        c.businessDate.startsWith(monthPrefix) &&
        c.status !== 'REVERSED'
      );
    });
  }, [allCollections, agentId, monthPrefix, myPrimaryCustomerIds]);

  const todayCollections = monthCollections.filter(c => c.businessDate === today);
  const todayAmount = todayCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  const monthAmount = monthCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);
  const monthProgress = monthAmount > 0 ? Math.round((todayAmount / monthAmount) * 100) : 0;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Chronological, whole month. The current business date is only where the strip is scrolled
  // to (see below) — earlier days stay in the list and remain reachable by scrolling back.
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayStripGap = spacing(theme, 'xs');
  const dayStripRef = useRef<ScrollView>(null);
  const dayStripContentWidthRef = useRef(0);
  /** Armed on focus, cleared once the strip has actually been scrolled back to today. */
  const dayStripResetPendingRef = useRef(true);

  /**
   * Scroll the strip to the current business date without touching the list itself. Does
   * nothing unless a reset is pending and the row has been measured, so it can be called
   * from both focus and layout without scrolling the user twice or fighting their scrolling.
   */
  const positionDayStripOnToday = useCallback(() => {
    if (!dayStripResetPendingRef.current || dayStripContentWidthRef.current <= 0) {
      return;
    }
    dayStripResetPendingRef.current = false;

    // A day's content x is contentPadding + index * (width + gap), so scrolling by exactly
    // the index offset leaves the current day at the strip's normal left inset.
    dayStripRef.current?.scrollTo({
      x: (todayDay - 1) * (DAY_BUTTON_WIDTH + dayStripGap),
      y: 0,
      animated: false,
    });
  }, [todayDay, dayStripGap]);

  // The tab keeps this screen mounted, so returning to History root must restore its default
  // state on focus rather than on mount: current business date selected and at the start of
  // the strip. On first focus the row has no width yet and onContentSizeChange finishes the job.
  useFocusEffect(
    useCallback(() => {
      setPickedDay(null);
      dayStripResetPendingRef.current = true;
      positionDayStripOnToday();
    }, [positionDayStripOnToday]),
  );

  // Business-date rollover while the screen stays mounted.
  useEffect(() => {
    dayStripResetPendingRef.current = true;
    positionDayStripOnToday();
  }, [monthPrefix, positionDayStripOnToday]);

  // Day strip only moves within the current month
  const selectedDay = pickedDay && pickedDay <= daysInMonth ? pickedDay : todayDay;
  const selectedBusinessDate = `${monthPrefix}-${String(selectedDay).padStart(2, '0')}`;
  const dayCollections = monthCollections.filter(c => c.businessDate === selectedBusinessDate);

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
    calendarScroll: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    daysContainer: {
      flexDirection: 'row',
      gap: dayStripGap,
    },
    dayButton: {
      width: DAY_BUTTON_WIDTH,
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
    modeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: 1,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      marginTop: 2,
    },
    modeText: {
      ...typography(theme, 'caption'),
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    amount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
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

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount}`;
  };

  const handleReceiptPress = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setIsReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    setSelectedCollectionId(null);
  };

  const handleMonthCardPress = () => {
    const month = businessMonthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    router.push(`/(app)/(history)/monthly-collections?month=${encodeURIComponent(month)}`);
  };

  const currentMonthLabel = businessMonthDate.toLocaleDateString('en-US', { month: 'long' });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.todayCard]}>
            <Text style={[styles.cardIcon]}>📅</Text>
            <Text style={[styles.cardLabel, styles.todayCardLabel]}>Today's History</Text>
            <Text style={[styles.cardAmount, styles.todayCardAmount]}>
              {formatAmount(todayAmount)}
            </Text>
            <Text style={[styles.cardPercentage, styles.todayCardPercentage]}>
              {monthProgress}%
            </Text>
          </View>

          <Pressable
            onPress={handleMonthCardPress}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.cardIcon]}>📊</Text>
            <Text style={[styles.cardLabel, styles.regularCardLabel]}>{currentMonthLabel}</Text>
            <Text style={[styles.cardAmount, styles.regularCardAmount]}>
              {formatAmount(monthAmount)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>
              {businessMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <ScrollView
            ref={dayStripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarScroll}
            onContentSizeChange={width => {
              dayStripContentWidthRef.current = width;
              positionDayStripOnToday();
            }}
          >
            <View style={styles.daysContainer}>
              {monthDays.map(day => {
                const isSelected = day === selectedDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setPickedDay(day)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      isSelected && styles.dayButtonActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        isSelected ? styles.dayNameActive : styles.dayNameInactive,
                      ]}
                    >
                      {getDayName(day)}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected ? styles.dayNumberActive : styles.dayNumberInactive,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <View>
              <Text style={styles.transactionsTitle}>Transactions</Text>
              <Text style={styles.transactionsCount}>
                ({filteredCollections.length}{' '}
                {new Date(`${selectedBusinessDate}T00:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                )
              </Text>
            </View>
          </View>

          <View style={styles.filtersContainer}>
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
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
              style={[styles.filterButton, activeFilter === 'synced' && styles.filterButtonActive]}
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
              style={[styles.filterButton, activeFilter === 'pending' && styles.filterButtonActive]}
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
                const collectionTime = new Date(collection.collectedAt).toLocaleTimeString(
                  'en-US',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }
                );

                const statusConfig =
                  collection.status === 'SYNCED'
                    ? { color: theme.colors.status.success, label: 'Success' }
                    : { color: theme.colors.status.warning, label: 'Syncing' };

                const isCash = collection.mode === 'CASH';
                const modeColor = isCash
                  ? theme.colors.status.success
                  : theme.colors.brand.primary;

                return (
                  <Pressable
                    key={collection.id}
                    onPress={() => handleReceiptPress(collection.id)}
                    style={({ pressed }) => [
                      styles.transactionItem,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={styles.transactionInfo}>
                      <Text style={styles.customerName}>
                        {customer?.fullName || 'Unknown Customer'}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        Ac: {collection.accountId.slice(-4)} • {collectionTime}
                      </Text>
                      <View style={[styles.modeBadge, { borderColor: modeColor }]}>
                        <Text style={[styles.modeText, { color: modeColor }]}>
                          {isCash ? 'CASH' : 'UPI'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transactionRight}>
                      <Text style={styles.amount}>₹{collection.amount}</Text>
                      <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                      <Text style={[styles.statusText, { color: theme.colors.brand.primary }]}>
                        RECEIPT ›
                      </Text>
                    </View>
                  </Pressable>
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

      <BottomSheet isOpen={isReceiptOpen} onClose={handleCloseReceipt}>
        {selectedCollectionId && (
          <Receipt collectionId={selectedCollectionId} onClose={handleCloseReceipt} />
        )}
      </BottomSheet>
    </View>
  );
}

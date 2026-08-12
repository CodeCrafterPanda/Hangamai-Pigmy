import { View, Text, StyleSheet, ScrollView, Pressable, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import NestedScreenHeader from '@/components/elements/NestedScreenHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import { selectAllCollections } from '@/slices/collections.slice';
import { selectCustomersByAgent } from '@/slices/customers.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { selectSettlementsByAgentAndMonth } from '@/slices/settlements.slice';
import { getBusinessDate } from '@/utils/businessLogic';
import { navigateToSettlementDetail } from '@/utils/navigation';
import { SettlementScope } from '@/types';
import type { MonthlyCollectionsData, FilterOption } from '@/types/MonthlyCollectionsData';

/** Shared geometry so frozen + scrollable halves paint as one table */
const TABLE_HEADER_HEIGHT = 64;
const TABLE_ROW_HEIGHT = 60;
const TABLE_TOTAL_ROW_HEIGHT = 60;
const CUSTOMER_COLUMN_WIDTH = 150;
const DAY_COLUMN_WIDTH = 80;
const TOTAL_COLUMN_WIDTH = 100;

export default function MonthlyCollections() {
  const { theme } = useTheme();
  const { month } = useLocalSearchParams<{ month?: string }>();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'collections' | 'settlements'>('collections');

  // Get session
  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agentId = session.agentId || 'demo-agent';

  // Get data from Redux - only PRIMARY customers (not delegated)
  const allCollections = useSelector(selectAllCollections);
  const myPrimaryCustomers = useSelector((state: State) =>
    selectCustomersByAgent(state, agentId)
  );
  const myPrimaryCustomerIds = useMemo(() => {
    return new Set(myPrimaryCustomers.map(c => c.id));
  }, [myPrimaryCustomers]);

  // Use selected month, or parse from URL, or use current
  const now = new Date();
  let currentDate = selectedMonth || now;

  if (!selectedMonth && month) {
    // Parse "Month Year" format (e.g., "December 2025" or "October 2023")
    const parts = month.split(' ');
    if (parts.length === 2) {
      const monthName = parts[0];
      const year = parseInt(parts[1], 10);
      // Try to parse the month
      const testDate = new Date(`${monthName} 1, ${year}`);
      if (!isNaN(testDate.getTime())) {
        const monthIndex = testDate.getMonth();
        currentDate = new Date(year, monthIndex, 1);
      }
    }
  }

  // Validate currentDate and fall back to now if invalid
  if (isNaN(currentDate.getTime())) {
    currentDate = now;
  }

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  console.log('[MonthlyCollections] Date info:', {
    monthParam: month,
    currentMonth: currentMonth + 1,
    currentYear,
    daysInMonth,
    agentId,
    dateIsValid: !isNaN(currentDate.getTime()),
  });

  // Get collections for this month via businessDate yyyy-MM (branch-local), not device calendar
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
  }, [allCollections, agentId, myPrimaryCustomerIds, monthPrefix]);

  // Same selected month drives Settlements mode — no separate month state
  const monthSettlements = useSelector((state: State) =>
    selectSettlementsByAgentAndMonth(state, agentId, monthPrefix)
  );

  // Build customer data with daily collections
  const customers = useMemo(() => {
    console.log('[MonthlyCollections] Building customer data:', {
      customersCount: myPrimaryCustomers.length,
      collectionsCount: monthCollections.length,
    });

    return myPrimaryCustomers.map(customer => {
      const dailyCollections: Record<string, number | null> = {};
      let monthlyTotal = 0;

      // Check each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        const businessDate = getBusinessDate(dayDate.toISOString(), timezone);

        const dayCollection = monthCollections.find(
          c => c.customerId === customer.id && c.businessDate === businessDate
        );

        if (dayCollection) {
          const amount = dayCollection.amount + dayCollection.penaltyAmount;
          dailyCollections[day.toString()] = amount;
          monthlyTotal += amount;
        } else {
          dailyCollections[day.toString()] = null;
        }
      }

      console.log(`[MonthlyCollections] Customer ${customer.fullName}:`, {
        monthlyTotal,
        hasCollections: Object.values(dailyCollections).some(v => v !== null),
      });

      return {
        accountNumber: customer.customerCode,
        name: customer.fullName,
        dailyCollections,
        monthlyTotal,
      };
    });
  }, [myPrimaryCustomers, monthCollections, daysInMonth, currentYear, currentMonth, timezone]);

  // Calculate daily totals
  const dailyTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    let dayTotal = 0;
    customers.forEach(c => {
      const amount = c.dailyCollections[day.toString()];
      if (amount) dayTotal += amount;
    });
    dailyTotals[day.toString()] = dayTotal;
    grandTotal += dayTotal;
  }

  const monthlyData: MonthlyCollectionsData = {
    month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
    year: currentYear,
    branch: 'Hangamai Main Branch',
    selectedRoute: '',
    selectedAgent: 'Self',
    status: 'Active',
    daysInMonth: daysInMonth, // Actual days in the month
    customers: customers, // Show all customers
    dailyTotals,
    grandTotal,
    isAuditSuccessful: true,
  };

  const [filters, setFilters] = useState<FilterOption>({
    agent: 'All',
    route: '',
    status: 'Active',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    controlsContainer: {
      backgroundColor: theme.colors.background.app,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingBottom: spacing(theme, 'xs'),
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    dateText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    dateIcon: {
      fontSize: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      marginLeft: 'auto',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.colors.background.cardElevated,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButtonPrimary: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    iconButtonIcon: {
      fontSize: 18,
      color: theme.colors.text.primary,
    },
    iconButtonIconPrimary: {
      color: '#FFFFFF',
    },
    filtersRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'sm'),
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    filterChipActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    filterChipText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    filterChipIcon: {
      fontSize: 12,
      color: '#FFFFFF',
    },
    filterDropdownIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
    // Same visual language as Home Primary / Delegated tabs
    modeTabsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'sm'),
    },
    modeTab: {
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
    modeTabActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    modeTabText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      fontSize: 14,
    },
    modeTabTextActive: {
      color: '#FFFFFF',
    },
    tableContainer: {
      flex: 1,
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    tableShell: {
      flex: 1,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderRadius: radius(theme, 'card'),
      overflow: 'hidden',
      backgroundColor: theme.colors.background.card,
    },
    frozenColumn: {
      width: CUSTOMER_COLUMN_WIDTH,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      zIndex: 2,
    },
    scrollableColumns: {
      flex: 1,
    },
    // Exact shared heights — content must not resize either half independently
    headerRow: {
      height: TABLE_HEADER_HEIGHT,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.app,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    headerRowDates: {
      height: TABLE_HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.app,
      overflow: 'hidden',
    },
    dataRow: {
      height: TABLE_ROW_HEIGHT,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dataRowDates: {
      height: TABLE_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.card,
      overflow: 'hidden',
    },
    footerRow: {
      height: TABLE_TOTAL_ROW_HEIGHT,
      borderTopWidth: 2,
      borderTopColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    footerRowDates: {
      height: TABLE_TOTAL_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 2,
      borderTopColor: theme.colors.background.divider,
      backgroundColor: theme.colors.background.cardElevated,
      overflow: 'hidden',
    },
    customerHeaderCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    customerBodyCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    customerFooterCell: {
      width: CUSTOMER_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      paddingHorizontal: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    dayHeaderCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    dayBodyCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    dayFooterCell: {
      width: DAY_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'xxs'),
    },
    totalHeaderCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_HEADER_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    totalBodyCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    totalFooterCell: {
      width: TOTAL_COLUMN_WIDTH,
      height: TABLE_TOTAL_ROW_HEIGHT,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'sm'),
    },
    settlementsSection: {
      flex: 1,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingBottom: spacing(theme, 'md'),
    },
    settlementsList: {
      gap: spacing(theme, 'sm'),
      paddingBottom: spacing(theme, 'lg'),
    },
    settlementCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'xs'),
    },
    settlementTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settlementDate: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    settlementStatus: {
      ...typography(theme, 'caption'),
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    settlementScope: {
      ...typography(theme, 'caption'),
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.colors.text.secondary,
    },
    settlementAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settlementAmountLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontSize: 12,
    },
    settlementAmountValue: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: 12,
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
    columnHeaderText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 10,
    },
    dayHeaderText: {
      ...typography(theme, 'pageTitle'),
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    daySubText: {
      ...typography(theme, 'micro'),
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      fontSize: 9,
    },
    totalHeaderText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    customerCellContent: {
      gap: 2,
    },
    customerName: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: 13,
    },
    customerAcctNo: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    cellTextAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      textAlign: 'center',
      fontSize: 13,
    },
    cellTextEmpty: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      fontSize: 13,
    },
    cellTextTotal: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'right',
      fontSize: 13,
    },
    totalLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 12,
    },
    totalAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 13,
    },
    totalAmountGrand: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'right',
      fontSize: 13,
    },
    auditBanner: {
      margin: spacing(theme, 'screenPadding'),
      padding: spacing(theme, 'md'),
      backgroundColor: 'rgba(46, 212, 122, 0.1)',
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.status.success,
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    auditIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.status.success,
      justifyContent: 'center',
      alignItems: 'center',
    },
    auditIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    auditContent: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    auditTitle: {
      ...typography(theme, 'body'),
      color: theme.colors.status.success,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    auditMessage: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
    monthPickerContent: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xl'),
    },
    monthPickerTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing(theme, 'lg'),
      textAlign: 'center',
    },
    monthOptionsList: {
      gap: spacing(theme, 'xs'),
    },
    monthOption: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
    },
    monthOptionSelected: {
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderColor: theme.colors.brand.primary,
    },
    monthOptionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    monthOptionTextSelected: {
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
  });

  const handleRemoveRouteFilter = () => {
    setFilters({ ...filters, route: null });
  };

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
    setIsMonthPickerOpen(false);
  };

  // Generate month options: last 6 months + current + next 6 months
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    // Start from 6 months ago
    for (let i = 9; i >= -3; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push(date);
    }
    return options;
  }, []);

  const getDayOfWeek = (day: number) => {
    const date = new Date(monthlyData.year, getMonthIndex(monthlyData.month), day);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getMonthIndex = (month: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(month);
  };

  // User-driven vertical scroll only: the other half mirrors and must not sync back.
  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);
  const verticalDriverRef = useRef<'left' | 'right' | null>(null);

  const clearVerticalDriver = () => {
    verticalDriverRef.current = null;
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Keep the driver through a fling; only clear when the gesture ends at rest.
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocityY) < 0.05) {
      clearVerticalDriver();
    }
  };

  const handleLeftScrollBeginDrag = () => {
    verticalDriverRef.current = 'left';
  };

  const handleRightScrollBeginDrag = () => {
    verticalDriverRef.current = 'right';
  };

  const handleLeftScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalDriverRef.current !== 'left') return;
    rightScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
  };

  const handleRightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (verticalDriverRef.current !== 'right') return;
    leftScrollRef.current?.scrollTo({
      y: event.nativeEvent.contentOffset.y,
      animated: false,
    });
  };

  const hasMonthCollections = monthCollections.length > 0;
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NestedScreenHeader title="Monthly Collections" subtitle={monthlyData.branch} />

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <Pressable onPress={() => setIsMonthPickerOpen(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>{`${monthlyData.month} ${monthlyData.year}`}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </Pressable>

          <View style={styles.actionButtons}>

            <Pressable style={[styles.iconButton, styles.iconButtonPrimary]}>
              <Text style={[styles.iconButtonIcon, styles.iconButtonIconPrimary]}>📤</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Mode tiles share the selected month above — switching modes does not reset month */}
      <View style={styles.modeTabsRow}>
        <Pressable
          onPress={() => setViewMode('collections')}
          style={({ pressed }) => [
            styles.modeTab,
            viewMode === 'collections' && styles.modeTabActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text
            style={[
              styles.modeTabText,
              viewMode === 'collections' && styles.modeTabTextActive,
            ]}
          >
            Collections
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('settlements')}
          style={({ pressed }) => [
            styles.modeTab,
            viewMode === 'settlements' && styles.modeTabActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text
            style={[
              styles.modeTabText,
              viewMode === 'settlements' && styles.modeTabTextActive,
            ]}
          >
            Settlements
          </Text>
        </Pressable>
      </View>

      {viewMode === 'collections' && (
        <>
          <View style={styles.filtersRow}>
            <Pressable style={styles.filterChip}>
              <Text style={styles.filterChipText}>Agent: {filters.agent}</Text>
              <Text style={styles.filterDropdownIcon}>▼</Text>
            </Pressable>

            {filters.route && (
              <Pressable
                style={[styles.filterChip, styles.filterChipActive]}
                onPress={handleRemoveRouteFilter}
              >
                <Text style={styles.filterChipTextActive}>Route: {filters.route}</Text>
                <Text style={styles.filterChipIcon}>✕</Text>
              </Pressable>
            )}

            <Pressable style={styles.filterChip}>
              <Text style={styles.filterChipText}>Status: {filters.status}</Text>
              <Text style={styles.filterDropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.tableContainer}>
            {!hasMonthCollections ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No collections for the selected month</Text>
              </View>
            ) : (
              <View style={styles.tableShell}>
                {/* Frozen Customer column — stays put during horizontal scroll */}
                <View style={styles.frozenColumn}>
                  <View style={[styles.headerRow, styles.customerHeaderCell]}>
                    <Text style={styles.columnHeaderText}>Customer</Text>
                  </View>

                  <ScrollView
                    ref={leftScrollRef}
                    onScrollBeginDrag={handleLeftScrollBeginDrag}
                    onScroll={handleLeftScroll}
                    onScrollEndDrag={handleScrollEndDrag}
                    onMomentumScrollEnd={clearVerticalDriver}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                  >
                    {monthlyData.customers.map((customer, index) => (
                      <View key={`customer-${index}`} style={[styles.dataRow, styles.customerBodyCell]}>
                        <View style={styles.customerCellContent}>
                          <Text style={styles.customerName} numberOfLines={1}>
                            {customer.name}
                          </Text>
                          <Text style={styles.customerAcctNo} numberOfLines={1}>
                            {customer.accountNumber}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View style={[styles.footerRow, styles.customerFooterCell]}>
                      <Text style={styles.totalLabel} numberOfLines={1}>
                        DAILY TOTAL
                      </Text>
                    </View>
                  </ScrollView>
                </View>

                {/* Date + Total columns — one horizontal scroll keeps header and body in sync */}
                <ScrollView
                  horizontal
                  style={styles.scrollableColumns}
                  showsHorizontalScrollIndicator={true}
                >
                  <View>
                    <View style={styles.headerRowDates}>
                      {dayNumbers.map(day => (
                        <View key={day} style={styles.dayHeaderCell}>
                          <Text style={styles.dayHeaderText}>
                            {day.toString().padStart(2, '0')}
                          </Text>
                          <Text style={styles.daySubText}>{getDayOfWeek(day)}</Text>
                        </View>
                      ))}
                      <View style={styles.totalHeaderCell}>
                        <Text style={styles.totalHeaderText}>Total</Text>
                      </View>
                    </View>

                    <ScrollView
                      ref={rightScrollRef}
                      onScrollBeginDrag={handleRightScrollBeginDrag}
                      onScroll={handleRightScroll}
                      onScrollEndDrag={handleScrollEndDrag}
                      onMomentumScrollEnd={clearVerticalDriver}
                      scrollEventThrottle={16}
                      showsVerticalScrollIndicator={false}
                    >
                      {monthlyData.customers.map((customer, index) => (
                        <View key={`dates-${index}`} style={styles.dataRowDates}>
                          {dayNumbers.map(day => {
                            const dayAmount = customer.dailyCollections[day.toString()];
                            return (
                              <View key={day} style={styles.dayBodyCell}>
                                <Text
                                  style={
                                    dayAmount ? styles.cellTextAmount : styles.cellTextEmpty
                                  }
                                  numberOfLines={1}
                                >
                                  {dayAmount || '—'}
                                </Text>
                              </View>
                            );
                          })}
                          <View style={styles.totalBodyCell}>
                            <Text style={styles.cellTextTotal} numberOfLines={1}>
                              {(customer.monthlyTotal || 0).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>
                      ))}

                      <View style={styles.footerRowDates}>
                        {dayNumbers.map(day => (
                          <View key={day} style={styles.dayFooterCell}>
                            <Text style={styles.totalAmount} numberOfLines={1}>
                              {(monthlyData.dailyTotals[day.toString()] || 0).toLocaleString(
                                'en-IN'
                              )}
                            </Text>
                          </View>
                        ))}
                        <View style={styles.totalFooterCell}>
                          <Text style={styles.totalAmountGrand} numberOfLines={1}>
                            {(monthlyData.grandTotal || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </>
      )}

      {viewMode === 'settlements' && (
        <ScrollView
          style={styles.settlementsSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.settlementsList}
        >
          {monthSettlements.length > 0 ? (
            monthSettlements.map(settlement => {
              const statusColor =
                settlement.status === 'APPROVED'
                  ? theme.colors.status.success
                  : settlement.status === 'REJECTED'
                    ? theme.colors.status.error
                    : settlement.status === 'SUBMITTED'
                      ? theme.colors.brand.primary
                      : theme.colors.status.warning;

              const dateLabel = (() => {
                const [y, m, d] = settlement.businessDate.split('-').map(Number);
                if (!y || !m || !d) return settlement.businessDate;
                return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              })();

              return (
                <Pressable
                  key={settlement.id}
                  onPress={() => navigateToSettlementDetail(settlement.id)}
                  style={({ pressed }) => [
                    styles.settlementCard,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.settlementTopRow}>
                    <Text style={styles.settlementDate}>{dateLabel}</Text>
                    <Text style={[styles.settlementStatus, { color: statusColor }]}>
                      {settlement.status}
                    </Text>
                  </View>

                  <Text style={styles.settlementScope}>
                    {settlement.scope === SettlementScope.DELEGATED ? 'DELEGATED' : 'PRIMARY'}
                  </Text>

                  <View style={styles.settlementAmountRow}>
                    <Text style={styles.settlementAmountLabel}>Cash</Text>
                    <Text style={styles.settlementAmountValue}>
                      ₹{settlement.cashTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.settlementAmountRow}>
                    <Text style={styles.settlementAmountLabel}>UPI</Text>
                    <Text style={styles.settlementAmountValue}>
                      ₹{settlement.upiTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyText}>No settlements in this month</Text>
            </View>
          )}
        </ScrollView>
      )}

      <BottomSheet isOpen={isMonthPickerOpen} onClose={() => setIsMonthPickerOpen(false)}>
        <View style={styles.monthPickerContent}>
          <Text style={styles.monthPickerTitle}>Select Month</Text>
          <View style={styles.monthOptionsList}>
            {monthOptions.map((date, index) => {
              const optionMonth = date.getMonth();
              const optionYear = date.getFullYear();
              const isSelected = optionMonth === currentMonth && optionYear === currentYear;
              const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              return (
                <Pressable
                  key={index}
                  onPress={() => handleMonthChange(date)}
                  style={({ pressed }) => [
                    styles.monthOption,
                    isSelected && styles.monthOptionSelected,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      isSelected && styles.monthOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}


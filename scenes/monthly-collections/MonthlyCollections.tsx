import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import MonthlyCollectionsHeader from '@/components/elements/MonthlyCollectionsHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import { selectAllCollections } from '@/slices/collections.slice';
import { selectAllCustomers, selectCustomersByAgent } from '@/slices/customers.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { getBusinessDate } from '@/utils/businessLogic';
import type { MonthlyCollectionsData, FilterOption } from '@/types/MonthlyCollectionsData';

export default function MonthlyCollections() {
  const router = useRouter();
  const { theme } = useTheme();
  const { month } = useLocalSearchParams<{ month?: string }>();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

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
      paddingBottom: spacing(theme, 'sm'),
    },
    header: {
      backgroundColor: theme.colors.background.app,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'sm'),
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
    headerTitles: {
      flex: 1,
    },
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    subtitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    infoButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      marginTop: spacing(theme, 'sm'),
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
    tableContainer: {
      flex: 1,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.app,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
    },
    columnHeader: {
      padding: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'md'),
      justifyContent: 'center',
      backgroundColor: theme.colors.background.app,
    },
    customerColumn: {
      width: 150,
    },
    dayColumn: {
      width: 80,
      alignItems: 'center',
    },
    totalColumn: {
      width: 100,
      alignItems: 'flex-end',
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
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    daySubText: {
      ...typography(theme, 'micro'),
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
    },
    totalHeaderText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    tableRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
      minHeight: 60,
    },
    tableCell: {
      padding: spacing(theme, 'sm'),
      justifyContent: 'center',
    },
    cellText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    cellTextBold: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    customerCellContent: {
      gap: spacing(theme, 'xxs') - 2,
    },
    customerName: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
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
    },
    cellTextEmpty: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    cellTextTotal: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'right',
    },
    totalRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.cardElevated,
      borderTopWidth: 2,
      borderTopColor: theme.colors.background.divider,
    },
    totalLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    totalAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    totalAmountGrand: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      textAlign: 'right',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MonthlyCollectionsHeader
        month="Monthly Collections"
        branchName={monthlyData.branch}
      />

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

      <View style={styles.filtersRow}>
        <Pressable style={styles.filterChip}>
          <Text style={styles.filterChipText}>Agent: {filters.agent}</Text>
          <Text style={styles.filterDropdownIcon}>▼</Text>
        </Pressable>

        {filters.route && (
          <Pressable style={[styles.filterChip, styles.filterChipActive]} onPress={handleRemoveRouteFilter}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.columnHeader, styles.customerColumn]}>
                <Text style={styles.columnHeaderText}>Customer</Text>
              </View>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <View key={day} style={[styles.columnHeader, styles.dayColumn]}>
                  <Text style={styles.dayHeaderText}>{day.toString().padStart(2, '0')}</Text>
                  <Text style={styles.daySubText}>{getDayOfWeek(day)}</Text>
                </View>
              ))}
              <View style={[styles.columnHeader, styles.totalColumn]}>
                <Text style={styles.totalHeaderText}>Total</Text>
              </View>
            </View>

            {/* Table Body */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {monthlyData.customers.map((customer, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.customerColumn]}>
                    <View style={styles.customerCellContent}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <Text style={styles.customerAcctNo}>{customer.accountNumber}</Text>
                    </View>
                  </View>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayAmount = customer.dailyCollections[day.toString()];
                    return (
                      <View key={day} style={[styles.tableCell, styles.dayColumn]}>
                        <Text style={dayAmount ? styles.cellTextAmount : styles.cellTextEmpty}>
                          {dayAmount || '—'}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={[styles.tableCell, styles.totalColumn]}>
                    <Text style={styles.cellTextTotal}>
                      {(customer.monthlyTotal || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Daily Total Row */}
              <View style={styles.totalRow}>
                <View style={[styles.tableCell, styles.customerColumn]}>
                  <Text style={styles.totalLabel}>DAILY TOTAL</Text>
                </View>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <View key={day} style={[styles.tableCell, styles.dayColumn]}>
                    <Text style={styles.totalAmount}>
                      {(monthlyData.dailyTotals[day.toString()] || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
                <View style={[styles.tableCell, styles.totalColumn]}>
                  <Text style={styles.totalAmountGrand}>
                    {(monthlyData.grandTotal || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

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


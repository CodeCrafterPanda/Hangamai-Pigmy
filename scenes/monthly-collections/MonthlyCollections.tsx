import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { MonthlyCollectionsData, FilterOption } from '@/types/MonthlyCollectionsData';

export default function MonthlyCollections() {
  const router = useRouter();
  const { theme } = useTheme();
  const [filters, setFilters] = useState<FilterOption>({
    agent: 'All',
    route: '12B',
    status: 'Active',
  });

  // Mock data - replace with actual data from Redux/API
  const monthlyData: MonthlyCollectionsData = {
    month: 'Oct',
    year: 2023,
    branch: 'Shivaji Nagar Branch',
    selectedRoute: '12B',
    selectedAgent: 'All',
    status: 'Active',
    daysInMonth: 4,
    customers: [
      {
        accountNumber: 'SB-1874',
        name: 'Ramesh K.',
        dailyCollections: { '1': 500, '2': 500, '3': null, '4': 500 },
        monthlyTotal: 3000,
      },
      {
        accountNumber: 'SB-1845',
        name: 'Anita Desai',
        dailyCollections: { '1': 200, '2': 200, '3': 200, '4': 200 },
        monthlyTotal: 1200,
      },
      {
        accountNumber: 'RK-282',
        name: 'Vijay M.',
        dailyCollections: { '1': null, '2': null, '3': 100, '4': null },
        monthlyTotal: 200,
      },
      {
        accountNumber: 'CHECK',
        name: 'Suresh P.',
        dailyCollections: { '1': 1000, '2': 1000, '3': 1000, '4': 1000 },
        monthlyTotal: 6000,
      },
      {
        accountNumber: 'SB-1182',
        name: 'Meera S.',
        dailyCollections: { '1': 300, '2': 300, '3': null, '4': null },
        monthlyTotal: 900,
      },
      {
        accountNumber: 'SB-6999',
        name: 'New User',
        dailyCollections: { '1': null, '2': null, '3': null, '4': null },
        monthlyTotal: 0,
      },
    ],
    dailyTotals: { '1': 2000, '2': 2000, '3': 1300, '4': 1700 },
    grandTotal: 11200,
    isAuditSuccessful: true,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
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
  });

  const handleBack = () => {
    router.back();
  };

  const handleRemoveRouteFilter = () => {
    setFilters({ ...filters, route: null });
  };

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={styles.headerTitles}>
              <Text style={styles.title}>Monthly Collections</Text>
              <Text style={styles.subtitle}>{monthlyData.branch}</Text>
            </View>
          </View>
          <Pressable style={styles.infoButton}>
            <Text style={styles.infoIcon}>ℹ️</Text>
          </Pressable>
        </View>

        <View style={styles.controlsRow}>
          <Pressable style={styles.dateButton}>
            <Text style={styles.dateText}>{`${monthlyData.month} ${monthlyData.year}`}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </Pressable>

          <View style={styles.actionButtons}>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconButtonIcon}>🔍</Text>
            </Pressable>
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
              <View style={[styles.columnHeader, styles.dayColumn]}>
                <Text style={styles.dayHeaderText}>01</Text>
                <Text style={styles.daySubText}>{getDayOfWeek(1)}</Text>
              </View>
              <View style={[styles.columnHeader, styles.dayColumn]}>
                <Text style={styles.dayHeaderText}>02</Text>
                <Text style={styles.daySubText}>{getDayOfWeek(2)}</Text>
              </View>
              <View style={[styles.columnHeader, styles.dayColumn]}>
                <Text style={styles.dayHeaderText}>03</Text>
                <Text style={styles.daySubText}>{getDayOfWeek(3)}</Text>
              </View>
              <View style={[styles.columnHeader, styles.dayColumn]}>
                <Text style={styles.dayHeaderText}>04</Text>
                <Text style={styles.daySubText}>{getDayOfWeek(4)}</Text>
              </View>
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
                  <View style={[styles.tableCell, styles.dayColumn]}>
                    <Text style={customer.dailyCollections['1'] ? styles.cellTextAmount : styles.cellTextEmpty}>
                      {customer.dailyCollections['1'] || '—'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.dayColumn]}>
                    <Text style={customer.dailyCollections['2'] ? styles.cellTextAmount : styles.cellTextEmpty}>
                      {customer.dailyCollections['2'] || '—'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.dayColumn]}>
                    <Text style={customer.dailyCollections['3'] ? styles.cellTextAmount : styles.cellTextEmpty}>
                      {customer.dailyCollections['3'] || '—'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.dayColumn]}>
                    <Text style={customer.dailyCollections['4'] ? styles.cellTextAmount : styles.cellTextEmpty}>
                      {customer.dailyCollections['4'] || '—'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.totalColumn]}>
                    <Text style={styles.cellTextTotal}>
                      {customer.monthlyTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Daily Total Row */}
              <View style={styles.totalRow}>
                <View style={[styles.tableCell, styles.customerColumn]}>
                  <Text style={styles.totalLabel}>DAILY TOTAL</Text>
                </View>
                <View style={[styles.tableCell, styles.dayColumn]}>
                  <Text style={styles.totalAmount}>{monthlyData.dailyTotals['1'].toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.tableCell, styles.dayColumn]}>
                  <Text style={styles.totalAmount}>{monthlyData.dailyTotals['2'].toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.tableCell, styles.dayColumn]}>
                  <Text style={styles.totalAmount}>{monthlyData.dailyTotals['3'].toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.tableCell, styles.dayColumn]}>
                  <Text style={styles.totalAmount}>{monthlyData.dailyTotals['4'].toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.tableCell, styles.totalColumn]}>
                  <Text style={styles.totalAmountGrand}>{monthlyData.grandTotal.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {monthlyData.isAuditSuccessful && (
        <View style={styles.auditBanner}>
          <View style={styles.auditIconContainer}>
            <Text style={styles.auditIcon}>✓</Text>
          </View>
          <View style={styles.auditContent}>
            <Text style={styles.auditTitle}>AUDIT SUCCESSFUL</Text>
            <Text style={styles.auditMessage}>
              Daily totals and monthly totals are reconciled.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


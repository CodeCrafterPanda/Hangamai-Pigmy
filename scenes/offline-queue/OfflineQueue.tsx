import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing } from '@/theme';
import SyncStatusCard from '@/components/elements/SyncStatusCard';
import OfflineTransactionCard from '@/components/elements/OfflineTransactionCard';
import type { OfflineTransaction, SyncStatus } from '@/types/OfflineQueueData';

export default function OfflineQueue() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API
  const syncStatus: SyncStatus = {
    pendingCount: 12,
    failedCount: 1,
    lastSyncTime: '2 hours ago',
    totalAmount: 6450,
  };

  const transactions: OfflineTransaction[] = [
    {
      id: '1',
      receiptNumber: '#REC-9920',
      customerName: 'Anita Desai',
      amount: 1200.0,
      time: '09:15 AM',
      status: 'failed',
      errorMessage: 'Network timeout during upload',
      timestamp: new Date('2023-10-24T09:15:00'),
    },
    {
      id: '2',
      receiptNumber: '#REC-9921',
      customerName: 'Rajesh Kumar',
      amount: 500.0,
      time: '10:30 AM',
      status: 'pending',
      timestamp: new Date('2023-10-24T10:30:00'),
    },
    {
      id: '3',
      receiptNumber: '#REC-9922',
      customerName: 'Vikram Singh',
      amount: 2100.0,
      time: '11:45 AM',
      status: 'pending',
      timestamp: new Date('2023-10-24T11:45:00'),
    },
    {
      id: '4',
      receiptNumber: '#REC-9923',
      customerName: 'Meera Patel',
      amount: 750.0,
      time: '12:00 PM',
      status: 'pending',
      timestamp: new Date('2023-10-24T12:00:00'),
    },
  ];

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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    offlineIcon: {
      fontSize: 24,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl') + 80,
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
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    totalAmount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    transactionsList: {
      gap: spacing(theme, 'sm'),
    },
    actionButtons: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.card,
      padding: spacing(theme, 'screenPadding'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.background.divider,
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    retryButton: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.status.error,
      paddingVertical: spacing(theme, 'md'),
      paddingHorizontal: spacing(theme, 'lg'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    retryButtonIcon: {
      fontSize: 18,
      color: theme.colors.status.error,
    },
    retryButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.status.error,
      fontWeight: '600',
    },
    syncButton: {
      flex: 1,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    syncButtonIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    syncButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleRetryTransaction = (transactionId: string) => {
    console.log('Retry transaction:', transactionId);
    // TODO: Retry failed transaction
  };

  const handleRetryAllFailed = () => {
    console.log('Retry all failed transactions');
    const failedTransactions = transactions.filter((t) => t.status === 'failed');
    // TODO: Retry all failed transactions
    console.log('Failed transactions:', failedTransactions.length);
  };

  const handleSyncNow = () => {
    console.log('Sync now pressed');
    // TODO: Trigger sync
  };

  const failedCount = transactions.filter((t) => t.status === 'failed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.title}>Offline Queue</Text>
        </View>
        <Text style={styles.offlineIcon}>📴</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SyncStatusCard
          pendingCount={syncStatus.pendingCount}
          lastSyncTime={syncStatus.lastSyncTime}
        />

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Transactions</Text>
            <Text style={styles.totalAmount}>
              Total: ₹{syncStatus.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <OfflineTransactionCard
                key={transaction.id}
                transaction={transaction}
                onRetry={handleRetryTransaction}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        {failedCount > 0 && (
          <Pressable
            onPress={handleRetryAllFailed}
            style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.retryButtonIcon}>🔄</Text>
            <Text style={styles.retryButtonText}>
              Retry Failed ({failedCount})
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleSyncNow}
          style={({ pressed }) => [styles.syncButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.syncButtonIcon}>☁️</Text>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


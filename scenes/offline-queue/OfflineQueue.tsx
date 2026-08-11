import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing } from '@/theme';
import SyncStatusCard from '@/components/elements/SyncStatusCard';
import OfflineTransactionCard from '@/components/elements/OfflineTransactionCard';
import { selectCollectionsNeedingSync, selectAllCollections } from '@/slices/collections.slice';
import { selectAllCustomers } from '@/slices/customers.slice';
import { selectSession } from '@/slices/settings.slice';
import type { OfflineTransaction, SyncStatus } from '@/types/OfflineQueueData';

export default function OfflineQueue() {
  const router = useRouter();
  const { theme } = useTheme();

  // Get session
  const session = useSelector(selectSession);
  const agentId = session.agentId || 'demo-agent';

  // Get today's business date
  const today = new Date();
  const todayBusinessDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Get collections needing sync (only TODAY's)
  const needsSyncCollections = useSelector(selectCollectionsNeedingSync);
  const allCustomers = useSelector(selectAllCustomers);

  // Filter for current agent and TODAY only
  const todayNeedsSyncCollections = useMemo(() => {
    return needsSyncCollections.filter(c => {
      const collectionDate = c.collectedAt.split('T')[0];
      return c.collectedByAgentId === agentId && collectionDate === todayBusinessDate;
    });
  }, [needsSyncCollections, agentId, todayBusinessDate]);

  // Calculate sync status
  const pendingCount = todayNeedsSyncCollections.filter(c => c.status === 'CREATED').length;
  const failedCount = todayNeedsSyncCollections.filter(c => c.status === 'FAILED').length;
  const totalAmount = todayNeedsSyncCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);

  const syncStatus: SyncStatus = {
    pendingCount,
    failedCount,
    lastSyncTime: '2 hours ago', // TODO: Get from sync queue
    totalAmount,
  };

  // Convert to OfflineTransaction format
  const transactions: OfflineTransaction[] = todayNeedsSyncCollections.map(c => {
    const customer = allCustomers.find(cust => cust.id === c.customerId);
    const time = new Date(c.collectedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: c.id,
      receiptNumber: c.receiptNo,
      customerName: customer?.fullName || 'Unknown',
      amount: c.amount,
      time,
      status: c.status === 'FAILED' ? 'failed' : 'pending',
      errorMessage: c.status === 'FAILED' ? 'Sync failed - will retry' : undefined,
      timestamp: new Date(c.collectedAt),
    };
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


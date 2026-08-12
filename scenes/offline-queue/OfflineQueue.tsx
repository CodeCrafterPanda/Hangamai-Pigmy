import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, typography, spacing } from '@/theme';
import SyncStatusCard from '@/components/elements/SyncStatusCard';
import OfflineTransactionCard from '@/components/elements/OfflineTransactionCard';
import { selectCollectionsNeedingSync } from '@/slices/collections.slice';
import { selectAllCustomers } from '@/slices/customers.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { getCurrentBusinessDate } from '@/utils/businessLogic';
import type { OfflineTransaction, SyncStatus } from '@/types/OfflineQueueData';

export default function OfflineQueue() {
  const { theme } = useTheme();

  // Get session
  const session = useSelector(selectSession);
  const agentId = session.agentId || 'demo-agent';

  const timezone = useSelector(selectBranchTimezone);
  const todayBusinessDate = getCurrentBusinessDate(timezone);

  // Get collections needing sync (only TODAY's)
  const needsSyncCollections = useSelector(selectCollectionsNeedingSync);
  const allCustomers = useSelector(selectAllCustomers);

  // Filter for current agent and TODAY only, comparing against the branch business date
  // already stored on each collection rather than re-deriving a date from the timestamp.
  const todayNeedsSyncCollections = useMemo(() => {
    return needsSyncCollections.filter(
      c => c.collectedByAgentId === agentId && c.businessDate === todayBusinessDate,
    );
  }, [needsSyncCollections, agentId, todayBusinessDate]);

  // Calculate sync status
  const pendingCount = todayNeedsSyncCollections.filter(c => c.status === 'CREATED').length;
  const failedCount = todayNeedsSyncCollections.filter(c => c.status === 'FAILED').length;
  const totalAmount = todayNeedsSyncCollections.reduce((sum, c) => sum + c.amount + c.penaltyAmount, 0);

  const syncStatus: SyncStatus = {
    pendingCount,
    failedCount,
    // This build has no backend to sync with, so no sync has ever succeeded. Showing a
    // plausible elapsed time here would claim collections had left the device.
    lastSyncTime: 'Never',
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
    scrollContent: {
      paddingTop: spacing(theme, 'sm'),
      paddingBottom: spacing(theme, 'sm') + 64,
    },
    transactionsSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    transactionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing(theme, 'xs'),
    },
    transactionsTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    totalAmount: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    transactionsList: {
      gap: spacing(theme, 'xs'),
    },
    actionButtons: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.card,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'sm'),
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

  // No backend exists in this MVP build. These controls say so instead of appearing to
  // upload, which would leave the agent believing collections had left the device.
  const notifySyncUnavailable = () => {
    Alert.alert(
      'Sync unavailable',
      'This build has no server connection. Collections are stored on this device and stay available after a restart.',
    );
  };

  const handleRetryTransaction = (_transactionId: string) => {
    notifySyncUnavailable();
  };

  const handleRetryAllFailed = () => {
    notifySyncUnavailable();
  };

  const handleSyncNow = () => {
    notifySyncUnavailable();
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}


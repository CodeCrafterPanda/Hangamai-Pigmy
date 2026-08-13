import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation, formatNumber } from '@/i18n';
import type { OfflineTransaction, TransactionStatus } from '@/types/OfflineQueueData';

interface OfflineTransactionCardProps {
  transaction: OfflineTransaction;
  onRetry?: (transactionId: string) => void;
}

export default function OfflineTransactionCard({
  transaction,
  onRetry,
}: OfflineTransactionCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'failed':
        return {
          label: t('offlineTransaction.failed'),
          icon: '⚠',
          bgColor: 'rgba(255, 77, 79, 0.15)',
          textColor: theme.colors.status.error,
          borderColor: theme.colors.status.error,
          leftBorderColor: theme.colors.status.error,
        };
      case 'pending':
        return {
          label: t('offlineTransaction.pending'),
          icon: '⏱',
          bgColor: 'rgba(244, 196, 48, 0.15)',
          textColor: '#D4834D',
          borderColor: 'rgba(244, 196, 48, 0.3)',
          leftBorderColor: '#D4834D',
        };
      case 'synced':
        return {
          label: t('offlineTransaction.synced'),
          icon: '✓',
          bgColor: theme.colors.surfaceTint.successSoft,
          textColor: theme.colors.status.success,
          borderColor: theme.colors.status.success,
          leftBorderColor: theme.colors.status.success,
        };
    }
  };

  const statusConfig = getStatusConfig(transaction.status);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      borderLeftColor: statusConfig.leftBorderColor,
      overflow: 'hidden',
    },
    content: {
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xxs'),
      minHeight: 64,
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.text.primary,
      fontWeight: '600',
      flex: 1,
    },
    amount: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing(theme, 'sm'),
    },
    metaLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    receiptNumber: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.colors.text.muted,
    },
    time: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: statusConfig.bgColor,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: statusConfig.borderColor,
    },
    statusIcon: {
      fontSize: 12,
    },
    statusText: {
      ...typography(theme, 'caption'),
      color: statusConfig.textColor,
      fontWeight: '600',
    },
    errorSection: {
      gap: spacing(theme, 'xxs'),
    },
    errorMessage: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.error,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      alignSelf: 'flex-start',
    },
    retryText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    retryIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.customerName} numberOfLines={1}>
            {transaction.customerName}
          </Text>
          <Text style={styles.amount}>
            ₹{formatNumber(transaction.amount, { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.receiptNumber}>{transaction.receiptNumber}</Text>
            <View style={styles.dot} />
            <Text style={styles.time}>{transaction.time}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusIcon, { color: statusConfig.textColor }]}>
              {statusConfig.icon}
            </Text>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>

        {transaction.status === 'failed' && transaction.errorMessage && (
          <View style={styles.errorSection}>
            <Text style={styles.errorMessage}>{transaction.errorMessage}</Text>
            {onRetry && (
              <Pressable
                onPress={() => onRetry(transaction.id)}
                style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.retryText}>{t('offlineTransaction.tapToRetry')}</Text>
                <Text style={styles.retryIcon}>›</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}


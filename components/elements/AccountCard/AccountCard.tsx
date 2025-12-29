import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import ProgressBar from '@/components/elements/ProgressBar';
import type { CustomerAccount, AccountType, AccountStatus } from '@/types/CustomerDetailData';

interface AccountCardProps {
  account: CustomerAccount;
  onPress?: (accountId: string) => void;
}

export default function AccountCard({ account, onPress }: AccountCardProps) {
  const { theme } = useTheme();

  const getAccountTypeConfig = (type: AccountType) => {
    switch (type) {
      case 'pigmy':
        return {
          label: 'PIGMY',
          backgroundColor: 'rgba(59, 111, 255, 0.15)',
          textColor: theme.colors.brand.primary,
          borderColor: 'rgba(59, 111, 255, 0.3)',
        };
      case 'loan':
        return {
          label: 'LOAN',
          backgroundColor: 'rgba(142, 84, 233, 0.15)',
          textColor: '#8E54E9',
          borderColor: 'rgba(142, 84, 233, 0.3)',
        };
    }
  };

  const getStatusConfig = (status: AccountStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          icon: '⏱',
          color: '#D4834D',
        };
      case 'paid':
        return {
          label: 'Paid',
          icon: '✓',
          color: theme.colors.status.success,
        };
      case 'overdue':
        return {
          label: 'Overdue',
          icon: '⚠️',
          color: theme.colors.status.error,
        };
    }
  };

  const typeConfig = getAccountTypeConfig(account.accountType);
  const statusConfig = getStatusConfig(account.status);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      overflow: 'hidden',
    },
    content: {
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'md'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    accountBadge: {
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: typeConfig.backgroundColor,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: typeConfig.borderColor,
    },
    accountBadgeText: {
      ...typography(theme, 'micro'),
      color: typeConfig.textColor,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    accountNumber: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    dueTodayLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    amountSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    leftAmount: {
      gap: spacing(theme, 'xxs'),
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    amount: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    rightAmount: {
      alignItems: 'flex-end',
      gap: spacing(theme, 'xxs'),
    },
    dueAmount: {
      ...typography(theme, 'displayXL'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs') - 2,
      borderRadius: radius(theme, 'chip'),
    },
    statusIcon: {
      fontSize: 10,
    },
    statusText: {
      ...typography(theme, 'micro'),
      fontWeight: '600',
    },
    progressBarContainer: {
      marginTop: spacing(theme, 'xs'),
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={styles.accountBadge}>
              <Text style={styles.accountBadgeText}>{typeConfig.label}</Text>
            </View>
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          </View>

          <Text style={styles.dueTodayLabel}>Due Today</Text>
        </View>

        <View style={styles.amountSection}>
          <View style={styles.leftAmount}>
            <Text style={styles.label}>{account.label}</Text>
            <Text style={styles.amount}>₹{account.amount.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.rightAmount}>
            <Text style={styles.dueAmount}>₹{account.dueToday.toLocaleString('en-IN')}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusConfig.color}15` },
              ]}
            >
              <Text style={[styles.statusIcon, { color: statusConfig.color }]}>
                {statusConfig.icon}
              </Text>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {account.progress !== undefined && (
        <View style={styles.progressBarContainer}>
          <ProgressBar progress={account.progress} height={4} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(account.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}


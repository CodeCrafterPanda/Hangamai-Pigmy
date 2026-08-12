import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { CustomerCollection, CollectionStatus } from '@/types/CollectionData';

interface CustomerCollectionCardProps {
  customer: CustomerCollection;
  onPress?: (customerId: string) => void;
  onCollect?: (customerId: string) => void;
  onCollectAll?: (customerId: string) => void;
  onReceipt?: (customerId: string) => void;
  onEdit?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
}

export default function CustomerCollectionCard({
  customer,
  onPress,
  onCollect,
  onCollectAll,
  onReceipt,
  onEdit,
  onDelete,
}: CustomerCollectionCardProps) {
  const { theme } = useTheme();

  const getStatusConfig = (status: CollectionStatus) => {
    switch (status) {
      case 'pending':
        return {
          statusColor: theme.colors.brand.primary,
          statusLabel: 'PENDING',
          showLeftBorder: false,
          leftBorderColor: 'transparent',
        };
      case 'overdue':
        return {
          statusColor: theme.colors.status.error,
          statusLabel: 'OVERDUE',
          showLeftBorder: true,
          leftBorderColor: theme.colors.status.error,
        };
      case 'collected':
        return {
          statusColor: theme.colors.status.success,
          statusLabel: 'COLLECTED',
          showLeftBorder: false,
          leftBorderColor: 'transparent',
        };
    }
  };

  const statusConfig = getStatusConfig(customer.status);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: statusConfig.showLeftBorder ? 4 : 1,
      borderLeftColor: statusConfig.leftBorderColor,
      overflow: 'hidden',
    },
    content: {
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'md'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing(theme, 'sm'),
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      flex: 1,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarCollected: {
      backgroundColor: theme.colors.surfaceTint.successSoft,
    },
    avatarIcon: {
      fontSize: 20,
    },
    avatarText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    customerInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    customerNameCollected: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    accountInfo: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    statusBadge: {
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      borderRadius: radius(theme, 'chip'),
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: statusConfig.statusColor,
    },
    statusText: {
      ...typography(theme, 'micro'),
      color: theme.colors.text.muted,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    amountSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    amountInfo: {
      gap: spacing(theme, 'xxs'),
    },
    amountLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
    },
    amount: {
      ...typography(theme, 'pageTitle'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    collectButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: radius(theme, 'button'),
      paddingHorizontal: spacing(theme, 'lg'),
      paddingVertical: spacing(theme, 'sm'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    collectAllButton: {
      backgroundColor: theme.colors.status.error,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    receiptButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    buttonText: {
      ...typography(theme, 'body'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    receiptButtonText: {
      color: theme.colors.text.secondary,
    },
    buttonIcon: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    receiptButtonIcon: {
      color: theme.colors.text.secondary,
    },
    collectedLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.success,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing(theme, 'xxs'),
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: 4,
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderRadius: radius(theme, 'action'),
      borderWidth: 1,
      borderColor: theme.colors.brand.primary,
    },
    editButtonIcon: {
      fontSize: 10,
      color: theme.colors.brand.primary,
    },
    editButtonText: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
      fontSize: 10,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: 4,
      backgroundColor: theme.colors.surfaceTint.errorSoft,
      borderRadius: radius(theme, 'action'),
      borderWidth: 1,
      borderColor: theme.colors.status.error,
    },
    deleteButtonIcon: {
      fontSize: 10,
      color: theme.colors.status.error,
    },
    deleteButtonText: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.error,
      fontWeight: '600',
      fontSize: 10,
    },
  });

  const renderActionButton = () => {
    if (customer.status === 'collected') {
      return (
        <Pressable
          onPress={() => onReceipt?.(customer.id)}
          style={({ pressed }) => [
            styles.collectButton,
            styles.receiptButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, styles.receiptButtonText]}>Receipt</Text>
          <Text style={[styles.buttonIcon, styles.receiptButtonIcon]}>📄</Text>
        </Pressable>
      );
    }

    if (customer.status === 'overdue') {
      return (
        <Pressable
          onPress={() => onCollectAll?.(customer.id)}
          style={({ pressed }) => [
            styles.collectButton,
            styles.collectAllButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>Collect All</Text>
          <Text style={styles.buttonIcon}>💵</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => onCollect?.(customer.id)}
        style={({ pressed }) => [styles.collectButton, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.buttonText}>Collect</Text>
        <Text style={styles.buttonIcon}>→</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => onPress?.(customer.id)}
            disabled={!onPress}
            style={({ pressed }) => [
              styles.leftSection,
              { opacity: onPress && pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.customerInfo}>
              <Text
                style={[
                  styles.customerName,
                  customer.status === 'collected' && styles.customerNameCollected,
                ]}
              >
                {customer.customerName}
              </Text>
              <Text style={styles.accountInfo}>
                {customer.accountType} • {customer.accountNumber}
              </Text>
            </View>
          </Pressable>

          <View style={styles.statusBadge}>
            {renderActionButton()}
          </View>
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.actionButtons}>
            {onEdit && (
              <Pressable
                onPress={() => onEdit(customer.id)}
                style={({ pressed }) => [styles.editButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.editButtonIcon}>✏️</Text>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={() => onDelete(customer.id)}
                style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.deleteButtonIcon}>🗑️</Text>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}


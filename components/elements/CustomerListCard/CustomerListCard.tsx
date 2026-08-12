import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { CustomerStatus } from '@/types';
import type { CustomerListItem } from '@/types/CustomerListData';

interface CustomerListCardProps {
  customer: CustomerListItem;
  onPress?: (customerId: string) => void;
}

export default function CustomerListCard({ customer, onPress }: CustomerListCardProps) {
  const { theme } = useTheme();

  const getStatusConfig = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return {
          label: 'Active',
          bgColor: theme.colors.surfaceTint.successSoft,
          textColor: theme.colors.status.success,
          borderColor: theme.colors.status.success,
          leftBorderColor: theme.colors.status.success,
        };
      case CustomerStatus.BLOCKED:
        return {
          label: 'Blocked',
          bgColor: theme.colors.surfaceTint.errorSoft,
          textColor: theme.colors.status.error,
          borderColor: theme.colors.status.error,
          leftBorderColor: theme.colors.status.error,
        };
      case CustomerStatus.INACTIVE:
      default:
        return {
          label: 'Inactive',
          bgColor: theme.colors.background.cardElevated,
          textColor: theme.colors.text.muted,
          borderColor: theme.colors.background.divider,
          leftBorderColor: theme.colors.text.muted,
        };
    }
  };

  const statusConfig = getStatusConfig(customer.status);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      borderLeftColor: statusConfig.leftBorderColor,
      padding: spacing(theme, 'sm'),
      minHeight: 64,
    },
    info: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    name: {
      ...typography(theme, 'sectionTitle'),
      fontSize: 16,
      lineHeight: 22,
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    meta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    statusBadge: {
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: statusConfig.bgColor,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: statusConfig.borderColor,
    },
    statusText: {
      ...typography(theme, 'micro'),
      color: statusConfig.textColor,
      fontWeight: '600',
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.meta}>
          {customer.customerCode} • {customer.routeName}
        </Text>
      </View>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{statusConfig.label}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(customer.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

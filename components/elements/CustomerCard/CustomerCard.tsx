import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { Customer } from '@/types/HomeData';

interface CustomerCardProps {
  customer: Customer;
  onCollect?: (customerId: string) => void;
}

export default function CustomerCard({ customer, onCollect }: CustomerCardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
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
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    accountNumber: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.colors.text.muted,
    },
    location: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.cardElevated,
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs') - 2,
      borderRadius: radius(theme, 'chip'),
    },
    collectButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: radius(theme, 'button'),
      paddingVertical: spacing(theme, 'sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectButtonPressed: {
      opacity: 0.8,
    },
    collectButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.initials}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountNumber}>A/C {customer.accountNumber}</Text>
            <View style={styles.dot} />
            <Text style={styles.location}>{customer.location}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onCollect?.(customer.id)}
        style={({ pressed }) => [
          styles.collectButton,
          pressed && styles.collectButtonPressed,
        ]}
      >
        <Text style={styles.collectButtonText}>Collect</Text>
      </Pressable>
    </View>
  );
}


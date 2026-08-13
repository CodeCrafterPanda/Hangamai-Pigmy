import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import type { DelegatedCustomer } from '@/types/DelegatedData';

interface DelegatedCustomerCardProps {
  customer: DelegatedCustomer;
  onCollectDeposit?: (customerId: string) => void;
}

export default function DelegatedCustomerCard({
  customer,
  onCollectDeposit,
}: DelegatedCustomerCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'md'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'xs'),
    },
    delegatedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: 'rgba(212, 131, 77, 0.15)',
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: 'rgba(212, 131, 77, 0.3)',
    },
    delegatedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#D4834D',
    },
    delegatedText: {
      ...typography(theme, 'caption'),
      color: '#D4834D',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    validTillContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    calendarIcon: {
      fontSize: 14,
      color: theme.colors.text.muted,
    },
    validTillText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    customerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.background.cardElevated,
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    customerInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    accountInfo: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    primaryAgentBox: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'sm'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    agentIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    primaryAgentLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    primaryAgentName: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    collectButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: radius(theme, 'button'),
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    buttonIcon: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    buttonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.delegatedBadge}>
          <View style={styles.delegatedDot} />
          <Text style={styles.delegatedText}>{t('delegatedCustomerCard.delegated')}</Text>
        </View>

        <View style={styles.validTillContainer}>
          <Text style={styles.calendarIcon}>📅</Text>
          <Text style={styles.validTillText}>
            {t('delegatedCustomerCard.validTill', { date: customer.validTill })}
          </Text>
        </View>
      </View>

      <View style={styles.customerSection}>
        {customer.avatarUrl ? (
          <Image source={{ uri: customer.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...typography(theme, 'sectionTitle'),
                  color: theme.colors.text.secondary,
                  fontWeight: '600',
                }}
              >
                {getInitials(customer.customerName)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.customerName}</Text>
          <Text style={styles.accountInfo}>
            {t('delegatedCustomerCard.accountMasked', { number: customer.accountNumberMasked })}
          </Text>
        </View>
      </View>

      <View style={styles.primaryAgentBox}>
        <Text style={styles.agentIcon}>👤</Text>
        <Text style={styles.primaryAgentLabel}>{t('delegatedCustomerCard.primaryAgent')}</Text>
        <Text style={styles.primaryAgentName}>{customer.primaryAgent}</Text>
      </View>

      <Pressable
        onPress={() => onCollectDeposit?.(customer.id)}
        style={({ pressed }) => [styles.collectButton, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.buttonIcon}>💵</Text>
        <Text style={styles.buttonText}>{t('delegatedCustomerCard.collectDeposit')}</Text>
      </Pressable>
    </View>
  );
}


import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { CustomerProfile } from '@/types/CustomerDetailData';

interface CustomerProfileCardProps {
  customer: CustomerProfile;
}

export default function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: spacing(theme, 'xxs'),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '100%',
      paddingHorizontal: spacing(theme, 'xs'),
      gap: 9,
    },
    customerName: {
      ...typography(theme, 'displayXL'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
      flexShrink: 1,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.status.success,
      flexShrink: 0,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    phoneIcon: {
      fontSize: 18,
      color: theme.colors.brand.primary,
    },
    phoneNumber: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing(theme, 'xs'),
      maxWidth: '100%',
    },
    locationIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
      marginTop: 2,
    },
    address: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      flex: 1,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      {customer.avatarUrl ? (
        <Image source={{ uri: customer.avatarUrl }} style={styles.avatarImage} />
      ) : null}

      <View style={styles.nameRow}>
        <Text style={styles.customerName} numberOfLines={2}>
          {customer.name}
        </Text>
        {customer.isOnline ? <View style={styles.statusDot} /> : null}
      </View>

      <View style={styles.phoneContainer}>
        <Text style={styles.phoneIcon}>📞</Text>
        <Text style={styles.phoneNumber}>{customer.phone}</Text>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.address}>{customer.address}</Text>
      </View>
    </View>
  );
}

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
      padding: spacing(theme, 'xl'),
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      alignItems: 'center',
      gap: spacing(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.background.cardElevated,
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.status.success,
      borderWidth: 3,
      borderColor: theme.colors.background.card,
    },
    customerName: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
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
      <View style={styles.avatarContainer}>
        {customer.avatarUrl ? (
          <Image source={{ uri: customer.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar} />
        )}
        {customer.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <Text style={styles.customerName}>{customer.name}</Text>

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


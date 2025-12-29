import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing } from '@/theme';
import InfoBanner from '@/components/elements/InfoBanner';
import DelegatedCustomerCard from '@/components/elements/DelegatedCustomerCard';
import type { DelegatedCustomer, DelegationInfo } from '@/types/DelegatedData';

export default function DelegatedCustomers() {
  const router = useRouter();
  const { theme } = useTheme();
  const [showBanner, setShowBanner] = useState(true);

  // Mock data - replace with actual data from Redux/API
  const delegationInfo: DelegationInfo = {
    showBanner: true,
    title: 'Temporary Assignment',
    message: 'These customers are temporarily assigned to you for collection today.',
  };

  const delegatedCustomers: DelegatedCustomer[] = [
    {
      id: '1',
      customerId: 'CUST-4291',
      customerName: 'Ramesh Gupta',
      accountNumber: '4291',
      accountNumberMasked: '•••• 4291',
      primaryAgent: 'Suresh K.',
      validTill: 'Oct 24',
      delegatedDate: '2023-10-24',
      avatarUrl: undefined,
    },
    {
      id: '2',
      customerId: 'CUST-8821',
      customerName: 'Anita Desai',
      accountNumber: '8821',
      accountNumberMasked: '•••• 8821',
      primaryAgent: 'Suresh K.',
      validTill: 'Oct 24',
      delegatedDate: '2023-10-24',
      avatarUrl: undefined,
    },
    {
      id: '3',
      customerId: 'CUST-1034',
      customerName: 'Vikram Singh',
      accountNumber: '1034',
      accountNumberMasked: '•••• 1034',
      primaryAgent: 'Suresh K.',
      validTill: 'Oct 25',
      delegatedDate: '2023-10-25',
      avatarUrl: undefined,
    },
  ];

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
      gap: spacing(theme, 'md'),
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
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl'),
    },
    customersList: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'md'),
    },
    emptyState: {
      padding: spacing(theme, 'xxl'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 48,
      opacity: 0.3,
    },
    emptyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    floatingInfo: {
      position: 'absolute',
      bottom: spacing(theme, 'xl'),
      right: spacing(theme, 'md'),
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    floatingInfoIcon: {
      fontSize: 24,
      color: '#FFFFFF',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleCollectDeposit = (customerId: string) => {
    console.log('Collect deposit pressed for customer:', customerId);
    // TODO: Navigate to deposit collection screen
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  const handleInfoPress = () => {
    console.log('Info button pressed');
    // TODO: Show delegation details modal
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Delegated Customers</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {showBanner && (
          <InfoBanner
            title={delegationInfo.title}
            message={delegationInfo.message}
            onClose={handleCloseBanner}
          />
        )}

        <View style={styles.customersList}>
          {delegatedCustomers.length > 0 ? (
            delegatedCustomers.map((customer) => (
              <DelegatedCustomerCard
                key={customer.id}
                customer={customer}
                onCollectDeposit={handleCollectDeposit}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                No delegated customers at the moment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleInfoPress}
        style={({ pressed }) => [styles.floatingInfo, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.floatingInfoIcon}>ℹ️</Text>
      </Pressable>
    </SafeAreaView>
  );
}


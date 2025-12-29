import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing } from '@/theme';
import CustomerProfileCard from '@/components/elements/CustomerProfileCard';
import AccountCard from '@/components/elements/AccountCard';
import type { CustomerDetailData } from '@/types/CustomerDetailData';

export default function CustomerDetail() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API
  const customerData: CustomerDetailData = {
    customer: {
      id: 'CUST-001',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      address: 'Shop No. 4, Main Market, Tilakwadi, Belgaum',
      avatarUrl: undefined,
      isOnline: true,
    },
    accounts: [
      {
        id: 'ACC-001',
        accountType: 'pigmy',
        accountNumber: '#PGM-8821',
        label: 'Daily Collection',
        amount: 500.0,
        dueToday: 500,
        status: 'pending',
        progress: 60,
      },
      {
        id: 'ACC-002',
        accountType: 'loan',
        accountNumber: '#LN-4421',
        label: 'Monthly EMI',
        amount: 1200.0,
        dueToday: 0,
        status: 'paid',
        progress: undefined,
      },
    ],
  };

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
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'md'),
      flex: 1,
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
    },
    syncButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceTint.successSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncIcon: {
      fontSize: 20,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'lg'),
      paddingBottom: spacing(theme, 'xxl') + 80,
    },
    accountsSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    accountsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    accountsTitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    accountsCount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    accountsList: {
      gap: spacing(theme, 'md'),
    },
    actionButtons: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.card,
      padding: spacing(theme, 'screenPadding'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.background.divider,
      gap: spacing(theme, 'sm'),
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    secondaryButtonIcon: {
      fontSize: 18,
      color: theme.colors.text.primary,
    },
    secondaryButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    primaryButtonIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    primaryButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleCallCustomer = () => {
    const phoneNumber = customerData.customer.phone.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleViewPassbook = () => {
    console.log('View passbook pressed');
    // TODO: Navigate to passbook screen
  };

  const handleCollectDeposit = () => {
    console.log('Collect deposit pressed');
    // TODO: Navigate to collection screen
  };

  const handleAccountPress = (accountId: string) => {
    console.log('Account pressed:', accountId);
    // TODO: Navigate to account details
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.title}>Customer Detail</Text>
        </View>

        <Pressable style={styles.syncButton}>
          <Text style={styles.syncIcon}>☁️</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <CustomerProfileCard customer={customerData.customer} />

        <View style={styles.accountsSection}>
          <View style={styles.accountsHeader}>
            <Text style={styles.accountsTitle}>ACTIVE ACCOUNTS</Text>
            <Text style={styles.accountsCount}>{customerData.accounts.length} Accounts</Text>
          </View>

          <View style={styles.accountsList}>
            {customerData.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPress={handleAccountPress}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleCallCustomer}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.secondaryButtonIcon}>📞</Text>
            <Text style={styles.secondaryButtonText}>Call Customer</Text>
          </Pressable>

          <Pressable
            onPress={handleViewPassbook}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.secondaryButtonIcon}>📖</Text>
            <Text style={styles.secondaryButtonText}>View Passbook</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleCollectDeposit}
          style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.primaryButtonIcon}>💵</Text>
          <Text style={styles.primaryButtonText}>Collect Deposit</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


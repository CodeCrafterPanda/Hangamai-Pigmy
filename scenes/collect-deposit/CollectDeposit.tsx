import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import InfoCard from '@/components/elements/InfoCard';
import AmountSelector from '@/components/elements/AmountSelector';
import PaymentModeSelector from '@/components/elements/PaymentModeSelector';
import type { CollectDepositData, PaymentMode } from '@/types/CollectDepositData';

export default function CollectDeposit() {
  const router = useRouter();
  const { theme } = useTheme();
  const [amount, setAmount] = useState(500);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  // Mock data - replace with actual data from Redux/API
  const depositData: CollectDepositData = {
    customer: {
      id: 'CUST-001',
      name: 'Rajesh Kumar',
      accountNumber: '1029 3847 56',
      avatarUrl: undefined,
      isOnline: true,
    },
    depositInfo: {
      dueAmount: 500,
      missedDays: 2,
      penaltyAmount: 20,
    },
  };

  const fullDueAmount =
    depositData.depositInfo.dueAmount + depositData.depositInfo.penaltyAmount;

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
      paddingBottom: spacing(theme, 'xxl') + 100,
    },
    customerCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      padding: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    avatarContainer: {
      position: 'relative',
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
    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.status.success,
      borderWidth: 2,
      borderColor: theme.colors.background.card,
    },
    customerInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    accountNumber: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    infoCardsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'xl'),
    },
    amountSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'xl'),
    },
    paymentModeSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
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
    secondaryButton: {
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
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    secondaryButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleGenerateReceipt = () => {
    console.log('Generate receipt pressed', {
      amount,
      paymentMode,
      customer: depositData.customer.id,
    });
    // TODO: Generate receipt and navigate to receipt screen
  };

  const handleSaveOffline = () => {
    console.log('Save offline pressed', {
      amount,
      paymentMode,
      customer: depositData.customer.id,
    });
    // TODO: Save transaction offline
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Collect Deposit</Text>
      </View> */}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.customerCard}>
          <View style={styles.avatarContainer}>
            {depositData.customer.avatarUrl ? (
              <Image
                source={{ uri: depositData.customer.avatarUrl }}
                style={styles.avatarImage}
              />
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
                    {getInitials(depositData.customer.name)}
                  </Text>
                </View>
              </View>
            )}
            {depositData.customer.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{depositData.customer.name}</Text>
            <Text style={styles.accountNumber}>A/C: {depositData.customer.accountNumber}</Text>
          </View>
        </View>

        <View style={styles.infoCardsRow}>
          <InfoCard
            variant="due"
            label="DUE"
            value={`₹${depositData.depositInfo.dueAmount}`}
          />
          <InfoCard
            variant="missed"
            label="MISSED"
            value={`${depositData.depositInfo.missedDays} Days`}
            showIndicator
          />
          <InfoCard
            variant="penalty"
            label="PENALTY"
            value={`+₹${depositData.depositInfo.penaltyAmount}`}
          />
        </View>

        <View style={styles.amountSection}>
          <AmountSelector
            amount={amount}
            onAmountChange={setAmount}
            fullDueAmount={fullDueAmount}
          />
        </View>

        <View style={styles.paymentModeSection}>
          <PaymentModeSelector selectedMode={paymentMode} onModeChange={setPaymentMode} />
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <Pressable
          onPress={handleGenerateReceipt}
          style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.primaryButtonIcon}>🧾</Text>
          <Text style={styles.primaryButtonText}>Generate Receipt</Text>
        </Pressable>

        <Pressable
          onPress={handleSaveOffline}
          style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.secondaryButtonIcon}>📴</Text>
          <Text style={styles.secondaryButtonText}>Save Offline</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


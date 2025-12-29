import { View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { ReceiptData, ShareMethod } from '@/types/ReceiptData';

export default function Receipt() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API/route params
  const receiptData: ReceiptData = {
    receiptNumber: 'RCPT-2023-8892',
    totalAmount: 2000.0,
    customerName: 'Rajesh Kumar',
    accountNumber: '4592',
    accountNumberMasked: '•••• •••• 4592',
    date: 'Oct 24, 2023',
    time: '10:45 AM',
    paymentMode: 'Cash Deposit',
    agentId: 'AGT-SOUTH-04 (Self)',
    isSavedLocally: true,
    initials: 'RK',
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
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeIcon: {
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
    },
    printButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    printText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    scrollContent: {
      paddingTop: spacing(theme, 'xl'),
      paddingBottom: spacing(theme, 'xxl'),
    },
    successSection: {
      alignItems: 'center',
      gap: spacing(theme, 'lg'),
      marginBottom: spacing(theme, 'xl'),
    },
    successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(46, 212, 122, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    successIconInner: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.status.success,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      fontSize: 36,
      color: '#FFFFFF',
    },
    successTitle: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    successSubtitle: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    receiptCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      overflow: 'hidden',
      borderTopWidth: 3,
      borderTopColor: theme.colors.brand.primary,
    },
    cardContent: {
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'lg'),
    },
    amountSection: {
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    amountLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    amount: {
      ...typography(theme, 'displayXL'),
      fontSize: 40,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    receiptNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      backgroundColor: theme.colors.background.cardElevated,
      paddingVertical: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'md'),
      borderRadius: radius(theme, 'button'),
    },
    receiptIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    receiptNumber: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    copyIcon: {
      fontSize: 16,
      color: theme.colors.brand.primary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.background.divider,
    },
    customerSection: {
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
      fontWeight: '700',
    },
    customerInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    sectionLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    accountNumber: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    detailsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'lg'),
    },
    detailItem: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    detailLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    detailValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    detailValueWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    paymentIcon: {
      fontSize: 16,
    },
    agentSection: {
      gap: spacing(theme, 'xxs'),
    },
    agentValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    localSaveBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      backgroundColor: 'rgba(244, 196, 48, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(244, 196, 48, 0.3)',
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'sm'),
    },
    warningIcon: {
      fontSize: 18,
    },
    localSaveText: {
      ...typography(theme, 'caption'),
      color: '#D4A62E',
      fontWeight: '600',
      flex: 1,
    },
    shareSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginTop: spacing(theme, 'lg'),
    },
    shareButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'md'),
      justifyContent: 'center',
    },
    shareButton: {
      width: 100,
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    shareIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    whatsappBg: {
      backgroundColor: 'rgba(37, 211, 102, 0.15)',
    },
    smsBg: {
      backgroundColor: 'rgba(59, 111, 255, 0.15)',
    },
    pdfBg: {
      backgroundColor: 'rgba(255, 77, 79, 0.15)',
    },
    shareIcon: {
      fontSize: 24,
    },
    shareLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    backButton: {
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginTop: spacing(theme, 'xl'),
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    backButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    backButtonIcon: {
      fontSize: 16,
      color: '#FFFFFF',
    },
  });

  const handleClose = () => {
    router.back();
  };

  const handlePrint = () => {
    console.log('Print receipt');
    // TODO: Implement print functionality
  };

  const handleCopyReceipt = () => {
    console.log('Copy receipt number:', receiptData.receiptNumber);
    // TODO: Copy to clipboard
  };

  const handleShare = (method: ShareMethod) => {
    console.log('Share via:', method);
    const message = `Receipt: ${receiptData.receiptNumber}\nAmount: ₹${receiptData.totalAmount.toLocaleString('en-IN')}\nCustomer: ${receiptData.customerName}`;
    
    if (method === 'whatsapp' || method === 'sms') {
      Share.share({ message });
    } else if (method === 'pdf') {
      // TODO: Generate PDF
      console.log('Generate PDF');
    }
  };

  const handleBackToHome = () => {
    router.push('/(main)/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Receipt</Text>
        <Pressable onPress={handlePrint} style={styles.printButton}>
          <Text style={styles.printText}>Print</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <View style={styles.successIconInner}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.successTitle}>Transaction Successful</Text>
          <Text style={styles.successSubtitle}>Funds added to pigmy account</Text>
        </View>

        <View style={styles.receiptCard}>
          <View style={styles.cardContent}>
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.amount}>
                ₹ {receiptData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <Pressable onPress={handleCopyReceipt} style={styles.receiptNumberContainer}>
              <Text style={styles.receiptIcon}>📄</Text>
              <Text style={styles.receiptNumber}>{receiptData.receiptNumber}</Text>
              <Text style={styles.copyIcon}>📋</Text>
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.customerSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{receiptData.initials}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.sectionLabel}>CUSTOMER</Text>
                <Text style={styles.customerName}>{receiptData.customerName}</Text>
                <Text style={styles.accountNumber}>A/C: {receiptData.accountNumberMasked}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DATE & TIME</Text>
                <Text style={styles.detailValue}>{receiptData.date}</Text>
                <Text style={styles.detailValue}>{receiptData.time}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PAYMENT MODE</Text>
                <View style={styles.detailValueWithIcon}>
                  <Text style={styles.paymentIcon}>💵</Text>
                  <Text style={styles.detailValue}>{receiptData.paymentMode}</Text>
                </View>
              </View>
            </View>

            <View style={styles.agentSection}>
              <Text style={styles.detailLabel}>AGENT ID</Text>
              <Text style={styles.agentValue}>{receiptData.agentId}</Text>
            </View>

            {receiptData.isSavedLocally && (
              <View style={styles.localSaveBanner}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.localSaveText}>
                  Saved locally. Will sync when online.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.shareSection}>
          <View style={styles.shareButtons}>
            <Pressable
              onPress={() => handleShare('whatsapp')}
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.shareIconContainer, styles.whatsappBg]}>
                <Text style={styles.shareIcon}>💬</Text>
              </View>
              <Text style={styles.shareLabel}>WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={() => handleShare('sms')}
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.shareIconContainer, styles.smsBg]}>
                <Text style={styles.shareIcon}>💬</Text>
              </View>
              <Text style={styles.shareLabel}>SMS</Text>
            </Pressable>

            <Pressable
              onPress={() => handleShare('pdf')}
              style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.shareIconContainer, styles.pdfBg]}>
                <Text style={styles.shareIcon}>📄</Text>
              </View>
              <Text style={styles.shareLabel}>PDF</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleBackToHome}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
          <Text style={styles.backButtonIcon}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}


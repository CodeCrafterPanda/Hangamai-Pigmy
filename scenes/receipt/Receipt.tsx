import { View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { ReceiptData, ShareMethod } from '@/types/ReceiptData';

interface ReceiptProps {
  collectionId?: string;
  onClose?: () => void;
}

export default function Receipt({ collectionId, onClose }: ReceiptProps) {
  const router = useRouter();
  const { theme } = useTheme();

  // Get collection data from Redux
  const collection = useSelector((state: State) =>
    collectionId ? state.collections.collections.byId[collectionId] : null
  );

  const customer = useSelector((state: State) =>
    collection ? state.customers.customers.byId[collection.customerId] : null
  );

  const account = useSelector((state: State) =>
    collection ? state.accounts.accounts.byId[collection.accountId] : null
  );

  // Get initials helper
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isUpiPayment = collection?.mode === 'UPI';

  // A receipt is evidence of a real transaction. When the collection, its customer or its
  // account cannot be resolved there is nothing to evidence, so the screen says so rather
  // than rendering placeholder figures that would read as a genuine receipt.
  const receiptData: ReceiptData | undefined =
    collection && customer && account
      ? {
          receiptNumber: collection.receiptNo,
          totalAmount: collection.amount + collection.penaltyAmount,
          customerName: customer.fullName,
          accountNumber: account.accountNumber.slice(-4),
          accountNumberMasked: `•••• •••• ${account.accountNumber.slice(-4)}`,
          date: new Date(collection.collectedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          time: new Date(collection.collectedAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMode: collection.mode === 'CASH' ? 'Cash Deposit' : 'UPI Payment',
          agentId: collection.collectedByAgentId,
          isSavedLocally: collection.status === 'CREATED',
          initials: getInitials(customer.fullName),
        }
      : undefined;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.app,
    },
    content: {
      // paddingTop: spacing(theme, 'xl'),
      padding: spacing(theme, 'screenPadding'),
    },


    receiptCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
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
      backgroundColor: theme.colors.surfaceTint.successSoft,
    },
    smsBg: {
      backgroundColor: theme.colors.surfaceTint.infoSoft,
    },
    pdfBg: {
      backgroundColor: theme.colors.surfaceTint.errorSoft,
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
    emptyState: {
      padding: spacing(theme, 'xl'),
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    emptyIcon: {
      fontSize: 40,
    },
    emptyText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyHint: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handlePrint = () => {
    console.log('Print receipt');
    // TODO: Implement print functionality
  };

  const handleCopyReceipt = () => {
    console.log('Copy receipt number:', receiptData?.receiptNumber);
    // TODO: Copy to clipboard
  };

  const handleShare = (method: ShareMethod) => {
    if (!receiptData) {
      return;
    }

    console.log('Share via:', method);
    const message = `Receipt: ${receiptData.receiptNumber}\nAmount: ₹${receiptData.totalAmount.toLocaleString('en-IN')}\nCustomer: ${receiptData.customerName}`;

    if (method === 'whatsapp' || method === 'sms') {
      Share.share({ message });
    } else if (method === 'pdf') {
      // TODO: Generate PDF
      console.log('Generate PDF');
    }
  };

  if (!receiptData) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>Receipt not available</Text>
          <Text style={styles.emptyHint}>
            The transaction behind this receipt could not be found on this device.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
                  <Text style={styles.paymentIcon}>{isUpiPayment ? '📱' : '💵'}</Text>
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
      </View>
    </View>
  );
}


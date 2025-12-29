import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

interface AmountSelectorProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  fullDueAmount: number;
  quickAmounts?: number[];
}

export default function AmountSelector({
  amount,
  onAmountChange,
  fullDueAmount,
  quickAmounts = [100, 200, 500],
}: AmountSelectorProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: spacing(theme, 'lg'),
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      textAlign: 'center',
    },
    amountDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'sm'),
    },
    currencySymbol: {
      ...typography(theme, 'displayXL'),
      fontSize: 48,
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    amountValue: {
      ...typography(theme, 'displayXL'),
      fontSize: 72,
      color: theme.colors.text.primary,
      fontWeight: '700',
      lineHeight: 80,
    },
    quickButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing(theme, 'sm'),
      flexWrap: 'wrap',
    },
    quickButton: {
      paddingHorizontal: spacing(theme, 'lg'),
      paddingVertical: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'button') + 8,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      minWidth: 100,
      alignItems: 'center',
    },
    quickButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    fullDueButton: {
      paddingHorizontal: spacing(theme, 'xl'),
      paddingVertical: spacing(theme, 'sm') + 2,
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'button') + 8,
      borderWidth: 1,
      borderColor: theme.colors.brand.primary,
      minWidth: 140,
      alignItems: 'center',
    },
    fullDueButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
  });

  const handleQuickAmount = (quickAmount: number) => {
    onAmountChange(amount + quickAmount);
  };

  const handleFullDue = () => {
    onAmountChange(fullDueAmount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ENTER AMOUNT</Text>

      <View style={styles.amountDisplay}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amountValue}>{amount}</Text>
      </View>

      <View style={styles.quickButtons}>
        {quickAmounts.map((quickAmount) => (
          <Pressable
            key={quickAmount}
            onPress={() => handleQuickAmount(quickAmount)}
            style={({ pressed }) => [styles.quickButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.quickButtonText}>+ ₹{quickAmount}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={handleFullDue}
          style={({ pressed }) => [styles.fullDueButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.fullDueButtonText}>Full Due</Text>
        </Pressable>
      </View>
    </View>
  );
}


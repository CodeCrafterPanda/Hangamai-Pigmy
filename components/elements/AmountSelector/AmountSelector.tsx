import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
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
  quickAmounts = [100, 200, 300, 400, 500, 1000, 2000, 5000, 10000],
}: AmountSelectorProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    amountDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'sm'),
      marginBottom: spacing(theme, 'lg'),
    },
    currencySymbol: {
      ...typography(theme, 'displayXL'),
      fontSize: 48,
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    amountValue: {
      ...typography(theme, 'displayXL'),
      fontSize: 48,
      color: theme.colors.text.primary,
      fontWeight: '700',
      lineHeight: 60,
    },
    quickButtonsContainer: {
      gap: spacing(theme, 'md'),
    },
    flatListContainer: {
      paddingLeft: spacing(theme, 'xs'),
      paddingRight: 80, // Extra padding to show more buttons exist
    },
    quickButton: {
      paddingHorizontal: spacing(theme, 'lg'),
      paddingVertical: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      minWidth: 100,
      alignItems: 'center',
      marginRight: spacing(theme, 'sm'),
    },
    quickButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    clearButtonContainer: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    clearButton: {
      width: '100%',
      paddingVertical: spacing(theme, 'md'),
      backgroundColor: theme.colors.status.error,
      borderRadius: radius(theme, 'button'),
      alignItems: 'center',
    },
    clearButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

  const handleQuickAmount = (quickAmount: number) => {
    onAmountChange(amount + quickAmount);
  };

  const handleClear = () => {
    onAmountChange(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ENTER AMOUNT</Text>

      <View style={styles.amountDisplay}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amountValue}>{amount}</Text>
      </View>

      <View style={styles.quickButtonsContainer}>
        <FlatList
          data={quickAmounts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.flatListContainer}
          renderItem={({ item: quickAmount }) => (
            <Pressable
              onPress={() => handleQuickAmount(quickAmount)}
              style={({ pressed }) => [styles.quickButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.quickButtonText}>+ ₹{quickAmount}</Text>
            </Pressable>
          )}
        />

        <View style={styles.clearButtonContainer}>
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}


import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, typography, spacing, radius } from '@/theme';

interface CollectedTodayCardProps {
  amount: number;
}

export default function CollectedTodayCard({ amount }: CollectedTodayCardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      borderRadius: radius(theme, 'card'),
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    gradient: {
      padding: spacing(theme, 'xl'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftContent: {
      flex: 1,
      gap: spacing(theme, 'xs'),
    },
    label: {
      ...typography(theme, 'sectionTitle'),
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing(theme, 'xxs'),
    },
    currency: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    amount: {
      ...typography(theme, 'displayXL'),
      fontSize: 42,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    iconContainer: {
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.3,
    },
    moneyIcon: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    moneyIconInner: {
      width: 60,
      height: 40,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    moneyCircle: {
      position: 'absolute',
      top: 10,
      right: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
  });

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-IN');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.brand.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.leftContent}>
          <Text style={styles.label}>Collected Today</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.amount}>{formatAmount(amount)}</Text>
          </View>
        </View>

        <View style={styles.iconContainer}>
          <View style={styles.moneyIcon}>
            <View style={styles.moneyIconInner} />
            <View style={styles.moneyCircle} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}


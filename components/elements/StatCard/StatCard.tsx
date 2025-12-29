import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

type StatType = 'pending' | 'inHand';

interface StatCardProps {
  type: StatType;
  value: number | string;
  onPress?: () => void;
}

export default function StatCard({ type, value, onPress }: StatCardProps) {
  const { theme } = useTheme();

  const config = {
    pending: {
      label: 'PENDING',
      iconColor: '#D4834D',
      iconBg: 'rgba(212, 131, 77, 0.15)',
      icon: '📋',
    },
    inHand: {
      label: 'IN HAND',
      iconColor: '#38D39F',
      iconBg: 'rgba(56, 211, 159, 0.15)',
      icon: '💵',
    },
  };

  const currentConfig = config[type];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: currentConfig.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      fontSize: 16,
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    value: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
  });

  const formattedValue =
    typeof value === 'number' && type === 'inHand'
      ? `₹ ${(value / 1000).toFixed(0)}k`
      : value.toString();

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{currentConfig.icon}</Text>
        </View>
        <Text style={styles.label}>{currentConfig.label}</Text>
      </View>
      <Text style={styles.value}>{formattedValue}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}


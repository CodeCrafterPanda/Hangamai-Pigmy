import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

type StatType = 'pending' | 'inHand' | 'online';

interface StatCardProps {
  type: StatType;
  value: number | string;
  onPress?: () => void;
}

function formatRupeeAmount(value: number): string {
  return value >= 1000 ? `₹ ${(value / 1000).toFixed(1)}k` : `₹ ${value}`;
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
    online: {
      label: 'ONLINE',
      iconColor: '#4C8DFF',
      iconBg: 'rgba(76, 141, 255, 0.15)',
      icon: '📱',
    },
  };

  const currentConfig = config[type];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xs'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: currentConfig.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      fontSize: 14,
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      letterSpacing: 0.5,
      fontSize: 10,
      flexShrink: 1,
    },
    value: {
      ...typography(theme, 'displayXL'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
  });

  const formattedValue =
    typeof value === 'number' && (type === 'inHand' || type === 'online')
      ? formatRupeeAmount(value)
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


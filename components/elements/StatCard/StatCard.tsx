import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';

type StatType = 'pending' | 'inHand' | 'online';

interface StatCardProps {
  type: StatType;
  value: number | string;
  onPress?: () => void;
  /** Relative row width. Pending uses a smaller flex than In Hand / Online. */
  flex?: number;
}

function formatRupeeAmount(value: number): string {
  return value >= 1000 ? `₹ ${(value / 1000).toFixed(1)}k` : `₹ ${value}`;
}

export default function StatCard({ type, value, onPress, flex = 1 }: StatCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const config = {
    pending: {
      label: t('statCard.pending'),
      iconColor: '#D4834D',
      iconBg: 'rgba(212, 131, 77, 0.15)',
      icon: '📋',
    },
    inHand: {
      label: t('statCard.inHand'),
      iconColor: '#38D39F',
      iconBg: 'rgba(56, 211, 159, 0.15)',
      icon: '💵',
    },
    online: {
      label: t('statCard.online'),
      iconColor: '#4C8DFF',
      iconBg: 'rgba(76, 141, 255, 0.15)',
      icon: '📱',
    },
  };

  const currentConfig = config[type];

  const styles = StyleSheet.create({
    container: {
      // The card is a single box in the stats row: grow/basis size it across the row, and its
      // height stays content-driven. Nesting it in a flexed wrapper would reinterpret this as
      // a vertical basis of 0 and collapse the card.
      flexGrow: flex,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xs'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      borderLeftColor: currentConfig.iconColor,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    iconContainer: {
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 8,
      backgroundColor: currentConfig.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      fontSize: 14,
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
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
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{currentConfig.icon}</Text>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {currentConfig.label}
        </Text>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {formattedValue}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}


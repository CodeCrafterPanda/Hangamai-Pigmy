import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

type InfoCardVariant = 'due' | 'missed' | 'penalty';

interface InfoCardProps {
  variant: InfoCardVariant;
  label: string;
  value: string | number;
  showIndicator?: boolean;
}

export default function InfoCard({ variant, label, value, showIndicator = false }: InfoCardProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'due':
        return {
          valueColor: theme.colors.text.primary,
          indicatorColor: 'transparent',
        };
      case 'missed':
        return {
          valueColor: '#D4834D',
          indicatorColor: '#D4834D',
        };
      case 'penalty':
        return {
          valueColor: theme.colors.status.error,
          indicatorColor: 'transparent',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'md'),
      gap: spacing(theme, 'xs'),
      position: 'relative',
      overflow: 'visible',
      minWidth: 0,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xxs'),
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    indicator: {
      position: 'absolute',
      top: -4,
      right: spacing(theme, 'md'),
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 12,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: variantStyles.indicatorColor,
    },
    value: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: variantStyles.valueColor,
      fontWeight: '700',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {showIndicator && <View style={styles.indicator} />}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}


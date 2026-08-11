import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

type FilterVariant = 'due' | 'overdue' | 'collected';

interface FilterChipProps {
  label: string;
  count: number;
  variant: FilterVariant;
  isActive?: boolean;
  onPress?: () => void;
}

export default function FilterChip({
  label,
  count,
  variant,
  isActive = false,
  onPress,
}: FilterChipProps) {
  const { theme } = useTheme();

  const getVariantConfig = () => {
    switch (variant) {
      case 'due':
        return {
          icon: '📅',
          activeBackground: theme.colors.brand.primary,
          inactiveBackground: theme.colors.background.cardElevated,
          activeTextColor: '#FFFFFF',
          inactiveTextColor: theme.colors.text.secondary,
          activeBorderColor: theme.colors.brand.primary,
          inactiveBorderColor: theme.colors.background.divider,
        };
      case 'overdue':
        return {
          icon: '⚠️',
          activeBackground: theme.colors.background.cardElevated,
          inactiveBackground: theme.colors.background.cardElevated,
          activeTextColor: '#D4834D',
          inactiveTextColor: theme.colors.text.secondary,
          activeBorderColor: '#D4834D',
          inactiveBorderColor: theme.colors.background.divider,
        };
      case 'collected':
        return {
          icon: '✓',
          activeBackground: theme.colors.surfaceTint.successSoft,
          inactiveBackground: theme.colors.background.cardElevated,
          activeTextColor: theme.colors.status.success,
          inactiveTextColor: theme.colors.text.secondary,
          activeBorderColor: theme.colors.status.success,
          inactiveBorderColor: theme.colors.background.divider,
        };
    }
  };

  const config = getVariantConfig();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      backgroundColor: isActive ? config.activeBackground : config.inactiveBackground,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: isActive ? config.activeBorderColor : config.inactiveBorderColor,
    },
    icon: {
      fontSize: 16,
    },
    label: {
      ...typography(theme, 'body'),
      color: isActive ? config.activeTextColor : config.inactiveTextColor,
      fontWeight: '600',
    },
    count: {
      ...typography(theme, 'body'),
      color: isActive ? config.activeTextColor : config.inactiveTextColor,
      fontWeight: '700',
    },
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>({count})</Text>
    </Pressable>
  );
}


import { View, Text, StyleSheet, ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme, typography } from '@/theme';

export interface ChipProps extends ViewProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function Chip({ label, variant = 'default', style, textStyle, ...others }: ChipProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.surfaceTint.primarySoft,
          color: theme.colors.brand.primary,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.surfaceTint.successSoft,
          color: theme.colors.status.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.surfaceTint.warningSoft,
          color: theme.colors.status.warning,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.surfaceTint.errorSoft,
          color: theme.colors.status.error,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.surfaceTint.infoSoft,
          color: theme.colors.status.info,
        };
      default:
        return {
          backgroundColor: theme.components.chip.background,
          color: theme.components.chip.textColor,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const styles = StyleSheet.create({
    chip: {
      height: theme.components.chip.height,
      paddingHorizontal: theme.components.chip.paddingHorizontal,
      backgroundColor: variantStyles.backgroundColor,
      borderRadius: theme.radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    label: {
      fontSize: theme.components.chip.fontSize,
      fontWeight: '600',
      color: variantStyles.color,
    },
  });

  return (
    <View style={[styles.chip, style]} {...others}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

export default Chip;

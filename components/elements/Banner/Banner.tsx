import { View, Text, StyleSheet, ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme, typography, spacing, bannerVariant } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export interface BannerProps extends ViewProps {
  message: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showIcon?: boolean;
}

function Banner({
  message,
  variant = 'info',
  icon,
  style,
  textStyle,
  showIcon = true,
  ...others
}: BannerProps) {
  const { theme } = useTheme();
  const variantStyles = bannerVariant(theme, variant);

  const defaultIcons = {
    info: 'information-circle' as const,
    warning: 'warning' as const,
    success: 'checkmark-circle' as const,
    error: 'close-circle' as const,
  };

  const iconName = icon || defaultIcons[variant];

  const styles = StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: variantStyles.background,
      borderWidth: 1,
      borderColor: variantStyles.borderColor,
      borderRadius: theme.radius.card,
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
    },
    iconContainer: {
      flexShrink: 0,
    },
    textContainer: {
      flex: 1,
    },
    text: {
      ...typography(theme, 'body'),
      color: variantStyles.textColor,
    },
  });

  return (
    <View style={[styles.banner, style]} {...others}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={theme.icons.secondarySize} color={variantStyles.iconColor} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.text, textStyle]}>{message}</Text>
      </View>
    </View>
  );
}

export default Banner;

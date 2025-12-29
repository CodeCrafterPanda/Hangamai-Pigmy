import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import Button, { ButtonProps } from '../Button';

export interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  gradientBackgroundProps?: LinearGradientProps;
  gradientBackgroundStyle?: StyleProp<ViewStyle>;
  useThemeGradient?: boolean;
}

function GradientButton({
  gradientBackgroundProps,
  gradientBackgroundStyle,
  style,
  useThemeGradient = false,
  ...others
}: GradientButtonProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    root: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
  });

  const defaultGradientProps: LinearGradientProps = useThemeGradient
    ? {
      colors: theme.colors.brand.primaryGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    }
    : gradientBackgroundProps || {
      colors: theme.colors.brand.primaryGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };

  return (
    <Button {...others} style={[styles.root, style]}>
      <LinearGradient
        {...defaultGradientProps}
        style={[styles.gradientBackground, gradientBackgroundStyle]}
      />
    </Button>
  );
}

export default GradientButton;

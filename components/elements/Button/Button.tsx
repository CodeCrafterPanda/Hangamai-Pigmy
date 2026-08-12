import {
  Pressable,
  PressableProps,
  Text,
  ActivityIndicator,
  GestureResponderEvent,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/theme';
import { buttonVariant, spacing, typography, radius } from '@/theme/createTheme';
import Image from '../Image';

export interface ButtonProps extends PressableProps {
  title?: string;
  image?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  titleStyle?: StyleProp<TextStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  isLoading?: boolean;
  loaderColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

function Button({
  title,
  titleStyle,
  image,
  style,
  disabled,
  isLoading,
  loaderColor,
  imageStyle,
  children,
  variant = 'primary',
  fullWidth = false,
  ...others
}: ButtonProps) {
  const { theme } = useTheme();
  const variantStyles = buttonVariant(theme, variant);

  const defaultLoaderColor =
    loaderColor ||
    (variant === 'secondary' && theme.meta.mode === 'light'
      ? theme.colors.brand.primary
      : theme.colors.text.primary);

  const styles = StyleSheet.create({
    root: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: theme.components.button.height,
      paddingHorizontal: spacing(theme, 'md'),
      borderRadius: radius(theme, 'button'),
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderColor ? 1 : 0,
      borderColor: variantStyles.borderColor,
      minHeight: theme.ux.touchTargetMin,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.6 : 1,
    },
    title: {
      ...typography(theme, 'body'),
      fontWeight: '600',
      color: variantStyles.color,
    },
  });

  return (
    <Pressable
      style={[styles.root, style]}
      disabled={disabled ?? isLoading}
      {...others}>
      {children}
      {isLoading && <ActivityIndicator size="small" color={defaultLoaderColor} />}
      {!isLoading && image && <Image source={image} style={imageStyle} />}
      {!isLoading && title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
    </Pressable>
  );
}

export default Button;

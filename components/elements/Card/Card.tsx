import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme, spacing, radius, shadow } from '@/theme';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

function Card({ children, elevated = false, style, ...others }: CardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: elevated
        ? theme.colors.background.cardElevated
        : theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'cardPadding'),
      borderWidth: theme.components.card.elevation === 0 ? 1 : 0,
      borderColor: theme.components.card.borderColor,
      ...shadow(theme.components.card.elevation),
    },
  });

  return (
    <View style={[styles.card, style]} {...others}>
      {children}
    </View>
  );
}

export default Card;

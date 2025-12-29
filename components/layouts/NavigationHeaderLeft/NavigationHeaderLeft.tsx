import { SimpleLineIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function NavigationHeaderLeft({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <SimpleLineIcons.Button
      name="menu"
      size={theme.icons.primarySize}
      color={theme.icons.color}
      backgroundColor="transparent"
      onPress={onPress}
    />
  );
}

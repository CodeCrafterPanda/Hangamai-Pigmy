import { View, StyleSheet } from 'react-native';
import { useTheme, spacing } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  progress,
  height = 8,
  color,
  backgroundColor,
}: ProgressBarProps) {
  const { theme } = useTheme();

  const getProgressColor = () => {
    if (color) return color;
    if (progress === 100) return theme.colors.status.success;
    if (progress >= 50) return theme.colors.brand.primary;
    return theme.colors.brand.primary;
  };

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      height,
      backgroundColor: backgroundColor || theme.colors.background.divider,
      borderRadius: height / 2,
      overflow: 'hidden',
    },
    progress: {
      height: '100%',
      backgroundColor: getProgressColor(),
      borderRadius: height / 2,
      width: `${Math.min(Math.max(progress, 0), 100)}%`,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.progress} />
    </View>
  );
}


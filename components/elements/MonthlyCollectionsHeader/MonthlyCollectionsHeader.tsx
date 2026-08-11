import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';
import { useRouter } from 'expo-router';

interface MonthlyCollectionsHeaderProps {
  month: string;
  branchName: string;
}

export default function MonthlyCollectionsHeader({ month, branchName }: MonthlyCollectionsHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xs'),
      paddingBottom: spacing(theme, 'xs'),
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      flex: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    titleSection: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    subtitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
    },
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{month}</Text>
          <Text style={styles.subtitle}>{branchName}</Text>
        </View>
      </View>
    </View>
  );
}


import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/i18n';

interface EditCustomerHeaderProps {
  customerId: string;
}

export default function EditCustomerHeader({ customerId }: EditCustomerHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

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
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    subtitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      marginTop: 2,
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
          <Text style={styles.title}>{t('editCustomer.title')}</Text>
          <Text style={styles.subtitle}>{customerId}</Text>
        </View>
      </View>
    </View>
  );
}


/**
 * Help & Support Screen
 * Shows help documentation and support contact
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';

export default function Help() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // TODO: Implement help and support content
  // Will show FAQ, tutorials, contact support

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.app }]}>
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>
        {t('help.pending')}
      </Text>
      <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
        {t('help.pendingHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});


/**
 * About Screen
 * Shows app information, version, licenses
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { useTranslation } from '@/i18n';

export default function About() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // TODO: Implement app info
  // Will show app version, build number, licenses, terms

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.app }]}>
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>
        {t('about.pending')}
      </Text>
      <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
        {t('about.pendingHint')}
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


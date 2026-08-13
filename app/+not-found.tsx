/**
 * 404 Not Found Screen
 */
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from '@/i18n';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.message')}</Text>
        <Link href="/(app)/(home)" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    textDecorationLine: 'underline',
    color: '#007AFF',
  },
});

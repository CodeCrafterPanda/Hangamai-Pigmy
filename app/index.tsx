import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAppSlice } from '@/slices';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTranslation } from '@/i18n';

export default function Index() {
  const { checked } = useAppSlice();
  const router = useRouter();
  const { t } = useTranslation();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!checked || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;
    // Init already finished in the root layout. A <Redirect> here remounts on every
    // Index re-render and can bounce splash ↔ home forever. Replace once instead.
    const timeoutId = setTimeout(() => {
      router.replace('/(auth)/splash');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [checked, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>{t('common.initializing')}</Text>
    </View>
  );
}

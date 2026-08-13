import { Redirect } from 'expo-router';
import { useAppSlice } from '@/slices';
import { useSelector } from 'react-redux';
import { selectSession } from '@/slices/settings.slice';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTranslation } from '@/i18n';

export default function Index() {
  const { checked, loggedIn } = useAppSlice();
  const session = useSelector(selectSession);
  const { t } = useTranslation();

  // Show loading while initializing
  if (!checked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>{t('common.initializing')}</Text>
      </View>
    );
  }

  // TODO: Auth temporarily disabled - always go through splash to home
  // When re-enabling auth, uncomment the logic below:
  /*
  // If logged in, go to app
  if (loggedIn) {
    return <Redirect href="/(app)/(home)" />;
  }

  // If MPIN is set, go directly to MPIN screen
  if (session?.mpinHash) {
    return <Redirect href="/(auth)/mpin" />;
  }
  */

  // For now: Always show splash which will redirect to home
  return <Redirect href="/(auth)/splash" />;
}

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" options={{ headerShown: true, title: 'Agent Login' }} />
      <Stack.Screen name="mpin" options={{ headerShown: true, title: 'MPIN' }} />
    </Stack>
  );
}


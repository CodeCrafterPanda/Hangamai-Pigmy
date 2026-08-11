import { Stack } from 'expo-router';
import { useTheme } from '@/theme';
import RouteHeader from '@/components/elements/RouteHeader';
import AddCustomerHeader from '@/components/elements/AddCustomerHeader';

export default function RouteStack() {
  const { theme } = useTheme();

  // Mock data - TODO: Replace with actual data from Redux/Context
  const headerData = {
    date: 'Oct 24, 2023',
    isOnline: true,
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background.app,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: () => <RouteHeader date={headerData.date} isOnline={headerData.isOnline} />,
        }}
      />
      <Stack.Screen
        name="route-customers/[routeId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="delegated-customers"
        options={{
          title: 'Delegated Customers',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="customer-detail/[id]"
        options={{
          title: 'Customer Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="collect-deposit/[accountId]"
        options={{
          title: 'Collect Deposit',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add-customer"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-customer/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}


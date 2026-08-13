import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTheme } from '@/theme';
import { useTranslation, formatDate } from '@/i18n';
import RouteHeader from '@/components/elements/RouteHeader';
import AddCustomerHeader from '@/components/elements/AddCustomerHeader';
import { selectBranchTimezone } from '@/slices/settings.slice';
import { getCurrentBusinessDate } from '@/utils/businessLogic';

export default function RouteStack() {
  const { theme } = useTheme();
  const { t, language } = useTranslation();
  const timezone = useSelector(selectBranchTimezone);

  const headerData = {
    // Branch business date, not the device calendar date: the header must agree with the
    // date collections are actually booked against.
    date: formatDate(new Date(`${getCurrentBusinessDate(timezone)}T00:00:00`), language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    // The MVP is offline-first with no backend: there is nothing to be online with.
    isOnline: false,
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
          title: t('delegatedCustomers.title'),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="customer-detail/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="collect-deposit/[accountId]"
        options={{
          title: t('collection.title'),
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
        name="add-route"
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
      <Stack.Screen
        name="passbook/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}


/**
 * Customer Detail Screen (Home)
 * Shows customer info and accounts
 */
import { useLocalSearchParams } from 'expo-router';
import CustomerDetail from '@/scenes/customer-detail';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CustomerDetail customerId={id} />;
}


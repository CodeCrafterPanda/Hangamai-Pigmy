/**
 * Edit Customer Screen
 * Form to edit an existing customer
 */
import { useLocalSearchParams } from 'expo-router';
import EditCustomer from '@/scenes/edit-customer';

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditCustomer customerId={id} />;
}


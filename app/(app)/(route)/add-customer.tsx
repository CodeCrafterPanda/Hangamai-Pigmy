/**
 * Add New Customer Screen
 * Form to add a new customer to the route
 */
import { useLocalSearchParams } from 'expo-router';
import AddNewCustomer from '@/scenes/add-customer';

export default function AddCustomerScreen() {
  // Present only when opened from Route Details, which carries its route context through
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();

  return <AddNewCustomer presetRouteId={routeId} />;
}

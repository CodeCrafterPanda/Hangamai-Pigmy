/**
 * Route Customers Screen
 * Shows customers in a specific route with collection status
 */
import { useLocalSearchParams } from 'expo-router';
import RouteDetails from '@/scenes/route-details';

export default function RouteCustomersScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();

  return <RouteDetails routeId={routeId} />;
}


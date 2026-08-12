/**
 * Passbook Screen
 * Route param is the Account id — the ledger history belongs to an account, not a customer.
 */
import { useLocalSearchParams } from 'expo-router';
import Passbook from '@/scenes/passbook';

export default function PassbookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Passbook accountId={id} />;
}

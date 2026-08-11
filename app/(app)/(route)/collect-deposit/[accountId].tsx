/**
 * Collect Deposit Screen (Route)
 * Collect payment for an account
 */
import { useLocalSearchParams } from 'expo-router';
import CollectDeposit from '@/scenes/collect-deposit';

export default function CollectDepositScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();

  return <CollectDeposit accountId={accountId} />;
}


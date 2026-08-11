/**
 * Receipt Detail Screen
 * Shows detailed receipt information
 */
import { useLocalSearchParams } from 'expo-router';
import Receipt from '@/scenes/receipt';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Receipt receiptId={id} />;
}


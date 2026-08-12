/**
 * Receipt Detail Screen
 * Route param is the Collection id — Receipt projects the receipt from that record.
 */
import { useLocalSearchParams } from 'expo-router';
import Receipt from '@/scenes/receipt';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <Receipt collectionId={id} />;
}

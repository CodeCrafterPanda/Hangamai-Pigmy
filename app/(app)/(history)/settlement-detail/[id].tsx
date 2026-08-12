/**
 * Settlement Detail Screen
 * Route param is the Settlement id. Read-only view of a historical day closure.
 */
import { useLocalSearchParams } from 'expo-router';
import SettlementDetail from '@/scenes/settlement-detail';

export default function SettlementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SettlementDetail settlementId={id} />;
}

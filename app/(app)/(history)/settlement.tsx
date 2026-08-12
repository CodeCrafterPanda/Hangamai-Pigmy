/**
 * Settlement Screen (day closure)
 * Reachable route for scenes/settlement — there is no (modals) route group in this app.
 * The `scope` param decides which book is closed (PRIMARY or DELEGATED).
 */
import { useLocalSearchParams } from 'expo-router';
import Settlement from '@/scenes/settlement';
import { SettlementScope } from '@/types';

export default function SettlementScreen() {
  const { scope } = useLocalSearchParams<{ scope?: string }>();

  const settlementScope =
    scope === SettlementScope.DELEGATED ? SettlementScope.DELEGATED : SettlementScope.PRIMARY;

  return <Settlement scope={settlementScope} />;
}

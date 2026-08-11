## Navigation Usage Examples

### Basic Navigation Calls

#### From Home Dashboard to Customer Detail

```typescript
// In Home.tsx
import { navigateToCustomerDetail } from '@/utils/navigation';

function Home() {
  const handleCustomerPress = (customerId: string) => {
    navigateToCustomerDetail(customerId, 'home');
  };

  return (
    <TouchableOpacity onPress={() => handleCustomerPress('customer-123')}>
      <Text>View Customer</Text>
    </TouchableOpacity>
  );
}
```

#### From Customer Detail to Collect Deposit

```typescript
// In CustomerDetail.tsx
import { navigateToCollectDeposit } from '@/utils/navigation';

function CustomerDetail({ customerId }: { customerId: string }) {
  const handleCollectPress = (accountId: string) => {
    navigateToCollectDeposit(accountId);
  };

  return (
    <Button
      title="Collect Deposit"
      onPress={() => handleCollectPress(account.id)}
    />
  );
}
```

#### From Collect Deposit to Receipt Modal

```typescript
// In CollectDeposit.tsx
import { completeCollectionFlow } from '@/utils/navigation';
import { useCollectionsSlice, useLedgerSlice } from '@/slices';

function CollectDeposit({ accountId }: { accountId: string }) {
  const { createCollection, persistCollections } = useCollectionsSlice();
  const { addLedgerEntries, persistLedger } = useLedgerSlice();

  const handleGenerateReceipt = async (amount: number, penalty: number, mode: 'CASH' | 'UPI') => {
    // Create collection
    createCollection({
      branchId: session.branchId,
      customerId: customer.id,
      accountId,
      primaryAgentId: account.primaryAgentId,
      collectedByAgentId: session.agentId,
      amount,
      penaltyAmount: penalty,
      mode,
      collectedAt: new Date().toISOString(),
      timezone: branchSettings.timezone,
      deviceFingerprint: session.deviceFingerprint,
    });

    // Get collection ID (last created)
    const collectionId = 'newly-created-collection-id';

    // Create ledger entries
    const ledgerEntries = createLedgerEntriesForCollection(
      accountId,
      collectionId,
      amount,
      penalty,
      new Date().toISOString()
    );
    addLedgerEntries(ledgerEntries);

    // Persist
    await Promise.all([persistCollections(), persistLedger()]);

    // Open receipt modal
    completeCollectionFlow(collectionId);
  };

  return (
    <Button
      title="Generate Receipt"
      onPress={() => handleGenerateReceipt(100, 10, 'CASH')}
    />
  );
}
```

### Modal Navigation

#### Open Search Customer Modal

```typescript
// From any screen with a search button
import { openSearchCustomer } from '@/utils/navigation';

function Header() {
  return (
    <TouchableOpacity onPress={openSearchCustomer}>
      <Icon name="search" />
    </TouchableOpacity>
  );
}
```

#### Open Settlement Modal

```typescript
// From Home dashboard
import { openSettlementModal } from '@/utils/navigation';
import { getCurrentBusinessDate } from '@/utils/businessLogic';

function Home() {
  const handleDayClose = () => {
    const businessDate = getCurrentBusinessDate(branchSettings.timezone);
    openSettlementModal(businessDate);
  };

  return (
    <Button title="Day Closure" onPress={handleDayClose} />
  );
}
```

#### Open Offline Queue Modal

```typescript
// From sync status card
import { openOfflineQueueModal } from '@/utils/navigation';

function SyncStatusCard() {
  const { pendingCount } = useSelector(selectSyncStatusSummary);

  if (pendingCount === 0) return null;

  return (
    <TouchableOpacity onPress={openOfflineQueueModal}>
      <Text>{pendingCount} items pending sync</Text>
    </TouchableOpacity>
  );
}
```

### Tab Navigation

#### Switch Between Tabs

```typescript
// Switch to History tab to view monthly report
import { switchToTab, navigateToMonthlyCollections } from '@/utils/navigation';

function Home() {
  const handleViewReport = () => {
    navigateToMonthlyCollections();
  };

  return (
    <Button title="View Monthly Report" onPress={handleViewReport} />
  );
}
```

### Route Stack Navigation

#### Navigate to Route Customers

```typescript
// From Routes list
import { navigateToRouteCustomers } from '@/utils/navigation';

function Routes() {
  const routes = useSelector(selectAllRoutes);

  return (
    <FlatList
      data={routes}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigateToRouteCustomers(item.id)}>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

#### Navigate to Delegated Customers

```typescript
// From Profile or Home
import { navigateToDelegatedCustomers } from '@/utils/navigation';

function Header() {
  return (
    <Button title="Delegated" onPress={navigateToDelegatedCustomers} />
  );
}
```

### Confirmation Dialogs

#### Confirm Logout

```typescript
// From Profile screen
import { openConfirmDialog, logout } from '@/utils/navigation';
import { clearSession, persistSettings } from '@/slices/settings.slice';

function Profile() {
  const handleLogout = () => {
    openConfirmDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
    });

    // In a real implementation, you'd handle the callback differently
    // For now, this shows the pattern
  };

  const executeLogout = async () => {
    // Clear session
    clearSession();
    await persistSettings();

    // Navigate to auth
    logout();
  };

  return (
    <Button title="Logout" onPress={handleLogout} />
  );
}
```

#### Confirm Collection Cancellation

```typescript
// From Collect Deposit screen
import { cancelCollectionFlow, goBack } from '@/utils/navigation';

function CollectDeposit() {
  const [hasUnsavedData, setHasUnsavedData] = useState(false);

  const handleBackPress = () => {
    if (hasUnsavedData) {
      openConfirmDialog({
        title: 'Discard Changes',
        message: 'You have unsaved data. Are you sure you want to go back?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
      });
      // On confirm, call goBack()
    } else {
      goBack();
    }
  };

  return (
    <View>
      {/* Your form */}
      <Button title="Back" onPress={handleBackPress} />
    </View>
  );
}
```

### Complete Flow Example

#### Collection Flow (Home → Customer → Collect → Receipt)

```typescript
// 1. From Home "Up Next" card
function Home() {
  const upNextCustomers = useSelector(selectUpNextCustomers);

  return (
    <FlatList
      data={upNextCustomers}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigateToCustomerDetail(item.customerId, 'home')}
        >
          <CustomerCard customer={item} />
        </TouchableOpacity>
      )}
    />
  );
}

// 2. From Customer Detail
function CustomerDetail({ customerId }) {
  const accounts = useSelector(state =>
    selectActiveAccountsByCustomer(state, customerId)
  );

  return (
    <FlatList
      data={accounts}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigateToCollectDeposit(item.id, 'home')}
        >
          <AccountCard account={item} />
        </TouchableOpacity>
      )}
    />
  );
}

// 3. From Collect Deposit
function CollectDeposit({ accountId }) {
  const handleSubmit = async (data) => {
    // Create collection and ledger entries
    const collectionId = await createCollectionWithLedger(data);

    // Open receipt modal
    completeCollectionFlow(collectionId);
  };

  return (
    <Form onSubmit={handleSubmit} />
  );
}

// 4. Receipt Modal
// Automatically opens as modal
// User can dismiss to return to Customer Detail
```

### Direct Router Usage (Alternative)

If you prefer using the router directly:

```typescript
import { router } from 'expo-router';

// Navigate with params
router.push({
  pathname: '/(app)/(home)/customer-detail/[id]',
  params: { id: 'customer-123' },
});

// Navigate with string
router.push('/(app)/(home)/customer-detail/customer-123');

// Open modal
router.push({
  pathname: '/(modals)/receipt',
  params: { collectionId: 'collection-456' },
});

// Go back
router.back();

// Replace (no back)
router.replace('/(app)/(home)');

// Check if can go back
if (router.canGoBack()) {
  router.back();
}
```

### Using with useLocalSearchParams

```typescript
import { useLocalSearchParams } from 'expo-router';

function CustomerDetail() {
  // Type-safe params
  const { id } = useLocalSearchParams<{ id: string }>();

  // Use id to fetch customer
  const customer = useSelector(state => selectCustomerById(state, id));

  return <View>{/* ... */}</View>;
}
```

### Navigation State Management

#### Check Current Route

```typescript
import { usePathname, useSegments } from 'expo-router';

function Component() {
  const pathname = usePathname(); // e.g., "/(app)/(home)/customer-detail/123"
  const segments = useSegments(); // e.g., ["app", "(home)", "customer-detail", "123"]

  const isOnHomeTab = segments[1] === '(home)';

  return <View>{/* ... */}</View>;
}
```

#### Navigation Guards

```typescript
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { loggedIn } = useAppSlice();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!loggedIn && !inAuthGroup) {
      // Redirect to auth if not logged in and not in auth group
      router.replace('/(auth)/login');
    } else if (loggedIn && inAuthGroup) {
      // Redirect to app if logged in and in auth group
      router.replace('/(app)/(home)');
    }
  }, [loggedIn, segments]);
}
```

### Best Practices

1. **Use navigation helpers** for common flows (better maintainability)
2. **Type your params** using TypeScript interfaces
3. **Handle back navigation** carefully (especially with unsaved data)
4. **Use modals** for temporary overlays (receipts, confirmations)
5. **Keep tab stacks independent** (don't mix navigation between tabs unnecessarily)
6. **Test deep linking** (if you implement it later)
7. **Handle loading states** during navigation
8. **Provide loading indicators** for async navigation (e.g., after collection submit)

### Performance Tips

1. **Lazy load screens** (Expo Router does this by default)
2. **Avoid unnecessary re-renders** during navigation
3. **Use React.memo** for list items that navigate
4. **Optimize large lists** with FlatList's optimization props
5. **Keep modal content lightweight** for smooth presentation

### Debugging Navigation

```typescript
// Log navigation events
import { useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';

function NavigationLogger() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[Navigation]', pathname);
  }, [pathname]);

  return null;
}

// Add to root layout
<Provider>
  <NavigationLogger />
  <Router />
</Provider>
```


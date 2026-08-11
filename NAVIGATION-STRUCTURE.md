# Navigation Structure

## Folder Structure

```
app/
├── _layout.tsx                           # Root guard (checks auth state)
├── index.tsx                             # Entry point (redirects based on auth)
│
├── (auth)/                               # Auth flow group
│   ├── _layout.tsx                       # Auth stack layout
│   ├── splash.tsx                        # Splash screen
│   ├── login.tsx                         # Agent login/OTP
│   └── mpin.tsx                          # MPIN setup/unlock
│
├── (app)/                                # Authenticated app group
│   ├── _layout.tsx                       # Bottom tabs layout (4 tabs)
│   │
│   ├── (home)/                           # Home tab stack
│   │   ├── _layout.tsx                   # Stack navigator
│   │   ├── index.tsx                     # Home dashboard
│   │   ├── customer-detail/[id].tsx      # Customer detail
│   │   └── collect-deposit/[accountId].tsx # Collect deposit
│   │
│   ├── (route)/                          # Route tab stack
│   │   ├── _layout.tsx                   # Stack navigator
│   │   ├── index.tsx                     # Route list/current route
│   │   ├── route-customers/[routeId].tsx # Customers in route
│   │   ├── delegated-customers.tsx       # Delegated customers
│   │   ├── customer-detail/[id].tsx      # Customer detail
│   │   └── collect-deposit/[accountId].tsx # Collect deposit
│   │
│   ├── (history)/                        # History tab stack
│   │   ├── _layout.tsx                   # Stack navigator
│   │   ├── index.tsx                     # Collections history
│   │   ├── monthly-collections.tsx       # Monthly matrix
│   │   ├── receipt-detail/[id].tsx       # Receipt detail
│   │   ├── offline-queue.tsx             # Offline queue
│   │   └── settlement-history.tsx        # Day closures
│   │
│   └── (profile)/                        # Profile tab stack
│       ├── _layout.tsx                   # Stack navigator
│       ├── index.tsx                     # Profile
│       ├── help.tsx                      # Help & support
│       └── about.tsx                     # App info
│
├── (modals)/                             # BottomSheet modals
│   ├── receipt.tsx                       # Receipt modal (collectionId param)
│   ├── settlement.tsx                    # Settlement/day close modal
│   ├── search-customer.tsx               # Search customer modal
│   ├── offline-queue-modal.tsx           # Offline queue as modal
│   └── confirm.tsx                       # Confirmation dialog
│
└── +not-found.tsx                        # 404 screen
```

## Navigation Flow

### Auth Flow

```
Splash (if !app.checked)
  ↓
Login (if !app.loggedIn)
  ↓
MPIN Setup/Unlock
  ↓
App (Bottom Tabs)
```

### App Flow (Bottom Tabs)

```
┌─────────────────────────────────────────────┐
│  Home  │  Route  │  History  │  Profile     │
└─────────────────────────────────────────────┘
     ↓         ↓          ↓           ↓
  [Stack]   [Stack]   [Stack]     [Stack]
```

### Common Flows

**Collection Flow:**

```
Home/Route → Customer Detail → Collect Deposit → Receipt Modal
                                                      ↓
                                                   (dismiss)
                                                      ↓
                                              Customer Detail
```

**Monthly Report:**

```
History → Monthly Collections (matrix)
```

**Settlement:**

```
Home → Settlement Modal (global)
```

## Route Parameters

### Typed Parameters

- `customer-detail/[id]` → `{ id: string }`
- `collect-deposit/[accountId]` → `{ accountId: string }`
- `route-customers/[routeId]` → `{ routeId: string }`
- `receipt-detail/[id]` → `{ id: string }`
- `(modals)/receipt` → `{ collectionId: string }`
- `(modals)/settlement` → `{ businessDate?: string }`
- `(modals)/confirm` → `{ title: string, message: string, onConfirm: () => void }`

## Navigation Helpers

### Navigation Calls

```typescript
// Navigate to customer detail
router.push(`/(app)/(home)/customer-detail/${customerId}`);

// Navigate to collect deposit
router.push(`/(app)/(home)/collect-deposit/${accountId}`);

// Open receipt modal
router.push({
  pathname: '/(modals)/receipt',
  params: { collectionId },
});

// Open settlement modal
router.push('/(modals)/settlement');

// Open search modal
router.push('/(modals)/search-customer');

// Go back
router.back();

// Replace (no back)
router.replace('/(app)/(home)');
```

### Tab Navigation

```typescript
// Switch to History tab
router.push('/(app)/(history)');

// Switch to Route tab and navigate within it
router.push('/(app)/(route)/delegated-customers');
```

## Header Configuration

All stacks use consistent fintech-style headers:

- Simple white/dark background
- Clean title
- Appropriate back buttons
- Minimal styling for performance

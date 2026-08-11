# Navigation Quick Start Guide

## 🚀 Getting Started

### 1. Clear Cache and Restart

```bash
# Clear Metro cache
npx expo start -c
```

### 2. Check Console Logs

When the app starts, you should see these logs in order:

```
[App] Starting initialization...
[App] Loading assets...
[App] Assets loaded
[App] Initializing storage...
[App] Storage initialized
[App] Hydrating slices...
[App] Slices hydrated
[App] Checking session: {}
[App] User is not logged in
[App] Hiding splash screen
[App] Initialization complete
```

### 3. Expected Flow

**First Time (No Session):**
```
Loading... → Auth Flow → Splash Screen
```

**With Session:**
```
Loading... → App Flow → Home Tab
```

### 4. If App Gets Stuck Loading

The app has a **10-second timeout**. If initialization takes longer:
- You'll see: `[App] Initialization timeout - forcing to auth screen`
- App will redirect to auth flow automatically

### 5. Testing Auth Flow

Since you don't have API yet, you can test by manually setting session:

**Option A: Test with Mock Session (Add to a test button)**

```typescript
import { useSettingsSlice } from '@/slices';

function TestButton() {
  const { updateSession, persistSettings } = useSettingsSlice();
  const { setLoggedIn } = useAppSlice();

  const handleMockLogin = async () => {
    // Set mock session
    updateSession({
      agentId: 'agent-123',
      branchId: 'branch-456',
      deviceFingerprint: 'device-xyz',
      loggedInAt: new Date().toISOString(),
    });
    
    await persistSettings();
    setLoggedIn(true);
  };

  return <Button title="Mock Login" onPress={handleMockLogin} />;
}
```

**Option B: Use AsyncStorage Directly**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set session
await AsyncStorage.setItem('@pigmy/session', JSON.stringify({
  agentId: 'agent-123',
  branchId: 'branch-456',
  deviceFingerprint: 'device-xyz',
  loggedInAt: new Date().toISOString(),
}));

// Restart app to see logged-in state
```

**Option C: Clear Session (Test Logout)**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear session
await AsyncStorage.removeItem('@pigmy/session');

// Restart app to see logged-out state
```

## 🐛 Troubleshooting

### Stuck on Loading Screen

**Check Console for:**

1. **Timeout message:**
```
[App] Initialization timeout - forcing to auth screen
```
**Solution:** App will auto-redirect. Check what's taking so long.

2. **Hydration errors:**
```
[App] Slice X hydration failed: Error...
```
**Solution:** Check AsyncStorage permissions or clear app data.

3. **No logs at all:**
**Solution:** Metro bundler might be stuck. Restart with:
```bash
npx expo start -c
```

### Not Redirecting After Login

**Check:**
1. Session is saved to AsyncStorage:
```typescript
const session = await AsyncStorage.getItem('@pigmy/session');
console.log('Session:', session);
```

2. `app.checked` is `true`:
```typescript
const { checked, loggedIn } = useAppSlice();
console.log('Auth State:', { checked, loggedIn });
```

3. Restart app after setting session (hot reload might not trigger auth check)

### App Crashes on Startup

**Common causes:**

1. **Import errors** - Check all scene imports exist:
```typescript
// This will crash if file doesn't exist
import Home from '@/scenes/home'; // ❌ If home folder doesn't have index.ts
```

2. **Redux store not configured** - Verify `utils/store.ts` has all slices

3. **Missing Provider** - Check `app/_layout.tsx` wraps with `<Provider>`

## 🧪 Testing Navigation

### Test Tab Navigation

1. App loads → Should show Home tab
2. Tap Route tab → Should switch to Route
3. Tap back button → Should stay in Route (not go to Home)
4. Tap Home tab → Should go to Home
5. Press device back button on Home → Should exit app (expected)

### Test Stack Navigation

**Home Stack:**
```
Home → Customer Detail → Collect Deposit → Receipt Modal
```

**Route Stack:**
```
Routes → Route Customers → Customer Detail → Collect
```

### Test Modal Navigation

1. From Home, call `openReceiptModal('receipt-123')`
2. Modal should slide up from bottom
3. Tap outside or close button → Should dismiss
4. Should return to previous screen

### Test Auth Guard

**Scenario 1: Not Logged In**
```
1. Clear session (or fresh install)
2. Open app
3. Should show: Splash → Login screen
```

**Scenario 2: Logged In**
```
1. Set session in AsyncStorage
2. Open app
3. Should show: Loading → Home tab
```

**Scenario 3: Logout**
```
1. From Profile, call logout()
2. Should clear session
3. Should redirect to Login
```

## 📝 Development Workflow

### Adding a New Screen

1. **Create scene component** (if not exists):
```typescript
// scenes/my-screen/MyScreen.tsx
export default function MyScreen() {
  return <View>...</View>;
}

// scenes/my-screen/index.ts
export { default } from './MyScreen';
```

2. **Add route file**:
```typescript
// app/(app)/(home)/my-screen.tsx
import MyScreen from '@/scenes/my-screen';
export default MyScreen;
```

3. **Add to stack layout** (if new screen type):
```typescript
// app/(app)/(home)/_layout.tsx
<Stack.Screen
  name="my-screen"
  options={{ title: 'My Screen' }}
/>
```

4. **Navigate to it**:
```typescript
import { router } from 'expo-router';
router.push('/(app)/(home)/my-screen');
```

### Adding a New Modal

1. **Create modal file**:
```typescript
// app/(modals)/my-modal.tsx
import MyModalScene from '@/scenes/my-modal';
export default MyModalScene;
```

2. **Register in root layout**:
```typescript
// app/_layout.tsx
<Stack.Screen
  name="(modals)/my-modal"
  options={{
    presentation: 'modal',
    headerShown: true,
    title: 'My Modal',
  }}
/>
```

3. **Open modal**:
```typescript
router.push('/(modals)/my-modal');
```

## 🔍 Debugging Tips

### Enable Verbose Logging

Already enabled in `app/_layout.tsx`. Check console for:
- `[App]` - App lifecycle
- `[Navigation]` - Route changes
- `[Redux]` - State changes (if redux-logger enabled)

### Check Navigation State

```typescript
import { usePathname, useSegments } from 'expo-router';

function Debug() {
  const pathname = usePathname();
  const segments = useSegments();
  
  console.log('Current path:', pathname);
  console.log('Segments:', segments);
  
  return null;
}
```

### Check Redux State

```typescript
import { useSelector } from 'react-redux';

function Debug() {
  const state = useSelector((state: State) => state);
  console.log('Redux State:', {
    app: state.app,
    settings: state.settings.session,
  });
  
  return null;
}
```

### Clear All Data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nuclear option - clear everything
await AsyncStorage.clear();
// Then restart app
```

## ✅ Checklist

Before reporting issues:

- [ ] Cleared Metro cache (`npx expo start -c`)
- [ ] Checked console logs (no errors?)
- [ ] Verified all scene imports exist
- [ ] Session is properly saved (check AsyncStorage)
- [ ] `app.checked` becomes `true` after init
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Navigation paths match file structure exactly

## 🎯 Next Steps

Once navigation is working:

1. **Connect real auth** - Replace mock session with API login
2. **Add data** - Use business logic slices to populate screens
3. **Test offline** - Verify sync queue works
4. **Add loading states** - Show spinners during navigation
5. **Polish UX** - Add animations, transitions, haptics

---

Need help? Check:
- `NAVIGATION-TROUBLESHOOTING.md` - Detailed error solutions
- `NAVIGATION-EXAMPLES.md` - Code examples
- `NAVIGATION-IMPLEMENTATION.md` - Full implementation details


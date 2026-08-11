# Navigation Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Invalid hook call" Error

**Error Message:**
```
ERROR  [App] Initialization error: [Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Cause:**
Calling React hooks inside async functions, callbacks, or loops violates the Rules of Hooks.

**Solution:**
Always call hooks at the top level of your component, not inside async functions.

**❌ Wrong:**
```typescript
function App() {
  useEffect(() => {
    async function init() {
      // ❌ Don't call hooks inside async functions
      await useSettingsSlice().hydrateSettings();
    }
    init();
  }, []);
}
```

**✅ Correct:**
```typescript
function App() {
  // ✅ Call hooks at component level
  const settingsSlice = useSettingsSlice();
  const customersSlice = useCustomersSlice();
  
  useEffect(() => {
    async function init() {
      // ✅ Use the returned methods
      await settingsSlice.hydrateSettings();
      await customersSlice.hydrateCustomers();
    }
    init();
  }, []);
}
```

### Issue: "ENOENT: no such file or directory, open '...InternalBytecode.js'"

**Error Message:**
```
Error: ENOENT: no such file or directory, open 'D:\...\InternalBytecode.js'
```

**Cause:**
Metro bundler cache issue or missing file reference.

**Solution:**
1. Clear Metro cache and restart:
```bash
npx expo start -c
```

2. If that doesn't work, clear all caches:
```bash
npm cache clean --force
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: Navigation not working after app start

**Symptoms:**
- App loads but stays on splash screen
- Navigation doesn't redirect to correct screen

**Solution:**
1. Check that `app.checked` is set to `true` after initialization
2. Verify AsyncStorage is hydrating correctly
3. Add console logs to debug:

```typescript
useEffect(() => {
  async function init() {
    console.log('[App] Starting initialization...');
    await initializeStorage();
    console.log('[App] Storage initialized');
    
    await settingsSlice.hydrateSettings();
    console.log('[App] Settings hydrated:', settingsSlice.session);
    
    // Check session
    if (settingsSlice.session.agentId) {
      console.log('[App] User logged in');
      setLoggedIn(true);
    } else {
      console.log('[App] User not logged in');
      setLoggedIn(false);
    }
  }
  init();
}, []);
```

### Issue: Modal not appearing

**Symptoms:**
- Calling `router.push('/(modals)/receipt')` but modal doesn't show

**Solution:**
1. Verify modal is registered in root `_layout.tsx`:
```typescript
<Stack.Screen
  name="(modals)/receipt"
  options={{
    presentation: 'modal',
    headerShown: true,
    title: 'Receipt',
  }}
/>
```

2. Check you're using correct path:
```typescript
// ✅ Correct
router.push({
  pathname: '/(modals)/receipt',
  params: { collectionId: '123' }
});

// ❌ Wrong
router.push('/modals/receipt'); // Missing parentheses
```

### Issue: Tab navigation not working

**Symptoms:**
- Tapping tab icons doesn't switch tabs
- App crashes when switching tabs

**Solution:**
1. Verify all tab screens exist and export properly:
```typescript
// app/(app)/(home)/index.tsx
import Home from '@/scenes/home';
export default Home;
```

2. Check tab layout configuration in `app/(app)/_layout.tsx`

3. Ensure each tab has a `_layout.tsx` with Stack navigator

### Issue: Back navigation exits app on Home screen

**Cause:**
This is expected behavior on Android - pressing back on the root screen exits the app.

**Solution (Optional):**
If you want to show a confirmation before exiting:

```typescript
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

function Home() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Prevent default behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
}
```

### Issue: Navigation params not working

**Symptoms:**
- `useLocalSearchParams()` returns undefined
- Params not passed to screen

**Solution:**
1. Verify param names match route definition:
```typescript
// Route: app/(app)/(home)/customer-detail/[id].tsx
// ✅ Correct
const { id } = useLocalSearchParams<{ id: string }>();

// ❌ Wrong
const { customerId } = useLocalSearchParams<{ customerId: string }>();
```

2. Check you're passing params correctly:
```typescript
// ✅ Correct
router.push(`/(app)/(home)/customer-detail/${customerId}`);

// ✅ Also correct
router.push({
  pathname: '/(app)/(home)/customer-detail/[id]',
  params: { id: customerId }
});

// ❌ Wrong
router.push('/(app)/(home)/customer-detail'); // Missing param
```

### Issue: Redux state not persisting

**Symptoms:**
- Data is lost when app restarts
- Hydration doesn't restore data

**Solution:**
1. Ensure you're calling `persist` functions after state changes:
```typescript
// After adding customer
addCustomer(data);
await persistCustomers(); // Don't forget this!
```

2. Check AsyncStorage permissions (especially on Android)

3. Verify storage keys are correct:
```typescript
import { STORAGE_KEYS } from '@/utils/storage';
console.log('Storage keys:', STORAGE_KEYS);
```

### Issue: TypeScript errors with navigation

**Error:**
```
Type 'string' is not assignable to type 'never'
```

**Solution:**
Define proper types for your routes:

```typescript
// utils/navigation.ts
export type RootStackParamList = {
  '(app)/(home)/customer-detail/[id]': { id: string };
  '(app)/(home)/collect-deposit/[accountId]': { accountId: string };
  '(modals)/receipt': { collectionId: string };
  // ... other routes
};

// Use in component
import { useLocalSearchParams } from 'expo-router';

const params = useLocalSearchParams<{ id: string }>();
```

### Issue: Slow navigation or lag

**Causes:**
- Large data sets rendering
- Heavy computations in render
- Not using proper list optimization

**Solutions:**
1. Use `React.memo` for list items:
```typescript
const CustomerCard = React.memo(({ customer }: { customer: Customer }) => {
  return <View>...</View>;
});
```

2. Optimize FlatList:
```typescript
<FlatList
  data={customers}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

3. Use memoized selectors:
```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectFilteredCustomers = createSelector(
  [selectAllCustomers, (state, filter) => filter],
  (customers, filter) => customers.filter(c => c.name.includes(filter))
);
```

### Issue: Deep linking not working

**Solution:**
1. Configure scheme in `app.json`:
```json
{
  "expo": {
    "scheme": "pigmy"
  }
}
```

2. Test with:
```bash
npx uri-scheme open pigmy://customer/123 --android
npx uri-scheme open pigmy://customer/123 --ios
```

3. Add linking configuration if needed (advanced)

### General Debugging Tips

1. **Enable verbose logging:**
```typescript
// In app/_layout.tsx
useEffect(() => {
  const pathname = usePathname();
  console.log('[Navigation]', pathname);
}, [usePathname()]);
```

2. **Check Redux state:**
```typescript
import { useSelector } from 'react-redux';

function Debug() {
  const state = useSelector((state: State) => state);
  console.log('[Redux State]', state);
  return null;
}
```

3. **Monitor AsyncStorage:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

async function debugStorage() {
  const keys = await AsyncStorage.getAllKeys();
  const items = await AsyncStorage.multiGet(keys);
  console.log('[AsyncStorage]', items);
}
```

4. **Use React DevTools:**
```bash
npx react-devtools
```

5. **Check Metro bundler logs:**
Look at the terminal where you ran `npm run dev` for errors

### Still having issues?

1. **Check versions:**
```bash
npx expo-doctor
```

2. **Clean install:**
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

3. **Check Expo Router docs:**
https://docs.expo.dev/router/introduction/

4. **Verify file structure matches exactly:**
- Check folder names use correct parentheses: `(auth)`, `(app)`, `(modals)`
- Check file names match route patterns: `[id].tsx`, `index.tsx`
- Check all `_layout.tsx` files are present

### Quick Checklist

Before asking for help, verify:

- [ ] Hooks are called at component level (not in async functions)
- [ ] All required files exist and are named correctly
- [ ] Metro cache has been cleared (`npx expo start -c`)
- [ ] No TypeScript errors (`npm run lint`)
- [ ] AsyncStorage is working (test with simple data)
- [ ] Navigation paths match folder structure exactly
- [ ] All slices are properly hydrated on app start
- [ ] Redux store is configured with all reducers

### Getting Help

When reporting issues, provide:
1. Full error message with stack trace
2. Code snippet where error occurs
3. What you've already tried
4. Expo and React Native versions (`npx expo-doctor`)
5. Platform (iOS/Android/Web)

---

Most navigation issues are caused by:
1. ❌ Calling hooks incorrectly (inside async functions)
2. ❌ Incorrect route paths (typos, missing parentheses)
3. ❌ Missing file exports (`export default`)
4. ❌ Metro cache not cleared after file structure changes

Always try **clearing Metro cache first**: `npx expo start -c`


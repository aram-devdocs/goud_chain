# Auth Flow Debug Guide

## Problem

API key generation works, login returns 200, but dashboard doesn't render.

## Expected Flow

1. **User clicks "Generate API Key"**
   - `createAccountMutation.mutateAsync()` → `POST /account/create`
   - Response: `{ api_key, user_id, account_id }`
   - Sets `newAccount` state
   - Shows confirmation checkbox

2. **User checks "I have saved my API key"**
   - Enables "Continue to Dashboard" button

3. **User clicks "Continue to Dashboard"**
   - Calls `loginWithNewKey()`
   - `loginMutation.mutateAsync({ api_key })` → `POST /account/login`
   - Response: `{ session_token, user_id, expires_at }`
   - Calls `login(result)` from useAuth hook
   - Should update auth state and navigate to dashboard

4. **Dashboard should render**
   - `AppContent` checks `isAuthenticated`
   - If true, renders dashboard
   - If false, renders AuthPage

## Debug Checklist

### Step 1: Open Browser DevTools Console

Before testing, open DevTools (F12) → Console tab.

### Step 2: Create Account

Click "Generate API Key" and watch for:

```
[useAuth] initializing with: { token: null, userId: null, isAuthenticated: false }
[AppContent] render, isAuthenticated: false
[AppContent] not authenticated, showing AuthPage
```

### Step 3: Login

Check checkbox and click "Continue to Dashboard". Watch for:

```
[AuthPage] loginWithNewKey called
[AuthPage] login mutation result: { session_token: "...", user_id: "...", expires_at: ... }
[useAuth] login called with: { session_token: "...", user_id: "...", expires_at: ... }
[useAuth] stored in localStorage: { session_token: "...", user_id: "..." }
[useAuth] auth state updated to authenticated
[AuthPage] login function called, should navigate to dashboard
[AppContent] render, isAuthenticated: true
[AppContent] authenticated, showing dashboard
```

## Common Issues

### Issue 1: No re-render after login

**Symptom:** See login logs but no `[AppContent] render` after login.

**Cause:** React state not updating properly.

**Fix:** Check if `setAuth` is actually updating the state.

### Issue 2: localStorage not persisting

**Symptom:** Token stored but `isAuthenticated` still false.

**Cause:** State initialization using stale localStorage.

**Fix:** Ensure `useState` initializer runs after login updates.

### Issue 3: Wrong response structure

**Symptom:** Login succeeds but auth state is incorrect.

**Cause:** Backend returns different field names than expected.

**Check:** Response should have `session_token`, `user_id`, `expires_at`.

### Issue 4: Auth state not propagating

**Symptom:** `useAuth` updates but `AppContent` doesn't see it.

**Cause:** Multiple instances of `useAuth` or state not shared.

**Fix:** Ensure `useAuth` returns same state reference.

## Testing Steps

1. **Clear all localStorage:**

   ```javascript
   localStorage.clear()
   ```

2. **Reload page:**
   - Should see: `isAuthenticated: false`
   - Should see: AuthPage

3. **Generate API key:**
   - Should succeed
   - Should show confirmation checkbox

4. **Login:**
   - Check checkbox
   - Click "Continue to Dashboard"
   - Watch console logs
   - Should see auth state update
   - Should see AppContent re-render with `isAuthenticated: true`
   - Should see dashboard

## Manual localStorage Check

After login succeeds, check localStorage manually:

```javascript
// Should all be present:
localStorage.getItem('session_token') // Should be a long string
localStorage.getItem('user_id') // Should be a UUID-like string
```

If these are set but `isAuthenticated` is still false, there's a state management issue.

## React DevTools Check

1. Open React DevTools
2. Find `AppContent` component
3. Check hooks:
   - `useAuth` should show `isAuthenticated: true` after login
4. If hook shows false but localStorage has token, state is stale

## Network Tab Check

1. Open DevTools → Network tab
2. Login request should show:
   - Status: 200 OK
   - Response body: `{ "session_token": "...", "user_id": "...", "expires_at": ... }`

## Next Steps if Still Broken

If logs show everything working but dashboard doesn't render:

1. Check if `AuthPage` is unmounting
2. Check if `AppContent` is re-rendering
3. Check if there are multiple `QueryClientProvider` or context providers
4. Check if `useAuth` hook is creating new state each call

## Remove Debug Logging

Once fixed, remove console.log statements from:

- `web/packages/hooks/src/useAuth.ts`
- `web/apps/dashboard/src/App.tsx`
- `web/apps/dashboard/src/pages/auth.tsx`

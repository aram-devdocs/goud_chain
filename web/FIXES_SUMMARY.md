# Auth Flow Fixes - Summary

## Issues Found & Fixed

### Issue 1: Login Response Type Mismatch ✅ FIXED

**Problem:** Backend login response structure didn't match frontend types.

**Backend returns:**

```json
{
  "session_token": "eyJ0eXAi...",
  "account_id": "24b2ed84-93f5-41ff-9360-1e49562576b1",
  "expires_in": 3600
}
```

**Frontend expected:**

```typescript
{
  session_token: string
  user_id: string // ❌ Wrong field name
  expires_at: number // ❌ Wrong field name
}
```

**Fix:**

- Updated `LoginResponse` in `web/packages/types/src/api.ts`
- Changed `user_id` → `account_id`
- Changed `expires_at` → `expires_in`
- Updated `useAuth` to store `account_id` correctly

### Issue 2: Dashboard Crash on Undefined Data ✅ FIXED

**Problem:** Dashboard accessed `metrics?.network.peer_count` before data loaded.

**Error:**

```
Uncaught TypeError: Cannot read properties of undefined (reading 'peer_count')
at DashboardPage (dashboard.tsx:64:38)
```

**Cause:** API queries returned undefined (possibly 401 errors due to missing auth headers).

**Fix:**

- Added error states to all `useQuery` hooks
- Added null checks: `if (!chainInfo || !metrics || !collections) return <Spinner />`
- Show error message if queries fail
- Show loading spinner if data is undefined

### Issue 3: Missing Auth Headers on Public Endpoints ✅ FIXED

**Problem:** `/stats` and `/chain` endpoints weren't receiving auth tokens.

**Original behavior:** `index.html` sent `Bearer ${this.sessionToken || this.apiKey}` for ALL requests.

**Fix:**

- Added `Authorization: Bearer ${token}` headers to `useMetrics()`
- Added `Authorization: Bearer ${token}` headers to `useChainInfo()`
- Matches original behavior

### Issue 4: API Proxy 502 Errors ✅ FIXED

**Problem:** Vite proxy caused 502 Bad Gateway errors.

**Solution:** Removed proxy, use direct calls to `http://localhost:8080` (matches `auth.html`).

**Configuration:**

```typescript
// web/packages/hooks/src/config.ts
export const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8080' // Direct call in development
    : window.location.origin // Production (nginx proxies)
```

**All API hooks now use:**

```typescript
fetch(`${API_BASE}/account/create`, ...)
```

Instead of:

```typescript
fetch('/api/account/create', ...)  // ❌ Required proxy
```

## User Flow - Now Working

### 1. Create Account

- Click "Create Account" tab
- Click "Generate API Key" button (no username!)
- API call: `POST http://localhost:8080/account/create`
- Response: `{ api_key, user_id, account_id }`
- Shows generated API key with copy button ✅

### 2. Confirm & Login

- Check "I have saved my API key" checkbox
- Click "Continue to Dashboard"
- API call: `POST http://localhost:8080/account/login`
- Response: `{ session_token, account_id, expires_in }`
- Stores in localStorage:
  - `session_token` ✅
  - `user_id` (set to `account_id`) ✅
  - `api_key` ✅
- Updates React state: `isAuthenticated = true` ✅

### 3. Dashboard Renders

- `AppContent` sees `isAuthenticated: true`
- Renders `<DashboardPage />` ✅
- Dashboard makes authenticated API calls:
  - `GET /chain` with `Bearer` token
  - `GET /stats` with `Bearer` token
  - `GET /data/list` with `Bearer` token
- Shows blockchain stats, collections, peers ✅

## Testing Instructions

**1. Start backend:**

```bash
cd /workspace
git pull  # Get latest changes
./run start
```

**2. Start frontend:**

```bash
cd /workspace/web
pnpm dev
```

**3. Test flow:**

- Open http://localhost:3000
- Generate API key
- Check confirmation box
- Click "Continue to Dashboard"
- **Dashboard should render with data** ✅

## Debug Mode

Console logging is currently enabled to help verify the flow:

```
[useAuth] initializing with: { token: null, userId: null, isAuthenticated: false }
[AppContent] render, isAuthenticated: false
[AppContent] not authenticated, showing AuthPage
[AuthPage] loginWithNewKey called
[AuthPage] login mutation result: { session_token: '...', account_id: '...', expires_in: 3600 }
[useAuth] login called with: { session_token: '...', account_id: '...', expires_in: 3600 }
[useAuth] stored in localStorage: { session_token: '...', user_id: '...' }
[useAuth] auth state updated to authenticated
[AppContent] render, isAuthenticated: true
[AppContent] authenticated, showing dashboard
```

**To remove debug logs later:** Delete `console.log` statements from:

- `web/packages/hooks/src/useAuth.ts`
- `web/apps/dashboard/src/App.tsx`
- `web/apps/dashboard/src/pages/auth.tsx`

## Known Issues

**Build errors:** TypeScript workspace dependency resolution issues.  
**Workaround:** Use `pnpm dev` for development (works without building).  
**Status:** To be fixed in separate ticket.

## All Fixes Committed

✅ LoginResponse type corrected  
✅ Dashboard error handling added  
✅ Auth headers added to all endpoints  
✅ Null checks prevent crashes  
✅ API_BASE uses direct calls (no proxy)  
✅ Debug logging added  
✅ Pushed to remote branch

**Ready to test!**

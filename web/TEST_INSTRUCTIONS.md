# Testing the React Dashboard

## Prerequisites

1. **Backend must be running** on `http://localhost:8080`

   ```bash
   cd /workspace
   ./run start  # or ./run dev
   ```

2. **Clear browser cache** (important!)
   - Hard refresh: `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)
   - Or open DevTools → Network tab → Check "Disable cache"

## Starting the Frontend

```bash
cd /workspace/web
pnpm install  # if not already installed
pnpm dev
```

The dev server will start on **http://localhost:3000**

## Testing API Proxy

The Vite dev server is configured to proxy:

- `/api/*` → `http://localhost:8080` (API requests)
- `/ws` → `ws://localhost:8080` (WebSocket)

**Verify proxy is working:**

1. Open browser DevTools → Network tab
2. Go to http://localhost:3000
3. Look for `/api/account/create` - it should show:
   - Request URL: `http://localhost:3000/api/account/create` (NOT 404)
   - Proxy target: `http://localhost:8080/account/create`

**If you see 404s:**

- ✅ Backend is running on localhost:8080
- ✅ Dev server was restarted after vite.config.ts changes
- ✅ No firewall blocking localhost:8080

## Testing Auth Flow

### Expected UI (matches auth.html exactly):

**Create Account Tab:**

1. Shows info box: "About API Keys"
2. Single button: "Generate API Key" (NO username input!)
3. Click → Generates API key
4. Shows:
   - API key with Copy button
   - Account ID
   - Confirmation checkbox: "I have saved my API key..."
5. Check box → "Continue to Dashboard" button becomes active
6. Click → Logs in and redirects to dashboard

**Login Tab:**

1. Single input: "API Key" (password field)
2. Button: "Login"
3. Enter API key → Click Login → Redirects to dashboard

### If you see a username field:

**This means browser cache is showing OLD code.** Fix:

1. **Hard refresh:** `Ctrl+Shift+R` or `Cmd+Shift+R`
2. **Clear cache:**
   - Chrome: DevTools → Application → Clear Storage → "Clear site data"
   - Firefox: DevTools → Storage → Clear All
3. **Incognito/Private mode:** Test in a fresh browser window
4. **Restart dev server:**

   ```bash
   # Kill existing process
   pkill -f "vite"

   # Start fresh
   cd /workspace/web
   pnpm dev
   ```

## Verifying Code

**Current auth.tsx sends:**

```typescript
await createAccountMutation.mutateAsync({
  metadata: null, // ← NO USERNAME!
})
```

**Backend expects (from auth.html):**

```json
{
  "metadata": null
}
```

**To verify you have the latest code:**

```bash
cd /workspace
git log --oneline -1
# Should show: 2131ab2 fix: match original auth.html UI and add API proxy

git diff HEAD -- web/apps/dashboard/src/pages/auth.tsx
# Should show: no differences
```

## Common Issues

| Issue                  | Cause                    | Fix                                      |
| ---------------------- | ------------------------ | ---------------------------------------- |
| API 404s               | Backend not running      | Start backend: `./run start`             |
| API 404s               | Dev server needs restart | `pkill -f vite && pnpm dev`              |
| Username field showing | Browser cache            | Hard refresh + clear cache               |
| CORS errors            | Proxy not working        | Check vite.config.ts, restart dev server |

## Production Build

```bash
cd /workspace/web
pnpm build

# Verify build output
ls -lh apps/dashboard/dist/
# Should show: index.html, assets/*.js, assets/*.css
```

## Running Tests

```bash
cd /workspace/web

# Format check
pnpm format:check

# Lint (simplified)
pnpm lint

# Type check
pnpm type-check

# Full validation
pnpm validate
```

All checks should pass ✅

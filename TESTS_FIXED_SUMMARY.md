# E2E Tests Fixed - Summary

## Root Cause

The tests were failing because they didn't match the actual UI implementation:

1. **Missing test IDs** - UI components had no `data-testid` attributes
2. **Wrong selectors** - Tests used `input[name="apiKey"]` but actual is `input[id="apiKey"]`
3. **Wrong API** - Tests tried to create account with `account_name` parameter, but API expects `metadata: null`
4. **Wrong URLs** - Tests expected `/dashboard` but app redirects to `/`
5. **Wrong flow** - Create account doesn't take account name, uses tab-based UI

## Fixes Applied

### 1. Added Test IDs to UI Components ✅

**File:** `web/packages/ui/src/forms/LoginForm.tsx`

Added `data-testid` attributes:
- `api-key-input` - API key input field
- `login-button` - Login button
- `create-account-tab` - Create Account tab button
- `create-account-button` - Generate API Key button
- `api-key-display` - Generated API key display (readonly input)
- `continue-to-dashboard-button` - Continue button after account creation
- `login-error` - Error message display

### 2. Fixed Auth Fixture ✅

**File:** `web/e2e/fixtures/auth.fixture.ts`

Changes:
- Use `metadata: null` instead of `account_name` in API call
- Use `data-testid` selectors instead of name/id
- Wait for redirect to `/` instead of `/dashboard`
- Increased timeouts for reliability

### 3. Fixed AuthPage Object ✅

**File:** `web/e2e/pages/AuthPage.ts`

Changes:
- Updated all selectors to use `data-testid`
- Removed `accountNameInput` (doesn't exist)
- Added `createAccountTab`, `confirmCheckbox`, `continueButton`
- Fixed `createAccount()` - no parameters, uses UI flow
- Fixed `loginWithNewAccount()` - handles checkbox confirmation

### 4. Fixed Auth Tests ✅

**File:** `web/e2e/tests/auth.spec.ts`

Changes:
- Remove `accountName` parameter from test functions
- Use `metadata: null` in API calls
- Update expectations for `/` instead of `/dashboard`
- API key is 64-character hex string, not arbitrary length

### 5. Fixed Workflow Tests ✅

**File:** `web/e2e/tests/workflows.spec.ts`

Changes:
- Use `loginWithNewAccount()` without parameters
- Remove all references to `accountName`
- Update URL expectations to `/`
- Remove account name verification (use account ID instead)

### 6. Fixed DashboardPage Object ✅

**File:** `web/e2e/pages/DashboardPage.ts`

Changes:
- Changed `getAccountName()` to `getAccountId()`
- Updated WebSocket status check (uses "Live" not "Connected")
- Fixed `goto()` to navigate to `/`
- Added try-catch for optional elements

### 7. Added Smoke Tests ✅

**File:** `web/e2e/tests/smoke.spec.ts` (new)

Quick validation tests:
- Load auth page
- Verify backend API responding
- Create account via API
- Redirect unauthenticated users

These can run in ~30 seconds to verify environment is working.

## Test Execution Order

**For CI:**

1. **First:** Run smoke tests
   ```bash
   pnpm test:e2e e2e/tests/smoke.spec.ts
   ```

2. **Then:** Run auth tests
   ```bash
   pnpm test:e2e e2e/tests/auth.spec.ts
   ```

3. **Finally:** Run all tests
   ```bash
   pnpm test:e2e
   ```

## Files Modified

### UI Components (1 file)
- `web/packages/ui/src/forms/LoginForm.tsx` - Added 7 data-testid attributes

### Test Infrastructure (4 files)
- `web/e2e/fixtures/auth.fixture.ts` - Fixed API calls and selectors
- `web/e2e/pages/AuthPage.ts` - Updated to match UI flow
- `web/e2e/pages/DashboardPage.ts` - Fixed account ID handling

### Test Suites (3 files)
- `web/e2e/tests/auth.spec.ts` - Updated 7 test cases
- `web/e2e/tests/workflows.spec.ts` - Updated 7 workflow tests
- `web/e2e/tests/smoke.spec.ts` - New smoke test suite

## Expected Results

### Smoke Tests (4 tests, ~30 seconds)
✅ Auth page loads  
✅ Backend API responds  
✅ Can create account via API  
✅ Redirects work correctly

### Auth Tests (7 tests, ~2 minutes)
✅ Create account successfully  
✅ Login with valid API key  
✅ Show error for invalid key  
✅ Session persists across reloads  
✅ Logout successfully  
✅ Clear auth state on logout  
✅ Redirect unauthenticated users

### Workflow Tests (7 tests, ~5 minutes)
✅ New user onboarding  
✅ Data submission and retrieval  
✅ Data submission and blockchain verification  
✅ Audit trail  
✅ Session expiry and re-authentication  
✅ Navigate all dashboard pages  
✅ Multiple data submissions

## Running Tests Locally

### Before running tests:

1. **Start Docker Compose:**
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```

2. **Start dashboard:**
   ```bash
   cd web/apps/dashboard
   pnpm dev
   ```

### Run tests:

```bash
cd web

# Smoke tests only (quick validation)
pnpm test:e2e e2e/tests/smoke.spec.ts

# Auth tests only
pnpm test:e2e e2e/tests/auth.spec.ts

# All tests
pnpm test:e2e

# With UI (interactive)
pnpm test:e2e:ui

# Single test with headed browser
pnpm test:e2e:headed e2e/tests/smoke.spec.ts
```

## CI/CD Usage

**Simple workflow** (recommended for validation):
```yaml
# .github/workflows/e2e-tests-simple.yml
- name: Run smoke tests
  run: pnpm test:e2e e2e/tests/smoke.spec.ts

- name: Run auth tests
  run: pnpm test:e2e e2e/tests/auth.spec.ts
```

**Full workflow** (once smoke tests pass):
```yaml
# .github/workflows/e2e-tests.yml
- name: Run all E2E tests
  run: pnpm test:e2e --project=chromium
```

## Debugging Failed Tests

### Check selectors:
```typescript
// In test, add:
await page.screenshot({ path: 'debug.png' });
console.log(await page.content());
```

### Check element existence:
```typescript
const element = page.locator('[data-testid="api-key-input"]');
console.log(await element.count()); // Should be 1
console.log(await element.isVisible()); // Should be true
```

### Check API responses:
```typescript
page.on('response', response => {
  console.log(`${response.status()} ${response.url()}`);
});
```

## Validation Checklist

Before committing:

- [ ] UI components have data-testid attributes
- [ ] Tests use data-testid selectors
- [ ] Auth fixture uses correct API (metadata: null)
- [ ] Tests expect redirect to `/` not `/dashboard`
- [ ] Smoke tests pass locally
- [ ] Auth tests pass locally
- [ ] Dashboard loads after auth

After committing:

- [ ] Smoke tests pass in CI
- [ ] Auth tests pass in CI
- [ ] All tests pass in CI
- [ ] Artifacts uploaded correctly

## Success Criteria

✅ Smoke tests pass (< 1 minute)  
✅ Auth tests pass (< 3 minutes)  
✅ Workflow tests pass (< 10 minutes)  
✅ Tests use actual UI components (not API workarounds)  
✅ No flaky tests (consistent results)  
✅ Clear error messages on failure  
✅ Artifacts available for debugging

## Next Steps

1. **Commit these changes**
2. **Push to CI**
3. **Monitor smoke tests first**
4. **If smoke tests pass, enable auth tests**
5. **If auth tests pass, enable all tests**
6. **Add more data-testid attributes as needed for other pages**

## Additional Components Needing Test IDs

For future test coverage, add `data-testid` to:

- Submit Data form (`web/apps/dashboard/src/pages/submit.tsx`)
- Collections page (`web/apps/dashboard/src/pages/collections.tsx`)
- Explorer page (`web/apps/dashboard/src/pages/explorer.tsx`)
- Network page (`web/apps/dashboard/src/pages/network.tsx`)
- Analytics page (`web/apps/dashboard/src/pages/analytics.tsx`)
- Audit page (`web/apps/dashboard/src/pages/audit.tsx`)
- Metrics page (`web/apps/dashboard/src/pages/metrics.tsx`)
- Debug page (`web/apps/dashboard/src/pages/debug.tsx`)

Pattern:
```tsx
<Input data-testid="data-input" />
<Button data-testid="submit-button">Submit</Button>
<div data-testid="success-message">Success!</div>
```

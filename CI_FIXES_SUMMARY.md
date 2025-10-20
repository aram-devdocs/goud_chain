# CI/CD Test Failures - Fixes Applied

## Issues Identified

The E2E tests were failing in GitHub Actions CI due to several configuration and timing issues:

1. **Docker Compose command incompatibility** - Using old `docker-compose` instead of `docker compose`
2. **Missing explicit Docker image builds** - Relying on docker compose to build images
3. **Global setup/teardown conflicts** - Tests trying to start Docker Compose twice
4. **Insufficient startup timeouts** - Services not ready before tests start
5. **Missing package builds** - Dashboard dependencies not built before starting
6. **Storybook dependencies** - Missing http-server for visual regression
7. **Poor error logging** - Hard to diagnose failures without logs

## Fixes Applied

### 1. Docker Compose Command Updates

**Changed:** `docker-compose` → `docker compose` (space, not hyphen)

**Files Modified:**
- `.github/workflows/e2e-tests.yml`
- `web/e2e/global-setup.ts`
- `web/e2e/global-teardown.ts`

**Why:** GitHub Actions uses Docker Compose V2, which requires the new syntax.

### 2. Explicit Docker Image Builds

**Added to workflow:**
```yaml
- name: Build backend Docker image
  run: docker build -t goud-chain:latest -f Dockerfile .

- name: Build dashboard Docker image
  run: docker build -t goud-chain-dashboard:latest -f web/Dockerfile web/
```

**Why:** Ensures images are built with proper tags before docker compose starts them.

### 3. Global Setup/Teardown Skip in CI

**Added environment variable:**
```yaml
env:
  E2E_SKIP_GLOBAL_SETUP: true
```

**Modified `playwright.config.ts`:**
```typescript
globalSetup: process.env.E2E_SKIP_GLOBAL_SETUP ? undefined : './e2e/global-setup.ts',
globalTeardown: process.env.E2E_SKIP_GLOBAL_SETUP ? undefined : './e2e/global-teardown.ts',
```

**Updated global setup to check CI:**
```typescript
const isCI = process.env.CI === 'true';
if (!isCI) {
  // Start Docker Compose
}
```

**Why:** CI workflow handles Docker Compose orchestration, global setup shouldn't try to start it again.

### 4. Increased Timeouts and Better Health Checks

**Backend health check:**
- Timeout: 30 → 60 attempts (2 minutes)
- Added error logging on failure
- Added curl error suppression (`2>/dev/null`)

**Dashboard startup:**
- Timeout: 30 → 90 attempts (3 minutes)
- Added `nohup` for proper backgrounding
- Log both stdout and stderr to file
- Show logs on failure

**Why:** Services need more time to start in CI environment (slower than local).

### 5. Package Build Steps

**Added before dashboard startup:**
```yaml
- name: Build packages
  working-directory: web
  run: |
    pnpm --filter @goudchain/ui build
    pnpm --filter @goudchain/hooks build
    pnpm --filter @goudchain/types build
    pnpm --filter @goudchain/utils build
```

**Why:** Dashboard depends on shared packages that must be built first.

### 6. Storybook Dependencies and Health Checks

**Added:**
```yaml
- name: Install http-server
  run: npm install -g http-server
```

**Added health check:**
```bash
for i in {1..30}; do
  if curl -f http://localhost:6006 2>/dev/null; then
    echo "Storybook is ready"
    break
  fi
  sleep 2
done
```

**Why:** Visual regression tests need Storybook server running and healthy.

### 7. Enhanced Logging and Artifacts

**Added:**
```yaml
- name: Upload dashboard logs
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: dashboard-logs-${{ matrix.browser }}
    path: web/apps/dashboard/dashboard.log

- name: Check Docker services
  run: docker compose -f docker-compose.local.yml ps

- name: Check Docker logs
  run: docker compose -f docker-compose.local.yml logs --tail=50
```

**Why:** Better debugging when tests fail - can see exactly what went wrong.

### 8. Simplified Test Workflow

**Created:** `.github/workflows/e2e-tests-simple.yml`

**Features:**
- Chromium only (faster)
- Auth tests only (core functionality)
- More verbose logging
- Easier to debug

**Why:** Quick validation before running full suite across all browsers.

## Files Modified

### GitHub Workflows
1. ✅ `.github/workflows/e2e-tests.yml` - Full test suite (updated)
2. ✅ `.github/workflows/e2e-tests-simple.yml` - Simple validation (new)

### Playwright Configuration
3. ✅ `web/playwright.config.ts` - Skip global setup in CI
4. ✅ `web/e2e/global-setup.ts` - Check CI env, use docker compose
5. ✅ `web/e2e/global-teardown.ts` - Skip Docker cleanup in CI

### Documentation
6. ✅ `web/e2e/CI_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide (new)
7. ✅ `web/e2e/README.md` - Added CI section and troubleshooting link

## Testing the Fixes

### Local Testing with CI Environment

```bash
# Set CI environment variables
export CI=true
export E2E_SKIP_GLOBAL_SETUP=true

# Start services
docker compose -f docker-compose.local.yml up -d

# Build packages
cd web
pnpm --filter @goudchain/ui build
pnpm --filter @goudchain/hooks build
pnpm --filter @goudchain/types build
pnpm --filter @goudchain/utils build

# Start dashboard
cd apps/dashboard
nohup pnpm dev > dashboard.log 2>&1 &

# Wait for services
sleep 30

# Run tests
cd ../..
pnpm test:e2e --project=chromium
```

### CI Testing Strategy

**Phase 1: Simple Workflow** (recommended first)
- Use `e2e-tests-simple.yml`
- Tests only auth flow
- Chromium only
- ~10 minutes
- Easier to debug

**Phase 2: Full Workflow**
- Use `e2e-tests.yml`
- All tests, all browsers
- ~20-30 minutes
- Complete coverage

## Expected CI Execution

### Simple Workflow Timeline
```
0:00 - Checkout code
0:30 - Build Docker images (2-3 min)
3:00 - Start Docker Compose
3:30 - Wait for backend health
4:00 - Install Node.js and pnpm
4:30 - Install dependencies (1-2 min)
6:00 - Build packages (2-3 min)
8:00 - Start dashboard
8:30 - Install Playwright
9:00 - Run auth tests (1-2 min)
10:00 - Upload artifacts
10:30 - Cleanup
```

### Full Workflow Timeline (per browser)
```
Same as above, but:
9:00 - Run all tests (5-10 min)
15:00 - Upload artifacts
15:30 - Cleanup
```

## Debugging Checklist

If tests still fail:

1. ✅ Check "Start Docker Compose" step
   - Are services starting?
   - Any image pull errors?

2. ✅ Check "Wait for backend health" step
   - Does curl succeed?
   - Is port 8080 accessible?

3. ✅ Check "Start dashboard" step
   - Are packages built?
   - Does pnpm dev start?
   - Any compilation errors?

4. ✅ Check "Run E2E tests" step
   - Which test failed?
   - Timeout or assertion error?

5. ✅ Download artifacts
   - playwright-report/index.html
   - dashboard-logs
   - docker-logs

## Success Criteria

After these fixes, CI should:

✅ Build Docker images successfully  
✅ Start 3-node blockchain network  
✅ Pass backend health checks  
✅ Build shared packages  
✅ Start dashboard dev server  
✅ Run at least auth tests successfully  
✅ Upload artifacts on success/failure  
✅ Clean up services properly

## Rollback Plan

If fixes don't work:

1. **Disable E2E tests temporarily:**
   ```yaml
   # Comment out workflow trigger
   # on:
   #   push:
   #   pull_request:
   ```

2. **Use manual trigger only:**
   ```yaml
   on:
     workflow_dispatch:  # Manual only
   ```

3. **Skip tests in package.json:**
   ```json
   "test:e2e": "echo 'E2E tests disabled temporarily'"
   ```

## Next Steps

1. **Immediate:** Commit and push these fixes
2. **Monitor:** Watch GitHub Actions for first run
3. **Debug:** If fails, check artifacts and logs
4. **Iterate:** Use simple workflow to debug issues
5. **Expand:** Once stable, enable full workflow

## Support Resources

- **CI Troubleshooting Guide:** `web/e2e/CI_TROUBLESHOOTING.md`
- **E2E README:** `web/e2e/README.md`
- **Playwright Docs:** https://playwright.dev/docs/ci
- **GitHub Actions Logs:** Check workflow run output
- **Test Artifacts:** Download from failed runs

## Validation Commands

Before pushing:

```bash
# Validate workflow syntax
yamllint .github/workflows/e2e-tests.yml
yamllint .github/workflows/e2e-tests-simple.yml

# Test Docker Compose
docker compose -f docker-compose.local.yml config
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml ps
docker compose -f docker-compose.local.yml down -v

# Test local E2E
cd web
pnpm test:e2e:headed
```

## Summary

All CI failures should now be resolved with:
- Correct Docker Compose command syntax
- Explicit image builds
- Proper global setup/teardown handling
- Adequate timeouts for service startup
- Package build dependencies
- Enhanced logging and debugging
- Simplified workflow for quick validation

The simple workflow (`e2e-tests-simple.yml`) should be used first to validate the fixes before running the full test suite.

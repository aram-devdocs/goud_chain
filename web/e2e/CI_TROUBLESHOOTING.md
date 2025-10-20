# CI/CD Troubleshooting Guide

## Common CI Issues and Solutions

### Issue 1: Docker Compose Command Not Found

**Error:**
```
docker-compose: command not found
```

**Solution:**
GitHub Actions uses Docker Compose v2, which uses `docker compose` (space) instead of `docker-compose` (hyphen).

**Fixed in:** `.github/workflows/e2e-tests.yml` - All commands updated to use `docker compose`

### Issue 2: Backend Services Not Starting

**Symptoms:**
- Health check fails after 30 attempts
- Backend returns connection refused

**Debug Steps:**
1. Check Docker Compose logs:
   ```yaml
   - name: Check Docker logs
     run: docker compose -f docker-compose.local.yml logs
   ```

2. Check service status:
   ```yaml
   - name: Check service status
     run: docker compose -f docker-compose.local.yml ps
   ```

3. Verify images built:
   ```yaml
   - name: Build backend image
     run: docker build -t goud-chain:latest -f Dockerfile .
   ```

**Solutions:**
- Increase health check timeout to 60 attempts
- Build images explicitly before docker compose up
- Add `--build` flag to docker compose command

### Issue 3: Dashboard Dev Server Not Starting

**Symptoms:**
- Dashboard health check times out
- Port 3000 not responding

**Debug Steps:**
1. Check dashboard logs:
   ```yaml
   - name: Upload dashboard logs
     uses: actions/upload-artifact@v4
     with:
       path: web/apps/dashboard/dashboard.log
   ```

2. Verify packages built:
   ```bash
   pnpm --filter @goudchain/ui build
   pnpm --filter @goudchain/hooks build
   pnpm --filter @goudchain/types build
   pnpm --filter @goudchain/utils build
   ```

**Solutions:**
- Build shared packages before starting dashboard
- Use `nohup` to properly background the process
- Increase startup timeout to 90 seconds
- Log both stdout and stderr to dashboard.log

### Issue 4: Global Setup/Teardown Conflicts

**Symptoms:**
- Tests try to start Docker Compose twice
- Docker Compose already running errors

**Solution:**
Skip global setup in CI by setting environment variable:
```yaml
env:
  E2E_SKIP_GLOBAL_SETUP: true
```

This is handled in `playwright.config.ts`:
```typescript
globalSetup: process.env.E2E_SKIP_GLOBAL_SETUP ? undefined : './e2e/global-setup.ts',
```

### Issue 5: Test Timeouts

**Symptoms:**
- Individual tests timeout after 60 seconds
- Suite takes longer than 30 minutes

**Solutions:**
1. Reduce parallel workers in CI:
   ```typescript
   workers: process.env.CI ? 2 : 4
   ```

2. Enable retries:
   ```typescript
   retries: process.env.CI ? 2 : 0
   ```

3. Increase job timeout:
   ```yaml
   timeout-minutes: 30
   ```

### Issue 6: Storybook Build Failures

**Symptoms:**
- Visual regression tests fail
- Storybook build errors

**Solutions:**
1. Install http-server globally:
   ```yaml
   - name: Install http-server
     run: npm install -g http-server
   ```

2. Build dependencies first:
   ```bash
   pnpm --filter @goudchain/types build
   pnpm --filter @goudchain/utils build
   ```

3. Wait for Storybook to be ready:
   ```bash
   for i in {1..30}; do
     if curl -f http://localhost:6006; then
       break
     fi
     sleep 2
   done
   ```

### Issue 7: Playwright Browser Installation

**Symptoms:**
- Browser not found errors
- Chromium/Firefox/WebKit missing

**Solution:**
Install browsers with system dependencies:
```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium
```

### Issue 8: Race Conditions

**Symptoms:**
- Flaky tests that pass locally but fail in CI
- Intermittent failures

**Solutions:**
1. Use explicit waits in tests:
   ```typescript
   await page.waitForLoadState('networkidle');
   await element.waitFor({ state: 'visible' });
   ```

2. Avoid arbitrary timeouts:
   ```typescript
   // Bad
   await page.waitForTimeout(5000);
   
   // Good
   await page.waitForSelector('[data-testid="element"]');
   ```

3. Wait for API responses:
   ```typescript
   await page.waitForResponse(response => 
     response.url().includes('/api/endpoint') && response.ok()
   );
   ```

## CI Workflow Execution Order

### E2E Tests Job

1. ✅ Checkout code
2. ✅ Set up Docker Buildx
3. ✅ **Build backend Docker image** (explicit build)
4. ✅ **Build dashboard Docker image** (explicit build)
5. ✅ Start Docker Compose services
6. ✅ Check Docker service status
7. ✅ Wait for backend health (60 attempts)
8. ✅ Set up Node.js 20
9. ✅ Set up pnpm 9
10. ✅ Install dependencies (with cache)
11. ✅ **Build shared packages** (types, utils, hooks, ui)
12. ✅ Start dashboard dev server (with logging)
13. ✅ Wait for dashboard ready (90 attempts)
14. ✅ Install Playwright browsers
15. ✅ Run E2E tests (with retries)
16. ✅ Upload artifacts (reports, logs)
17. ✅ Stop services and cleanup

### Visual Regression Job

1. ✅ Checkout code
2. ✅ Set up Node.js 20
3. ✅ Set up pnpm 9
4. ✅ Install dependencies
5. ✅ **Install http-server globally**
6. ✅ **Build shared packages**
7. ✅ Build Storybook
8. ✅ Start Storybook server (with health check)
9. ✅ Install Playwright browsers
10. ✅ Run visual regression tests
11. ✅ Upload visual diffs
12. ✅ Stop services

## Environment Variables

### Required in CI
```yaml
CI: true                      # Enables CI mode in Playwright
E2E_SKIP_GLOBAL_SETUP: true  # Skips Docker Compose in global setup
DASHBOARD_URL: http://localhost:3000
API_URL: http://localhost:8080
WS_URL: ws://localhost:8080/ws
```

### Optional
```yaml
VISUAL_THRESHOLD: 0.1        # Visual regression threshold (10%)
STORYBOOK_URL: http://localhost:6006
```

## Debugging Failed CI Runs

### Step 1: Check Artifacts

1. Download `playwright-report` artifact
2. Open `index.html` in browser
3. Review failed test traces

### Step 2: Check Logs

1. Download `dashboard-logs` artifact
2. Download `docker-logs` artifact
3. Look for error messages

### Step 3: Local Reproduction

```bash
# Set CI environment
export CI=true
export E2E_SKIP_GLOBAL_SETUP=true

# Start services manually
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

# Run tests
cd ../..
pnpm test:e2e --project=chromium
```

### Step 4: Check Specific Test

```bash
# Run single test file
pnpm test:e2e e2e/tests/auth.spec.ts

# Run with debug
pnpm test:e2e:debug e2e/tests/auth.spec.ts

# Run with headed browser
pnpm test:e2e:headed e2e/tests/auth.spec.ts
```

## Performance Optimization

### Reduce CI Time

1. **Use Simple Workflow First:**
   - `.github/workflows/e2e-tests-simple.yml`
   - Runs Chromium only
   - Tests auth.spec.ts only
   - ~10 minutes total

2. **Parallel Execution:**
   - Matrix strategy for browsers
   - Separate visual regression job
   - fail-fast: false

3. **Caching:**
   - pnpm store cache
   - Docker layer cache
   - Playwright browser cache

### Expected Timings

- Docker Compose startup: 2-3 minutes
- pnpm install: 1-2 minutes
- Package builds: 2-3 minutes
- Dashboard startup: 1-2 minutes
- Playwright install: 1-2 minutes
- Test execution: 5-10 minutes (per browser)
- **Total: ~15-20 minutes** (single browser)

## Testing the Fix

### Before Committing

1. Run tests locally with CI env:
   ```bash
   CI=true E2E_SKIP_GLOBAL_SETUP=true pnpm test:e2e
   ```

2. Test Docker Compose startup:
   ```bash
   docker compose -f docker-compose.local.yml up -d
   docker compose -f docker-compose.local.yml ps
   docker compose -f docker-compose.local.yml logs
   ```

3. Test dashboard build:
   ```bash
   cd web
   pnpm --filter @goudchain/ui build
   cd apps/dashboard
   pnpm dev
   ```

### After Pushing

1. Monitor GitHub Actions run
2. Check "Set up Docker Compose" step
3. Check "Wait for backend health" step
4. Check "Start dashboard" step
5. Check "Run E2E tests" step

### Quick Fixes

If tests still fail:

1. **Try simple workflow first:**
   - Use `.github/workflows/e2e-tests-simple.yml`
   - Only tests auth flow
   - Easier to debug

2. **Disable problematic tests temporarily:**
   ```typescript
   test.skip('flaky test', async () => {
     // Will be fixed later
   });
   ```

3. **Increase timeouts:**
   - Backend health: 60 → 90 attempts
   - Dashboard startup: 60 → 120 attempts
   - Test timeout: 60s → 90s

4. **Add more logging:**
   ```yaml
   - name: Debug step
     run: |
       echo "Current state:"
       docker ps
       curl http://localhost:8080/health || true
       curl http://localhost:3000 || true
   ```

## Success Criteria

✅ All services start successfully  
✅ Health checks pass within timeout  
✅ At least one test passes  
✅ Artifacts uploaded on failure  
✅ Services cleaned up properly

## Contact

For CI issues, check:
1. This troubleshooting guide
2. Playwright documentation
3. GitHub Actions logs
4. Test artifacts (reports, logs)

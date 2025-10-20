# End-to-End Testing Suite

Comprehensive E2E testing infrastructure for the Goud Chain dashboard using Playwright with TypeScript. Tests validate complete user workflows across authentication, data operations, blockchain exploration, and real-time monitoring.

## Overview

**Purpose:** Automated validation of critical user journeys to ensure frontend-backend integration, catch regressions pre-deployment, and enable safe refactoring.

**Technology Stack:**
- Playwright 1.56+ with TypeScript
- Page Object Model pattern
- Fixtures-based state management
- Cross-browser testing (Chromium, Firefox, WebKit)
- Visual regression testing with Storybook
- Docker Compose test environment (3-node blockchain network)

## Project Structure

```
web/e2e/
├── fixtures/              # Test fixtures for state management
│   ├── auth.fixture.ts    # Authenticated user session
│   ├── blockchain.fixture.ts  # Blockchain state helpers
│   ├── websocket.fixture.ts   # WebSocket event validation
│   └── test-data.fixture.ts   # Test data generators
├── pages/                 # Page Object Model
│   ├── BasePage.ts        # Common page utilities
│   ├── AuthPage.ts        # Authentication page
│   ├── DashboardPage.ts   # Main dashboard
│   ├── SubmitDataPage.ts  # Data submission
│   ├── CollectionsPage.ts # Collections management
│   ├── ExplorerPage.ts    # Blockchain explorer
│   ├── NetworkPage.ts     # Network monitoring
│   ├── AnalyticsPage.ts   # Analytics dashboard
│   ├── AuditPage.ts       # Audit logs
│   ├── MetricsPage.ts     # System metrics
│   ├── DebugPage.ts       # Debug utilities
│   └── index.ts           # Page objects export
├── tests/                 # Test suites
│   ├── auth.spec.ts       # Authentication flows
│   ├── submit-data.spec.ts    # Data submission
│   ├── collections.spec.ts    # Collection management
│   ├── explorer.spec.ts       # Blockchain exploration
│   ├── network.spec.ts        # Network monitoring
│   ├── analytics.spec.ts      # Analytics features
│   ├── audit.spec.ts          # Audit logging
│   ├── metrics.spec.ts        # System metrics
│   ├── debug.spec.ts          # Debug utilities
│   ├── workflows.spec.ts      # End-to-end workflows
│   └── visual-regression.spec.ts  # Visual testing
├── visual/                # Visual regression assets
│   └── baseline/          # Baseline screenshots
├── global-setup.ts        # Docker Compose orchestration
└── global-teardown.ts     # Cleanup
```

## Getting Started

### Prerequisites

1. **Docker and Docker Compose** (for blockchain test environment)
2. **Node.js 20+** and **pnpm 9+**
3. **Playwright browsers** (installed automatically)

### Installation

```bash
# Install dependencies
cd web
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Configuration

Environment variables are configured in `.env.test`:

```env
# Dashboard URL (frontend)
DASHBOARD_URL=http://localhost:3000

# Backend API URL (via load balancer)
API_URL=http://localhost:8080

# WebSocket URL
WS_URL=ws://localhost:8080/ws

# Test configuration
TEST_TIMEOUT=60000
TEST_RETRIES=2
TEST_WORKERS=4

# Visual regression
VISUAL_REGRESSION_ENABLED=true
VISUAL_THRESHOLD=0.1
STORYBOOK_URL=http://localhost:6006
```

## Running Tests

### Local Development

**Run all E2E tests:**
```bash
pnpm test:e2e
```

**Run specific browser:**
```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

**Run specific test file:**
```bash
pnpm test:e2e e2e/tests/auth.spec.ts
```

**Run with UI mode (interactive):**
```bash
pnpm test:e2e:ui
```

**Debug mode (step through tests):**
```bash
pnpm test:e2e:debug
```

**Headed mode (see browser):**
```bash
pnpm test:e2e:headed
```

**Visual regression tests only:**
```bash
pnpm test:e2e:visual
```

**View test report:**
```bash
pnpm test:e2e:report
```

### Prerequisites for Running Tests

**Start Docker Compose environment:**
```bash
cd .. # Go to workspace root
docker-compose -f docker-compose.local.yml up -d
```

**Start dashboard dev server:**
```bash
cd web/apps/dashboard
pnpm dev
```

**Start Storybook (for visual regression):**
```bash
cd web/packages/ui
pnpm storybook
```

### CI/CD Integration

Tests run automatically on GitHub Actions for:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`
- Manual workflow dispatch

**CI workflow features:**
- Cross-browser parallel execution (Chromium, Firefox, WebKit)
- Docker Compose orchestration (3-node blockchain network)
- Artifact collection (reports, screenshots, videos, logs)
- Visual regression testing (Storybook integration)
- Test result aggregation

**Available workflows:**
1. **e2e-tests.yml** - Full test suite (all browsers, all tests)
2. **e2e-tests-simple.yml** - Quick validation (Chromium only, auth tests)

**CI-specific configuration:**
```yaml
env:
  CI: true                      # Enables CI mode
  E2E_SKIP_GLOBAL_SETUP: true  # Skips Docker in global setup
  DASHBOARD_URL: http://localhost:3000
  API_URL: http://localhost:8080
```

**Troubleshooting CI failures:** See `e2e/CI_TROUBLESHOOTING.md`

## Test Architecture

### Page Object Model

Page objects encapsulate page-specific selectors and actions:

```typescript
// Example: SubmitDataPage
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SubmitDataPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  get dataInput(): Locator {
    return this.page.locator('textarea[name="data"]');
  }
  
  async submitData(data: string): Promise<string> {
    await this.dataInput.fill(data);
    await this.submitButton.click();
    await this.successMessage.waitFor({ state: 'visible' });
    return await this.dataIdDisplay.textContent() || '';
  }
}
```

### Fixtures

Fixtures provide reusable test state:

```typescript
// Example: Using auth fixture
import { test, expect } from '../fixtures/auth.fixture';
import { SubmitDataPage } from '../pages/SubmitDataPage';

test('should submit data', async ({ authenticatedPage, apiKey }) => {
  const submitPage = new SubmitDataPage(authenticatedPage);
  await submitPage.goto();
  
  const dataId = await submitPage.submitData('Test data');
  expect(dataId).toBeTruthy();
});
```

**Available fixtures:**
- `authenticatedPage`: Pre-authenticated user session
- `apiKey`: API key for authenticated user
- `accountName`: Account name for authenticated user
- `blockchain`: Blockchain state utilities
- `websocket`: WebSocket event validation
- `testData`: Test data generators

### Test Organization

Tests follow clear naming conventions:

```typescript
test.describe('Feature Area', () => {
  test('should [expected behavior] when [scenario]', async ({ page }) => {
    // Test implementation
  });
});
```

**Test coverage:**
1. **Authentication** (`auth.spec.ts`): Login, logout, session persistence, error handling
2. **Data Submission** (`submit-data.spec.ts`): Form validation, encryption, blockchain confirmation
3. **Collections** (`collections.spec.ts`): List, search, decrypt, verify data
4. **Explorer** (`explorer.spec.ts`): Browse blocks, view transactions, Merkle trees
5. **Network** (`network.spec.ts`): Peer monitoring, validator rotation, connection status
6. **Analytics** (`analytics.spec.ts`): Metrics charts, statistics, time ranges
7. **Audit** (`audit.spec.ts`): Log display, filtering, live mode
8. **Metrics** (`metrics.spec.ts`): System metrics, cache stats, auto-refresh
9. **Debug** (`debug.spec.ts`): State inspection, debug controls, log viewer
10. **Workflows** (`workflows.spec.ts`): Complete user journeys across multiple pages
11. **Visual Regression** (`visual-regression.spec.ts`): Component snapshots, UI consistency

## Visual Regression Testing

Visual tests compare UI screenshots against baseline images:

**Update baseline images:**
```bash
pnpm test:e2e:visual --update-snapshots
```

**Review visual changes:**
1. Run tests: `pnpm test:e2e:visual`
2. Check `web/e2e/visual/diff/` for pixel differences
3. Approve changes: `pnpm test:e2e:visual --update-snapshots`
4. Commit updated baselines to git

**Threshold configuration:**
- Default: 0.1 (10% pixel difference allowed)
- Adjust via `VISUAL_THRESHOLD` environment variable
- Accounts for font rendering differences across systems

## Best Practices

### Writing Tests

1. **Use Page Objects:** Encapsulate selectors and actions
2. **Leverage Fixtures:** Reuse authentication and test state
3. **Explicit Waits:** Wait for specific conditions, not arbitrary timeouts
4. **Descriptive Names:** Clear test descriptions following naming convention
5. **Cleanup:** Tests should clean up after themselves (fixtures handle this)

### Test Data

- **Unique identifiers:** Use timestamps and random strings
- **Deterministic generation:** Use fixtures for consistent test data
- **Isolation:** Each test creates its own account/data
- **Privacy:** Test accounts encrypted with own API keys

### Performance

- **Parallel execution:** 4 workers by default (adjust in `playwright.config.ts`)
- **Shared authentication:** Fixtures reuse sessions across tests
- **Selective screenshots:** Only on failure (saves CI time)
- **Targeted tests:** Run specific suites during development

### Debugging

**View test execution:**
```bash
pnpm test:e2e:headed
```

**Step through tests:**
```bash
pnpm test:e2e:debug
```

**Interactive UI:**
```bash
pnpm test:e2e:ui
```

**Inspect artifacts:**
- Screenshots: `web/test-results/`
- Videos: `web/test-results/`
- Traces: `web/test-results/`
- Report: `web/playwright-report/`

## Troubleshooting

### Docker Compose Issues

**Services not starting:**
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

**Check service health:**
```bash
docker-compose -f docker-compose.local.yml ps
curl http://localhost:8080/health
```

**View logs:**
```bash
docker-compose -f docker-compose.local.yml logs
```

### Test Failures

**Timeouts:**
- Increase timeout in `playwright.config.ts`
- Check Docker services are healthy
- Verify dashboard is running

**Flaky tests:**
- Use explicit waits instead of `waitForTimeout()`
- Wait for network idle: `await page.waitForLoadState('networkidle')`
- Check for race conditions

**Authentication failures:**
- Clear browser storage: `await page.context().clearCookies()`
- Regenerate test accounts
- Check API key format

### CI/CD Issues

**Artifact upload failures:**
- Check disk space on runner
- Reduce artifact retention days
- Compress large artifacts

**Browser installation:**
- Use `--with-deps` flag
- Verify Playwright version matches CI

**Docker conflicts:**
- Ensure ports 8080-8083 available
- Clean up containers between runs

## Maintenance

### Adding New Tests

1. Create test file in `e2e/tests/`
2. Import relevant page objects
3. Use fixtures for authentication
4. Follow naming conventions
5. Add to CI workflow if needed

### Updating Page Objects

1. Update selectors in page object file
2. Run affected tests locally
3. Update snapshots if visual changes
4. Document breaking changes

### Visual Regression Updates

1. Make UI changes
2. Run visual tests: `pnpm test:e2e:visual`
3. Review diffs in `web/e2e/visual/diff/`
4. Approve changes: `pnpm test:e2e:visual --update-snapshots`
5. Commit updated baselines

## Performance Metrics

**Test execution times (approximate):**
- Authentication suite: 30-60 seconds
- Data submission suite: 45-90 seconds
- Collections suite: 60-120 seconds
- Explorer suite: 45-90 seconds
- Network suite: 30-60 seconds
- Analytics suite: 30-60 seconds
- Audit suite: 45-90 seconds
- Metrics suite: 30-60 seconds
- Debug suite: 30-60 seconds
- Workflow suite: 120-240 seconds
- Visual regression: 60-120 seconds

**Total suite runtime:** ~15-20 minutes (parallel execution across 4 workers)

## Security Considerations

- **Test accounts:** Use dedicated API keys, never production credentials
- **Data isolation:** Each test creates isolated encrypted data
- **Cleanup:** Fixtures automatically clean up test data
- **CI secrets:** API URLs configured via environment variables
- **No sensitive data:** Avoid real user data in tests

## Contributing

1. Follow existing patterns (Page Objects, fixtures, naming conventions)
2. Add tests for new features
3. Update baselines for intentional visual changes
4. Run full test suite before submitting PR
5. Document non-obvious test logic

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Fixtures Guide](https://playwright.dev/docs/test-fixtures)
- [Visual Testing](https://playwright.dev/docs/test-snapshots)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Playwright documentation
3. Inspect test artifacts (screenshots, videos, traces)
4. Run tests in debug mode
5. Consult project maintainers

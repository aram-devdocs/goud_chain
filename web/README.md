# Goud Chain React Dashboard

Modern React dashboard for Goud Chain blockchain, built with TypeScript, Vite, and TanStack Query.

## Quick Start

```bash
./run dev
```

Opens:

- [API] http://localhost:8080 (Load Balancer)
- [WEB] http://localhost:3001 (Dashboard with hot reload)

Edit any file in [web/apps/dashboard/src/](apps/dashboard/src/) and see instant updates in the browser.

## Architecture

### Monorepo Structure

```
web/
├── apps/
│   └── dashboard/          # Main React application
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Utility functions
│   ├── hooks/              # React hooks & API calls
│   ├── ui/                 # UI components library
│   └── config/             # Shared configs (TS, Tailwind, ESLint)
├── package.json            # Root package.json
├── pnpm-workspace.yaml     # pnpm workspace config
└── turbo.json              # Turborepo pipeline config
```

### Tech Stack

- **React 19** - UI framework
- **TypeScript 5.7** - Type safety
- **Vite 6** - Dev server & bundler
- **TanStack Router** - File-based routing (planned)
- **TanStack Query v5** - Data fetching & caching
- **Tailwind CSS v3** - Utility-first styling
- **Storybook 8** - Component development & documentation
- **Turborepo 2.5** - Monorepo orchestration
- **pnpm 9.15** - Fast package manager

## Available Scripts

```bash
# Development
pnpm dev              # Start Vite dev server (:3001)
pnpm --filter @goudchain/ui storybook  # Start Storybook (:6006)

# Building
pnpm build            # Build all packages + apps for production
pnpm build:dashboard  # Build only dashboard app
pnpm --filter @goudchain/ui build-storybook  # Build Storybook static site

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
pnpm format           # Run Prettier (fix mode)
pnpm format:check     # Check formatting (CI mode)
pnpm validate         # Run format check + type check + build (pre-commit)

# Testing
pnpm test             # Run tests (when implemented)

# Cleanup
pnpm clean            # Remove all node_modules and dist folders
```

## Development Workflow

### 1. Create Account & Login

```bash
# Open dashboard
open http://localhost:3001

# Click "Create Account" → "Generate API Key"
# Save the API key (it's only shown once)
# Check "I have saved my API key"
# Click "Continue to Dashboard"
```

### 2. View Blockchain Data

Dashboard shows:

- Chain length
- Number of collections
- Peer count
- Latest block info
- Real-time updates

### 3. Submit Data

```bash
# Navigate to "Submit Data" tab
# Enter collection name and data
# Click "Submit"
# Data is encrypted and stored on blockchain
```

## Design System & Storybook

### Design Tokens

GoudChain uses a comprehensive design token system for consistent styling:

```typescript
import { colors, spacing, typography, breakpoints } from '@goudchain/ui'

// Colors: Zinc grayscale + semantic accents
colors.zinc[950] // Background (#09090b)
colors.primary // Blue-500 (#3b82f6)
colors.success // Green-500 (#22c55e)

// Spacing: 4px base grid
spacing[4] // 1rem (16px)
spacing[6] // 1.5rem (24px)

// Typography
typography.h1 // Large bold header
typography.body // Standard body text
typography.code // Monospace for technical data
```

### Layout Primitives

Responsive layout components for building consistent UIs:

```tsx
import { Container, Stack, Grid, Flex } from '@goudchain/ui'
;<Container maxWidth="xl">
  <Stack direction="vertical" spacing={6}>
    <h1>Page Title</h1>
    <Grid columns={{ sm: 2, md: 3, lg: 4 }} gap={4}>
      <Card>Item 1</Card>
      <Card>Item 2</Card>
    </Grid>
  </Stack>
</Container>
```

### Atomic Components

Pre-built components following the design system:

```tsx
import { Button, Card, Input } from '@goudchain/ui'
import { ButtonVariant, ButtonSize } from '@goudchain/types'
;<Card>
  <Input label="Email" type="email" />
  <Button variant={ButtonVariant.Primary} size={ButtonSize.Large}>
    Submit
  </Button>
</Card>
```

### Storybook Development

Interactive component playground for developing and testing components in isolation:

```bash
# Start Storybook
pnpm --filter @goudchain/ui storybook

# Open http://localhost:6006
```

Storybook includes:

- **Interactive Controls**: Modify component props in real-time
- **Accessibility Testing**: Built-in a11y addon for WCAG compliance
- **Responsive Viewports**: Test mobile (375px), tablet (768px), desktop (1920px)
- **Dark Theme**: Matches GoudChain aesthetic (zinc-950 background)

See [packages/ui/README.md](packages/ui/README.md) for complete design system documentation.

## API Integration

### Base URL Configuration

Development uses **direct API calls** to avoid Vite proxy complexity:

```typescript
// packages/hooks/src/config.ts
export const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8080' // Direct to nginx load balancer
    : window.location.origin // Production (nginx proxies)
```

### Authentication

All authenticated requests include:

```typescript
headers: {
  'Authorization': `Bearer ${session_token}`
}
```

Session tokens are stored in `localStorage` (note: not production-ready, use httpOnly cookies in prod).

### API Endpoints

| Endpoint             | Method | Auth | Purpose               |
| -------------------- | ------ | ---- | --------------------- |
| `/account/create`    | POST   | No   | Generate API key      |
| `/account/login`     | POST   | No   | Get session token     |
| `/data/submit`       | POST   | Yes  | Submit encrypted data |
| `/data/list`         | GET    | Yes  | List collections      |
| `/data/decrypt/{id}` | POST   | Yes  | Decrypt data          |
| `/chain`             | GET    | Yes  | Get chain info        |
| `/stats`             | GET    | Yes  | Get blockchain stats  |

## Port Configuration

| Service             | Port | Notes                                           |
| ------------------- | ---- | ----------------------------------------------- |
| React Dashboard     | 3001 | Changed from 3000 (conflict with old dashboard) |
| Nginx Load Balancer | 8080 | Primary API endpoint                            |
| Node 1              | 8081 | Direct node access (debugging)                  |
| Node 2              | 8082 | Direct node access (debugging)                  |
| Node 3              | 8083 | Direct node access (debugging)                  |
| Jupyter Lab         | 8888 | API testing notebooks                           |

**Why 3001?**  
The Docker setup includes an old dashboard container on port 3000. We use 3001 to avoid conflicts.

## Troubleshooting

### Port 3001 already in use

```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or use different port
pnpm dev --port 3002
```

### Backend not responding

```bash
# Check backend health
curl http://localhost:8080/health

# If failing, restart backend
./run stop
./run dev
```

### Dashboard stuck on loading

```bash
# Restart everything
./run stop
./run dev
```

If still failing:

- Open DevTools → Console for errors
- Clear localStorage: `localStorage.clear()` then reload
- Verify backend: `curl http://localhost:8080/health`

### TypeScript build errors

```bash
# Clean and reinstall
pnpm clean
pnpm install
pnpm build
```

### Old dashboard still showing

```bash
# Stop old dashboard container
docker stop dashboard
docker rm dashboard

# Verify it's gone
docker ps | grep dashboard  # Should be empty
```

## Production Build

### Build Static Assets

```bash
cd /workspace/web
pnpm build

# Output: apps/dashboard/dist/
```

### Docker Build

```bash
cd /workspace/web
docker build -t goud-chain-dashboard:latest -f Dockerfile .
```

### Deploy

The Dockerfile uses multi-stage build:

1. **Builder stage:** pnpm install + build
2. **Production stage:** nginx serving static files

```dockerfile
FROM nginx:alpine
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
```

## Known Issues

### Build-time TypeScript errors

`pnpm build` sometimes fails with workspace dependency resolution errors. This is a known issue being tracked.

**Workaround:** Use `pnpm dev` for development (works perfectly).

### No TanStack Router yet

Current routing uses a simple `useState` switch statement. TanStack Router integration is planned.

### No tests yet

Test infrastructure (Vitest + React Testing Library) is configured but no tests written yet.

## Contributing

1. Follow TypeScript strict mode
2. Use ESLint and Prettier (pre-commit hooks enforce)
3. Keep components in `apps/dashboard/src/`
4. Keep reusable logic in `packages/`
5. No inline styles (use Tailwind classes or UI components)

## Documentation

- `QUICK_START.md` - Fast reference for getting started
- `DEVELOPMENT_SETUP.md` - Complete dev environment guide
- `DEBUG_AUTH_FLOW.md` - Auth debugging instructions
- `FIXES_SUMMARY.md` - Technical details of recent fixes

## Project Status

**Current Phase:** Active migration from Alpine.js (`/workspace/dashboard/`) to React (`/workspace/web/`)

**Completed:**

- ✅ Monorepo setup (Turborepo + pnpm)
- ✅ TypeScript strict mode
- ✅ Core UI components
- ✅ Authentication flow
- ✅ Dashboard page
- ✅ Data submission
- ✅ Port conflict resolution
- ✅ API type safety
- ✅ Design token system
- ✅ Storybook integration
- ✅ Responsive layout primitives
- ✅ Atomic component library

**In Progress:**

- 🚧 TanStack Router integration
- 🚧 WebSocket real-time updates
- 🚧 Comprehensive test coverage
- 🚧 Error boundaries
- 🚧 Loading states improvements
- 🚧 Page refactoring to use atomic components

**Planned:**

- 📋 Audit logs viewer
- 📋 Metrics dashboard
- 📋 Data management (decrypt, download)
- 📋 Settings page
- 📋 Dark mode toggle (if needed)

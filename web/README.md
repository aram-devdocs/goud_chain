# Goud Chain React Dashboard

Modern React dashboard for Goud Chain blockchain, built with TypeScript, Vite, and TanStack Query.

## Quick Start

### One Command Setup

```bash
cd /workspace/web
./START_DEV.sh
```

This automatically starts:
- Backend nodes (node1, node2, node3) + nginx load balancer
- React dashboard on http://localhost:3001

### Manual Setup (Two Terminals)

**Terminal 1: Start backend**
```bash
cd /workspace
./run dev-perf
```

**Terminal 2: Start React dashboard**
```bash
cd /workspace/web
pnpm dev
```

**Open:** http://localhost:3001

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
- **Turborepo 2.5** - Monorepo orchestration
- **pnpm 9.15** - Fast package manager

## Available Scripts

```bash
# Development
pnpm dev              # Start Vite dev server (:3001)

# Building
pnpm build            # Build all packages + apps for production
pnpm build:dashboard  # Build only dashboard app

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
pnpm format           # Run Prettier (fix mode)
pnpm format:check     # Check formatting (CI mode)

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

## API Integration

### Base URL Configuration

Development uses **direct API calls** to avoid Vite proxy complexity:

```typescript
// packages/hooks/src/config.ts
export const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8080'      // Direct to nginx load balancer
    : window.location.origin        // Production (nginx proxies)
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

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/account/create` | POST | No | Generate API key |
| `/account/login` | POST | No | Get session token |
| `/data/submit` | POST | Yes | Submit encrypted data |
| `/data/list` | GET | Yes | List collections |
| `/data/decrypt/{id}` | POST | Yes | Decrypt data |
| `/chain` | GET | Yes | Get chain info |
| `/stats` | GET | Yes | Get blockchain stats |

## Port Configuration

| Service | Port | Notes |
|---------|------|-------|
| React Dashboard | 3001 | Changed from 3000 (conflict with old dashboard) |
| Nginx Load Balancer | 8080 | Primary API endpoint |
| Node 1 | 8081 | Direct node access (debugging) |
| Node 2 | 8082 | Direct node access (debugging) |
| Node 3 | 8083 | Direct node access (debugging) |
| Jupyter Lab | 8888 | API testing notebooks |

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
cd /workspace
./run stop
./run dev-perf
```

### Dashboard stuck on loading

1. Open DevTools → Console
2. Check for errors
3. Common issues:
   - **401 Unauthorized:** Clear localStorage and login again
   - **404 Not Found:** Backend not running
   - **CORS errors:** Wrong API_BASE (should be `localhost:8080`)

```javascript
// Clear auth and reload
localStorage.clear()
location.reload()
```

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

**In Progress:**
- 🚧 TanStack Router integration
- 🚧 WebSocket real-time updates
- 🚧 Comprehensive test coverage
- 🚧 Error boundaries
- 🚧 Loading states improvements

**Planned:**
- 📋 Audit logs viewer
- 📋 Metrics dashboard
- 📋 Data management (decrypt, download)
- 📋 Settings page
- 📋 Dark mode toggle (if needed)

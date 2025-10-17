# React Dashboard Development Setup

## Problem

The Docker setup serves a containerized dashboard on port 3000, which conflicts with Vite's dev server (also port 3000).

## Solution

Run backend nodes in Docker, React app on host.

## Quick Start

### 1. Start Backend Nodes (Without Dashboard)

```bash
cd /workspace

# Start nodes, nginx, jupyter (NO dashboard container)
docker-compose -f docker-compose.local.yml \
  -f docker-compose.local.dev.yml \
  -f docker-compose.local.dev-react.yml \
  up -d
```

**What this does:**

- ✅ Starts node1 on `:8081`
- ✅ Starts node2 on `:8082`
- ✅ Starts node3 on `:8083`
- ✅ Starts nginx load balancer on `:8080`
- ✅ Starts Jupyter on `:8888`
- ❌ **SKIPS** dashboard container (frees port 3000)

### 2. Start React Dashboard

```bash
cd /workspace/web
pnpm dev
```

**Opens on:** http://localhost:3001 ✅ (changed from 3000 to avoid conflict)

## Verify Everything Works

**Backend health checks:**

```bash
curl http://localhost:8080/health  # Nginx load balancer
curl http://localhost:8081/health  # Node 1
curl http://localhost:8082/health  # Node 2
curl http://localhost:8083/health  # Node 3
```

**Frontend:**

- Open http://localhost:3001
- Generate API key
- Check confirmation box
- Click "Continue to Dashboard"
- Should see blockchain stats ✅

## Architecture

```
┌─────────────────────────────────────────────┐
│ Host Machine                                │
│                                             │
│  ┌─────────────────┐                       │
│  │ React Dashboard │ :3001 (pnpm dev)      │
│  │ (Vite dev server)                       │
│  └────────┬────────┘                       │
│           │                                 │
│           │ API calls to localhost:8080    │
│           ▼                                 │
│  ┌──────────────────────────────────────┐  │
│  │ Docker Containers                    │  │
│  │                                      │  │
│  │  ┌───────┐                           │  │
│  │  │ nginx │ :8080 (load balancer)     │  │
│  │  └───┬───┘                           │  │
│  │      │                               │  │
│  │      ├──► node1 :8081                │  │
│  │      ├──► node2 :8082                │  │
│  │      └──► node3 :8083                │  │
│  │                                      │  │
│  │  Jupyter :8888                       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Why Port 3001?

Changed from 3000 to 3001 because:

- Docker dashboard service (when enabled) uses `:3000`
- Old `dashboard/index.html` also used `:3000`
- Vite dev server would fail with "port already in use"

**Solution:** New React app runs on `:3001` (no conflicts) ✅

## Troubleshooting

### "Port 3000 already in use"

**Cause:** Dashboard container is still running.

**Fix:**

```bash
docker stop dashboard  # Stop old dashboard
docker rm dashboard    # Remove it

# Or restart everything with the React override:
./run stop
docker-compose -f docker-compose.local.yml \
  -f docker-compose.local.dev.yml \
  -f docker-compose.local.dev-react.yml \
  up -d
```

### "Dashboard stays on login screen after clicking Continue"

**Cause:** One of the type/auth fixes didn't apply.

**Fix:**

```bash
cd /workspace
git pull  # Get latest fixes

cd web
pnpm install  # Update dependencies
pnpm dev      # Restart dev server
```

**Check browser console for:**

```
[useAuth] stored in localStorage: { session_token: '...', user_id: '...' }
                                                           ^^^^^^^^
If this shows 'undefined', the fix didn't apply. Hard refresh (Cmd+Shift+R).
```

### "API calls return 404 or CORS errors"

**Cause:** Backend nodes aren't running.

**Fix:**

```bash
# Check backend health
curl http://localhost:8080/health

# If that fails, restart nodes:
cd /workspace
./run start
```

### "Dashboard shows loading spinner forever"

**Cause:** API queries are failing (401 Unauthorized or network error).

**Fix:**

1. Open browser DevTools → Network tab
2. Look for failed requests to `/stats`, `/chain`, `/data/list`
3. Check response:
   - **401:** Auth token issue → Clear localStorage and login again
   - **404:** Backend not running → Run `./run start`
   - **CORS:** Wrong API_BASE → Should be `http://localhost:8080`

## Production Build

To build the containerized dashboard:

```bash
cd /workspace/web
pnpm build  # Creates dist/ folder

# Build Docker image
docker build -t goud-chain-dashboard:latest -f Dockerfile .

# Run with dashboard container (production mode)
docker-compose -f docker-compose.local.yml up -d
# Dashboard available at http://localhost:3000
```

## Directories Explained

- **`/workspace/dashboard/`** - OLD Alpine.js dashboard (single-file, deprecated)
- **`/workspace/web/`** - NEW React dashboard (monorepo, active development)
- **`/workspace/web/apps/dashboard/`** - Main React app
- **`/workspace/web/packages/`** - Shared packages (types, utils, hooks, UI)

## Scripts Reference

```bash
# From /workspace
./run start      # Start all containers (including dashboard)
./run stop       # Stop all containers
./run clean      # Remove all data and containers

# From /workspace/web
pnpm dev         # Start Vite dev server (:3001)
pnpm build       # Build production bundle
pnpm lint        # Run ESLint
pnpm type-check  # Run TypeScript compiler
pnpm format      # Run Prettier
pnpm test        # Run tests (when implemented)
```

## Next Steps

Once development is complete:

1. Run `pnpm build` to create production bundle
2. Update `docker-compose.local.yml` to use new dashboard
3. Remove old `/workspace/dashboard/` directory
4. Update nginx config if needed
5. Test containerized deployment

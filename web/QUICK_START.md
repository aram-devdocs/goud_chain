# Quick Start Guide

## The Problem You Had

**Error:** "Dashboard hosted at 3000 in containers, but new dashboard app isn't loading"

**Root Cause:** Docker was serving the OLD dashboard on port 3000, blocking the NEW React dashboard's Vite dev server (which also wanted port 3000).

## The Solution

We now run backend nodes in Docker, React dashboard on your host machine using **port 3001**.

---

## Start Development Environment

### Option 1: One Command (Recommended)

```bash
cd /workspace
git pull  # Get latest fixes

cd web
./START_DEV.sh
```

This automatically:
- Stops old containers
- Starts backend (nodes + nginx) WITHOUT dashboard container
- Starts React dashboard on **http://localhost:3001**

### Option 2: Manual Setup

```bash
# Terminal 1: Start backend nodes
cd /workspace
docker-compose -f docker-compose.local.yml \
  -f docker-compose.local.dev.yml \
  -f docker-compose.local.dev-react.yml \
  up -d

# Terminal 2: Start React dashboard
cd /workspace/web
pnpm dev
```

---

## Test the Complete Flow

1. **Open:** http://localhost:3001 (note the new port!)

2. **Create Account:**
   - Click "Create Account" tab
   - Click "Generate API Key" (no username needed)
   - Copy the generated API key

3. **Login:**
   - Check "I have saved my API key" checkbox
   - Click "Continue to Dashboard"

4. **See Dashboard:**
   - Should show blockchain stats
   - Chain length, collections, peer count
   - All tabs working

---

## Verify Backend Health

```bash
curl http://localhost:8080/health  # Nginx load balancer
curl http://localhost:8081/health  # Node 1
curl http://localhost:8082/health  # Node 2
curl http://localhost:8083/health  # Node 3
```

All should return `200 OK`.

---

## Architecture

```
┌─────────────────────────────────┐
│ Your Browser                    │
│ http://localhost:3001           │ ← NEW PORT (not 3000)
└──────────┬──────────────────────┘
           │
           │ API calls
           ▼
┌─────────────────────────────────┐
│ Vite Dev Server (Host)          │
│ :3001                            │
└──────────┬──────────────────────┘
           │
           │ Proxies API to :8080
           ▼
┌─────────────────────────────────┐
│ Docker Containers               │
│                                 │
│  ┌─────────┐                    │
│  │  nginx  │ :8080              │
│  │  (LB)   │                    │
│  └────┬────┘                    │
│       │                         │
│       ├──► node1 :8081          │
│       ├──► node2 :8082          │
│       └──► node3 :8083          │
│                                 │
│  Jupyter :8888                  │
│                                 │
└─────────────────────────────────┘
```

**Key Points:**
- ✅ Backend nodes run in Docker (8080-8083)
- ✅ React dashboard runs on host (3001)
- ✅ No port conflicts
- ✅ All API calls go through nginx load balancer (:8080)

---

## Troubleshooting

### "Address already in use :3001"

**Cause:** Vite dev server already running.

**Fix:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or just restart
cd /workspace/web
pnpm dev
```

### "Cannot connect to localhost:8080"

**Cause:** Backend nodes not running.

**Fix:**
```bash
cd /workspace
docker-compose -f docker-compose.local.yml \
  -f docker-compose.local.dev.yml \
  -f docker-compose.local.dev-react.yml \
  up -d

# Wait 10 seconds, then check:
curl http://localhost:8080/health
```

### "Dashboard shows loading spinner forever"

**Cause:** Auth token issue or API failing.

**Fix:**
1. Open DevTools → Console
2. Look for errors
3. Check Network tab for failed requests
4. If you see 401 errors:
   ```javascript
   // Clear storage and try again
   localStorage.clear()
   location.reload()
   ```

### "Still seeing old dashboard on port 3000"

**Cause:** Docker dashboard container still running.

**Fix:**
```bash
docker stop dashboard
docker rm dashboard

# Verify nothing on 3000:
curl http://localhost:3000  # Should fail with "Connection refused"
```

---

## What Changed

### Before (Broken)
- Docker served OLD dashboard on port 3000
- Vite wanted to use port 3000
- **Port conflict = nothing worked**

### After (Fixed)
- Docker runs ONLY backend nodes (no dashboard container)
- React dashboard runs on **port 3001** (no conflict)
- Everything works ✅

---

## Files Created/Modified

**New files:**
- `docker-compose.local.dev-react.yml` - Disables dashboard container
- `web/START_DEV.sh` - One-command startup script
- `web/DEVELOPMENT_SETUP.md` - Detailed dev guide
- `web/QUICK_START.md` - This file

**Modified files:**
- `web/apps/dashboard/vite.config.ts` - Port 3000 → 3001
- `web/packages/types/src/api.ts` - Fixed LoginResponse type
- `web/packages/hooks/src/useAuth.ts` - Store account_id correctly
- `web/packages/hooks/src/api/*.ts` - Added auth headers
- `web/apps/dashboard/src/pages/dashboard.tsx` - Added null checks

**All fixes committed and pushed to branch:**  
`cursor/GC-173-migrate-dashboard-to-react-monorepo-a45e`

---

## Next Steps

1. **Pull latest changes:** `git pull`
2. **Start dev environment:** `cd /workspace/web && ./START_DEV.sh`
3. **Open browser:** http://localhost:3001
4. **Test complete flow:** Create account → Login → Dashboard
5. **Report back:** Does everything work now?

---

## Still Having Issues?

Share the output of:

```bash
# Backend health
curl -v http://localhost:8080/health

# What's running on ports
netstat -tuln | grep -E ":(3001|8080|8081|8082|8083)"

# Docker containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Browser console logs
# (Open DevTools → Console, screenshot any errors)
```

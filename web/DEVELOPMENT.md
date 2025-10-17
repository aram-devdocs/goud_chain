# Development Setup

## Quick Start

**Prerequisites:**
- Backend must be running on `http://localhost:8080`
- Node.js 18+ and pnpm 9.15+

**Start Backend:**
```bash
cd /workspace
./run start
```

**Start Frontend:**
```bash
cd /workspace/web
pnpm dev
```

Go to **http://localhost:3000**

## How It Works

### API Configuration

The frontend uses `API_BASE` to determine the API endpoint:

```typescript
// web/packages/hooks/src/config.ts
export const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8080'  // ← Development
    : window.location.origin     // ← Production (nginx proxies)
```

**Development:** Direct calls to `http://localhost:8080` (no proxy)  
**Production:** Same origin, nginx routes `/api/*` to backend

### Why No Proxy in Development?

The original `dashboard/auth.html` called `localhost:8080` directly. Using Vite's proxy adds complexity and can cause 502 errors if not configured perfectly. Direct calls are simpler and match the original behavior.

### Authentication Flow

1. **Create Account**: Generates API key (no username required)
2. **Login**: Enter API key
3. **Session**: Stored in localStorage (1 hour expiry)

## Troubleshooting

### 502 Bad Gateway

**Cause:** Backend not running on port 8080  
**Fix:** `cd /workspace && ./run start`

### Username Field Showing

**Cause:** Browser cache has old code  
**Fix:** Hard refresh (`Ctrl+Shift+R`) + clear cache

### API 404 Errors

**Cause:** Backend not started or wrong port  
**Fix:** Ensure backend is on `http://localhost:8080/health`

### Build Errors

**Status:** TypeScript workspace resolution issues (known)  
**Workaround:** Use `pnpm dev` for development (doesn't need build)

## Available Commands

```bash
pnpm dev         # Start dev server (port 3000)
pnpm build       # Build for production (has issues, WIP)
pnpm format      # Format code with Prettier  
pnpm format:check # Check formatting
pnpm type-check  # TypeScript type checking (has issues, WIP)
```

## Production Build

Production uses nginx to serve static files and proxy API:

```nginx
location /api/ {
    proxy_pass http://blockchain_nodes/;
}

location / {
    try_files $uri /index.html;  # SPA fallback
}
```

No proxy needed - same origin handles everything.

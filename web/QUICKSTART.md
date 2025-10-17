# Quick Start Guide

## Prerequisites

- Node.js 22+ (using nvm)
- pnpm 9.15.0+ (comes with Node via corepack)
- Docker & Docker Compose (for backend)

## Local Development

### 1. Install Dependencies

```bash
cd web
pnpm install
```

### 2. Start Rust Backend

In a separate terminal:

```bash
# From project root
./run start local

# Or manually:
docker-compose -f docker-compose.local.yml up -d
```

This starts:
- 3 blockchain nodes (localhost:8081, 8082, 8083)
- Nginx load balancer (localhost:8080)
- Legacy dashboard (localhost:3000) - will be replaced

### 3. Start React Dashboard (Development)

```bash
cd web
pnpm dev
```

Opens at `http://localhost:3000` with:
- Hot Module Replacement (HMR)
- API proxy to backend (`:3000/api` → `:8080/api`)
- WebSocket proxy (`:3000/ws` → `:8080/ws`)

### 4. Build for Production

```bash
cd web
pnpm build
```

Builds all packages and creates optimized production bundle in `apps/dashboard/dist/`.

## Using the Dashboard

### Create Account
1. Click "Create Account"
2. Enter username
3. Save the API key (SHA-256 hex string)
4. Switch to "Login" tab
5. Paste API key and login

### Submit Encrypted Data
1. Navigate to "Submit Data"
2. Enter collection ID (e.g., `medical_records`)
3. Enter data (will be encrypted client-side)
4. Click "Submit Data"

### View Collections
Navigate to "Collections" to see all your encrypted collections.

### Explore Blockchain
Navigate to "Blockchain" to view chain info and latest block details.

## Docker Deployment

### Build Dashboard Image

```bash
cd web
docker build -t goud-chain-dashboard .
```

### Run Dashboard Container

```bash
docker run -p 3000:80 goud-chain-dashboard
```

Dashboard available at `http://localhost:3000`

### Full Stack Deployment

```bash
# From project root
docker-compose -f docker-compose.local.yml up -d --build

# Services:
# - dashboard: localhost:3000 (React app)
# - nginx: localhost:8080 (API gateway)
# - node1: localhost:8081 (blockchain node)
# - node2: localhost:8082 (blockchain node)
# - node3: localhost:8083 (blockchain node)
```

## Development Scripts

```bash
pnpm dev          # Start dev server (all apps)
pnpm build        # Build all packages + apps
pnpm type-check   # TypeScript validation
pnpm lint         # Lint all packages (future)
pnpm format       # Format code with Prettier
pnpm clean        # Clean build artifacts
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
cd web/apps/dashboard
PORT=3001 pnpm dev
```

### API Connection Failed
Ensure backend is running:
```bash
docker-compose -f docker-compose.local.yml ps
curl http://localhost:8080/health
```

### Build Fails
Clear cache and reinstall:
```bash
cd web
rm -rf node_modules .turbo **/node_modules
pnpm install
pnpm build
```

### TypeScript Errors
```bash
cd web
pnpm type-check  # Check all packages
```

## Project Structure

```
web/
├── apps/
│   └── dashboard/          # Main React app
│       ├── src/
│       │   ├── pages/      # Route pages
│       │   ├── App.tsx     # Root component
│       │   └── main.tsx    # Entry point
│       ├── index.html      # Vite entry
│       └── vite.config.ts  # Vite config
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── hooks/              # React hooks
│   ├── utils/              # Utilities
│   ├── types/              # TypeScript types
│   └── config/             # Shared configs
├── package.json            # Workspace root
├── pnpm-workspace.yaml     # pnpm config
└── turbo.json              # Turborepo config
```

## Environment Variables

### Development
No env vars needed - defaults configured in Vite.

### Production
Set in Docker Compose or nginx config:
- API backend URL (proxied via nginx)
- WebSocket URL (proxied via nginx)

## Testing Workflow

1. **Create Account**: Generates API key
2. **Login**: Authenticate with API key
3. **Submit Data**: Encrypt and store on blockchain
4. **View Collections**: See all encrypted collections
5. **Explore Chain**: View blocks and chain state
6. **Check Audit Logs**: View security events
7. **Monitor Metrics**: Real-time system stats

## API Endpoints (Proxied)

All requests to `/api/*` are proxied to the backend:

```bash
# Health check
curl http://localhost:3000/api/health

# Create account
curl -X POST http://localhost:3000/api/account/create \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'

# Login
curl -X POST http://localhost:3000/api/account/login \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_API_KEY"}'
```

## Next Steps

1. **GC-175**: Replace manual hooks with OpenAPI-generated client
2. **GC-174**: Add Storybook for component documentation
3. **GC-176**: Implement E2E tests with Playwright
4. **GC-183**: Optimize WebSocket vs REST usage

## Resources

- [Vite Documentation](https://vite.dev)
- [React Documentation](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [Turborepo Documentation](https://turbo.build)
- [pnpm Documentation](https://pnpm.io)
- [Tailwind CSS](https://tailwindcss.com)

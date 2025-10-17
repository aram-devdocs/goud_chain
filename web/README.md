# Goud Chain Web Monorepo

Modern React-based dashboard for Goud Chain blockchain platform.

## Structure

```
web/
├── apps/
│   └── dashboard/          # Main dashboard application (Vite + React + TanStack)
├── packages/
│   ├── ui/                 # Atomic design system components
│   ├── hooks/              # Shared React hooks (manual API hooks)
│   ├── utils/              # Pure utility functions
│   ├── types/              # TypeScript type definitions
│   └── config/             # Shared configuration packages
│       ├── typescript-config/
│       ├── eslint-config/
│       └── tailwind-config/
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server (dashboard on :3000, proxies API to :8080)
pnpm dev

# Build all packages and apps
pnpm build

# Type check
pnpm type-check

# Format code
pnpm format
```

## Architecture

- **Turborepo**: Monorepo orchestration with intelligent caching
- **pnpm**: Fast, disk-efficient package manager
- **Vite**: Lightning-fast dev server and production bundler
- **React 19**: Modern UI framework
- **TypeScript 5.7**: Strict type safety
- **TanStack Query**: Declarative data fetching and caching
- **Tailwind CSS**: Utility-first styling

## Migration from Alpine.js

This monorepo replaces the legacy `dashboard/index.html` (2,201 lines) with:

- Modular React components
- Type-safe API integration (manual hooks, will be replaced by GC-175)
- Proper separation of concerns
- Scalable architecture for multiple apps

## API Integration

The dashboard proxies API requests to the Rust backend:

- Development: `http://localhost:3000` → `http://localhost:8080`
- Production: Nginx serves static files and proxies `/api` to backend nodes

Manual API hooks in `packages/hooks/src/api/` will be replaced by OpenAPI-generated
type-safe client in GC-175.

## Deployment

Built dashboard is served via nginx in Docker:

```bash
# Build Docker image
docker build -t goud-chain-dashboard .

# Run container
docker run -p 80:80 goud-chain-dashboard
```

See `web/Dockerfile` and `web/nginx.conf` for production configuration.

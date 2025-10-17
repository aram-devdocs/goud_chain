# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy package.json files for all workspaces (cached until dependencies change)
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY packages/config/tailwind-config/package.json ./packages/config/tailwind-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY apps/dashboard/package.json ./apps/dashboard/

# Install dependencies (cached until package.json or lock file changes)
RUN pnpm install --frozen-lockfile

# Copy source files and config
COPY packages ./packages
COPY apps ./apps

# Build all packages and apps
RUN pnpm build

# Production stage - nginx to serve static files
FROM nginx:alpine

# Copy built dashboard
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

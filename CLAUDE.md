# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goud Chain is an encrypted blockchain with API key-based authentication using Proof of Authority (PoA) consensus. This is a proof-of-concept project demonstrating encrypted data storage on an immutable distributed ledger with high-performance RocksDB persistence.

**Core Technologies:**
- Rust for blockchain implementation
- RocksDB for high-performance block storage (embedded key-value database)
- AES-256-GCM for symmetric encryption
- Ed25519 for digital signatures
- SHA-256 for hashing (blocks, Merkle trees, API key derivation)
- Docker Compose for multi-node deployment

## Development Commands

Use `cargo` for build/test, `./run` script for network management (dev/start/stop/clean/logs).

## Coding Principles

### Rust Best Practices

**Ownership & Borrowing:**
- Prefer borrowing (`&T`) over cloning unless ownership transfer is necessary
- Use `Arc<Mutex<T>>` for shared mutable state across threads
- Avoid unnecessary `.clone()` calls in hot paths

**Error Handling:**
- Return `Result<T, E>` for recoverable errors
- Use `Option<T>` for optional values, especially in cryptographic operations
- Avoid `.unwrap()` in production code paths; use proper error propagation
- Use `.expect()` with descriptive messages only when failure is truly impossible

**Type Safety:**
- Leverage Rust's type system to make invalid states unrepresentable
- Use newtype patterns for domain-specific types (e.g., `BlockHash`, `DataId`)
- Prefer `&str` for borrowed strings, `String` for owned

**Concurrency:**
- Use message passing (channels) over shared state when possible
- Keep mutex lock guards short-lived to avoid contention
- Spawn background threads for P2P networking and block creation

### Code Organization

**Layered Architecture:**
Strict 6-layer unidirectional dependency hierarchy enforces separation of concerns. Dependencies flow from higher to lower layers only (Presentation → Infrastructure → Persistence → Business Logic → Utilities → Foundation). Foundation layer has zero internal dependencies. Automated tests detect circular dependencies via pre-commit hooks and block violating commits.

**Layer Responsibilities:**
- **Layer 0 (Foundation):** Constants, type definitions, errors (no dependencies, affects all layers)
- **Layer 1 (Utilities):** Crypto, configuration management (pure functions, reusable across project)
- **Layer 2 (Business Logic):** Domain models, validation, consensus (blockchain core, independent of storage/network)
- **Layer 3 (Persistence):** RocksDB storage, serialization (incremental writes, O(1) reads, Bincode format)
- **Layer 4 (Infrastructure):** P2P networking, external integrations (validates data from network)
- **Layer 5 (Presentation):** HTTP API, interfaces (orchestrates all layers, no business logic)

**Key Principles:**
- All magic numbers/strings centralized in constants module
- Template-based configuration prevents environment drift (pre-commit hook enforces regeneration)
- Atomic blockchain state changes (add block + clear pending data together)
- Module dependency graph auto-generates on commit (visual architecture validation)
- OpenAPI documentation auto-generated from Rust types (single source of truth, compile-time validation)

### Blockchain-Specific Principles

**Immutability:** Append-only chain, deterministic validation, no modifications post-commit.

**Consensus:** Proof of Authority with deterministic validator selection, instant block creation, longest valid chain wins.

**Validation:** Full data validation at ingestion and peer sync (signatures, hashes, Merkle roots, validator authorization).

**State Management:** Separate pending from committed data, clear in-memory/persistent boundaries, graceful chain reorganization.

**Storage Architecture:** RocksDB with incremental O(1) writes, Snappy compression (~50% reduction), Bincode serialization. Schema uses block/metadata/checkpoint namespaces. Immediate block persistence, checkpoints every 100 blocks.

### Security Best Practices

**Secret Management:** JWT/Session secrets in GitHub Secrets, injected at Docker build time. Rotation via scripts (90-day schedule), invalidates sessions but preserves user data (encrypted with API keys, not session secrets).

**Cryptography:** Use audited crates only, constant-time comparisons, authenticated encryption (AES-GCM), HKDF key derivation with salts.

**Input Validation:** Sanitize all external input, validate JSON structure, size limits for DoS prevention, signature verification before processing.

**Testing Strategy:** Unit tests for crypto/signatures/Merkle trees, integration tests for consensus/sync/partitions, property-based testing for invariants, security tests with malformed input.

### Performance Considerations

Correctness first, profile before optimizing. Hot paths: hashing, signature verification, chain validation. Scaling: pagination, caching (Merkle roots), async I/O for P2P.

## Architecture Philosophy

Proof-of-concept priorities: Clarity over cleverness, simplicity over features, security over convenience, flexibility over optimization. Code is modular and well-tested for rapid iteration.

## DevOps & Infrastructure

**Load Balancer:** Reverse proxy provides single entry point, automatic failover, health checks. Round-robin for reads, least-connections for writes. Supports transparent node maintenance.

**Deployment:** Containerized services (Docker Compose), internal P2P network, persistent volumes. Horizontal scaling (add nodes) and vertical scaling (increase resources).

**Monitoring:** Health checks (load balancer + node state), metrics (request rate, chain length, peer count, resource usage).

**Blockchain State:** Append-only immutable data, P2P gossip sync, eventual consistency (longest valid chain wins), checkpoints prevent deep reorganizations.

**Security:** Network segmentation (public load balancer, internal P2P), input validation at edge, rate limiting, audited crypto libraries.

## Configuration Management

Template-based system eliminates duplication and prevents environment drift. Base constants with environment-specific overrides, variable substitution in templates, pre-commit hook auto-regeneration. Never edit generated nginx/docker-compose files directly (marked with warnings). Single source of truth prevents configuration sprawl and merge conflicts.

## Issue and PR Templates

Professional templates enforce structured, architecture-focused documentation for Linear issues, GitHub issues, and pull requests. Templates are located in `.claude/templates/` and `.github/` directories.

**Linear Templates:**
- `.claude/templates/linear/issue-template.md` - Issue format with architecture layers, testing strategy, acceptance criteria
- `.claude/templates/linear/project-template.md` - Project format with work breakdown, risk assessment, success metrics
- Templates integrated into `.claude/agents/linear-ticket-scoper.md` for automated enforcement

**GitHub Templates:**
- `.github/ISSUE_TEMPLATE/bug_report.md` - Bug reports with environment, reproduction, impact analysis
- `.github/ISSUE_TEMPLATE/feature_request.md` - Feature requests with technical considerations, integration points
- `.github/ISSUE_TEMPLATE/performance.md` - Performance issues with profiling data, hot path analysis
- `.github/ISSUE_TEMPLATE/security.md` - Security vulnerabilities with severity classification, remediation strategy
- `.github/PULL_REQUEST_TEMPLATE.md` - PR format with testing performed, code quality checks, deployment considerations

**Git Commit Conventions:**
- `.claude/templates/git/commit-message-guide.md` - Commit message standards, format rules, examples
- `.claude/templates/git/commit-types.md` - Type taxonomy (feat, fix, refactor, perf, test, docs, chore, security, style, ci, build, revert)

**Template Principles:**
- Architecture-focused: Reference 6-layer system, not specific files
- System-aware: Account for blockchain/PoA, cryptography, RocksDB, infrastructure
- Professional tone: No emojis, no filler, technical precision
- Enforcement: GitHub templates via UI, Linear templates via agent, git commits via optional hook

See `.claude/templates/README.md` for comprehensive template documentation.

## Operational Security & Observability

**Audit Logging:** Blockchain-native storage (encrypted collections), privacy-preserving (per-user encryption, IP hashing), batched for efficiency (10s or 50 events), immutable and tamper-proof, non-blocking (fail-open design). Events: account creation/login, data submit/decrypt/list. Query performance: O(n) scan with pagination.

**System Metrics:** Real-time monitoring via API endpoint. Metrics: chain statistics (length, latest block), network health (peer count), performance (cache hit rates, operations total). Prometheus-compatible for Grafana dashboards.

**WebSocket Real-time Updates:** Bidirectional communication for live event streaming. Event types: blockchain updates, collection creation, peer changes, audit logs, metrics. Sticky session routing via nginx hash-based load balancing. Client auto-reconnect with exponential backoff, graceful degradation to polling.

## API Documentation Architecture

**OpenAPI 3.1 Integration:** Type-safe, auto-generated API documentation using utoipa and utoipa-axum crates.

**Design Principles:**
- **Single Source of Truth:** API schemas derive directly from Rust types via `#[derive(ToSchema)]`
- **Compile-time Validation:** Invalid schemas cause build failures (impossible to deploy broken docs)
- **Route Organization:** Domain-driven modules (account, data, health, metrics, audit) for clean separation
- **Type Safety:** `OpenApiRouter` enforces schema consistency between handlers and documentation
- **Zero Runtime Overhead:** All OpenAPI generation happens at compile time

**Documentation Stack:**
- **utoipa 5.4** - Rust → OpenAPI schema derivation with procedural macros
- **utoipa-axum 0.2** - Axum framework integration with `routes!()` macro
- **RapiDoc UI** - Embedded documentation viewer (CDN-hosted, zero build dependencies)
- **OpenAPI JSON** - Standard spec export for SDK generation and tooling integration

**Route Architecture:**
```
src/api/
├── mod.rs           # OpenAPI info, servers, security schemes, tags
├── schemas.rs       # All request/response types with ToSchema derives
└── routes/          # Domain-organized route modules
    ├── account.rs   # POST /account/create, /account/login
    ├── data.rs      # POST /data/submit, GET /data/list, POST /data/decrypt/{id}
    ├── health.rs    # GET /health, /chain, /peers, /sync, /validator/current
    ├── metrics.rs   # GET /stats, /metrics, /metrics/prometheus
    └── audit.rs     # GET /api/audit (with query filters)
```

**Documentation Standards:**
- All endpoints have example requests/responses with realistic data
- Security requirements explicitly defined per endpoint (api_key vs bearer_token)
- Rate limit headers documented in response specifications
- WebSocket protocol documented in API info description
- Session token expiry: 1 hour (constants.rs enforces consistency)
- Server URLs environment-aware (localhost:8080-8083 for local, production URLs for GCP)

**Adding New Endpoints:**
1. Define request/response types in `schemas.rs` with `#[derive(ToSchema)]`
2. Create handler function with `#[utoipa::path]` annotation
3. Add to appropriate route module with `routes!(handler_name)`
4. Documentation automatically updates on next build

# AI Coding Standards

## Quality Control Rules

**Mandatory Requirements:**
- NEVER use `--no-verify` flag - all commits MUST pass tests
- NO unused code - delete legacy/dead code immediately
- NO `#[allow(dead_code)]` annotations - fix or remove
- ALL pre-commit hooks MUST pass before committing
- Code must compile with `cargo clippy -- -D warnings` (zero tolerance)

**Code Hygiene:**
- Remove commented-out code blocks
- Delete unused imports and dependencies
- Clean up test/debug code before committing
- No placeholder or TODO comments in production code

## Communication Protocol

Prohibited: emojis, AI filler phrases, legacy code references, speculative features, conversational error messages.

Required: technical precision, declarative statements, professional tone, concise rationale.

Examples:
- Incorrect: "Great! Let's add a new feature."
- Correct: "Add feature X. Implements Y protocol for Z use case."
- Incorrect: "Oops! Something went wrong."
- Correct: "Request failed: Invalid authentication token"

## Git Commit Standards

Follow conventions in `.claude/templates/git/commit-message-guide.md`:

**Format:**
```
<type>: <subject>

<body>
```

**Types:** feat, fix, refactor, perf, test, docs, chore, security, style, ci, build, revert

**Subject Rules:**
- Start with lowercase (except proper nouns)
- Maximum 72 characters
- No period at end
- Imperative mood: "add" not "added", "fix" not "fixed"

**Body Rules (optional):**
- Separate from subject with blank line
- Wrap at 72 characters
- Explain what and why, not how
- Use bullet points for multiple changes
- Include breaking changes, migration steps, notable impacts

**Examples:**
```
feat: implement blind index queries for encrypted collections

- Add HMAC-based searchable encryption using per-user and per-block salts
- Enable O(n) collection lookups without exposing API key hashes
- Prevent cross-block correlation attacks
```

```
fix: resolve P2P deadlock during chain synchronization
```

See `.claude/templates/git/commit-types.md` for detailed type taxonomy and decision tree.

## Visual Design

Minimalist aesthetic with high information density and purposeful whitespace.

Colors: zinc-950 to zinc-100 grayscale. Semantic accents: blue-500 (primary), green-500 (success), red-500 (error), yellow-500 (warning). Functional gradients only.

Typography: clear hierarchy with large bold headers, medium subheaders, small body text. Monospace for technical data.

Components: `rounded-lg border border-zinc-800 bg-zinc-950` (cards), white/zinc-800/semantic (buttons), `bg-zinc-900 border-zinc-700 focus:border-white` (inputs), zebra striping (tables). Borders only, no shadows.

Interactions: immediate feedback, skeleton loaders, actionable empty states, progressive disclosure, functional transitions only.

Hierarchy: critical information large and top-left, supporting details muted and contextual, metadata small monospace.

Accessibility: high contrast (zinc-100 on zinc-950), keyboard navigation, clear focus indicators, descriptive errors.

## Dashboard Standards

Real-time: toast notifications (3s dismiss), activity feed (last 50 items), live metrics with timestamps, visible WebSocket status.

Data: metrics show label/value/context/timestamp, tables show essential columns with expand, charts show trends without decoration, lists show recent first with pagination.

Navigation: tabs for sections, breadcrumbs for depth, quick actions for workflows, search for datasets.

Performance: skeleton loaders, optimistic updates, debounced search, virtualized lists.

## Frontend Design System

**Architecture:** Atomic design with design tokens, primitives, atoms, molecules, organisms, and templates. Single source of truth for all styling decisions.

**Design Tokens:**
- **Colors**: Zinc grayscale (50-950) + semantic colors (primary/success/error/warning) via `@goudchain/ui/tokens`
- **Typography**: Font scale (xs-4xl), weights (normal-bold), line heights (tight/normal/relaxed)
- **Spacing**: 4px base grid system (0-24 scale) for consistent rhythm
- **Breakpoints**: Mobile-first (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Radius**: Border radius scale (none to full) for rounded corners
- **Transitions**: Functional timing (fast: 150ms, normal: 250ms, slow: 350ms)

**Layout Primitives:**
- **Container**: Responsive container with max-width constraints and horizontal padding
- **Stack**: Vertical/horizontal layout with consistent spacing (replaces manual flex)
- **Flex**: Flexbox wrapper with comprehensive props (direction, align, justify, wrap, gap)
- **Grid**: CSS Grid with responsive columns (mobile-first breakpoint system)

**Component Library:**
- **Atoms**: Button, Input, Label, Spinner, Badge (smallest building blocks)
- **Molecules**: Card, Toast (combinations of atoms)
- **Organisms**: Header, Navigation, Tables, Charts, Dashboards (complex components)
- **Templates**: DashboardLayout, AuthLayout, PageContainer (page-level layouts)

**Storybook Integration:**
- Interactive component playground at `http://localhost:6006` (run `pnpm --filter @goudchain/ui storybook`)
- All components have stories demonstrating variants, states, and responsive behavior
- Accessibility testing via @storybook/addon-a11y
- Dark theme matching GoudChain aesthetic (zinc-950 background)

**Development Workflow:**
1. Import design tokens instead of hardcoding values: `import { colors, spacing } from '@goudchain/ui'`
2. Use layout primitives for consistent spacing: `<Stack spacing={4}>` not `<div className="space-y-4">`
3. Compose pages from atomic components: `<Card><CardHeader><CardTitle>` not raw HTML
4. Test components in isolation via Storybook before integrating into pages
5. Tailwind classes should map to design tokens (enforced by shared config)

**Type Safety:**
- Design token types in `@goudchain/types/design.ts` (branded types prevent mixing)
- Component props strictly typed with TypeScript (compile-time validation)
- Enum-based variants: `ButtonVariant.Primary` not `"primary"` strings

**Accessibility Baseline:**
- ARIA labels on all interactive elements (buttons, inputs, links)
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators visible (focus:ring-2 focus:ring-white)
- Semantic HTML (`<button>` not `<div onClick>`, `<nav>` not `<div>`)
- High contrast colors (WCAG AA compliant: zinc-100 on zinc-950)

**Monorepo Structure:**
- `/web/packages/types` - Design token types (Layer 0: Foundation)
- `/web/packages/ui` - Component library + tokens (Layer 5: Presentation)
- `/web/packages/config/tailwind-config` - Shared Tailwind config generated from tokens
- `/web/apps/dashboard` - Dashboard application composing UI components

**Build System:**
- Turborepo for caching and parallel builds
- TypeScript strict mode enforced (no implicit any)
- Prettier for consistent formatting
- `pnpm validate` runs format check + type check + build (pre-commit requirement)

**Documentation:**
- `/web/packages/ui/README.md` - Comprehensive design system guide
- Storybook stories - Interactive component documentation with controls
- JSDoc comments - Type definitions and usage examples in code
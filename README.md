# Goud Chain

Encrypted blockchain with API key-based authentication. Store any JSON data on an immutable, distributed ledger using Proof of Authority consensus.

[![Platform Status](https://img.shields.io/badge/Platform-Live-brightgreen?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://dev.goudchain.com/)

## 🚀 Try the Live Demo

**Test the blockchain in action** - No installation required!

- **🌐 Platform:** [https://dev.goudchain.com](https://dev.goudchain.com) (Dashboard + API)
- **📡 API:** [https://dev.goudchain.com/health](https://dev.goudchain.com/health) (Direct endpoint)
- **📚 API Docs:** [https://dev.goudchain.com/rapidoc](https://dev.goudchain.com/rapidoc) (Interactive documentation)

**Quick Test:**
```bash
# Create account and get API key
curl -X POST https://dev.goudchain.com/account/create \
  -H "Content-Type: application/json" \
  -d '{"metadata": null}'

# Login with API key to get session token
curl -X POST https://dev.goudchain.com/account/login \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_API_KEY_HERE"}'

# Submit encrypted data (use session token or API key)
curl -X POST https://dev.goudchain.com/data/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"label": "test", "data": "{\"message\": \"Hello Blockchain!\"}"}'

# View the blockchain
curl https://dev.goudchain.com/chain
```

Or visit the [Dashboard](https://dev.goudchain.com/) to interact with the blockchain visually.

> **Note:** This is a proof-of-concept deployment running on GCP's free tier. Hosted on a 2-node network with load balancing.

## Features

### Performance & Storage
- **RocksDB Persistence** - High-performance embedded database with Snappy compression
- **Incremental Writes** - O(1) block writes (vs O(n) for full JSON serialization)
- **Fast Lookups** - O(1) block retrieval by index
- **50% Disk Space Savings** - Snappy compression reduces storage footprint
- **Schema Versioning** - Automatic validation and regeneration on schema changes
- **Persistent Volumes** - Docker volumes survive container restarts with automated backup/restore
- **Volume Monitoring** - Real-time disk usage, RocksDB health, and capacity alerts

### Blockchain & Consensus
- **No Mining** - Instant blocks (<1s) using Proof of Authority
- **Deterministic Validator Rotation** - Round-robin PoA consensus
- **Ed25519 Signatures** - Digital signatures for blockchain integrity
- **Merkle Trees** - Tamper detection with encrypted data and blind indexes

### Privacy & Security
- **Envelope Encryption** - Zero-knowledge storage architecture (node operators cannot decrypt user data)
- **Per-User + Per-Block Salted Blind Indexes** - Prevents cross-block correlation attacks
- **Timestamp Obfuscation** - Daily granularity with random jitter (±4 hours) hides timing and timezone
- **Dual-Salt HMAC Blind Indexes** - User salt + block salt prevent pattern analysis across blocks
- **Two-Tier HKDF Key Derivation** - OWASP-compliant security with optimized performance:
  - **Tier 1 (Authentication):** 100,000 iterations for API key hashing (brute-force resistance)
  - **Tier 2 (Encryption):** 1,000 iterations for encryption/MAC keys (domain separation)
- **API Key Authentication** - Cryptographically secure 256-bit keys
- **JWT Sessions** - Token-based authentication with 1-hour expiry
- **Request Signing** - HMAC-SHA256 signatures prevent replay attacks with 5-minute timestamp tolerance and 10-minute nonce window
- **Payload Size Limits** - 10MB per collection, 100MB per block, 100-character labels (prevents storage DoS)
- **Input Validation** - JSON schema validation with max depth limits and control character filtering (prevents injection attacks)
- **Constant-Time Comparisons** - `subtle` crate prevents timing attacks
- **Memory Protection** - Automatic key zeroization with 5-minute TTL and LRU cache
- **Graduated Rate Limiting** - 5-tier DoS protection (10 writes/sec, 100 reads/sec)
- **IP Banning** - 24-hour IP bans after 5th violation (complete blacklist)
- **Privacy-Preserving Enforcement** - IP addresses hashed before storage

### Infrastructure
- **Collection-Based Storage** - Group encrypted data by user account
- **Auto Schema Migration** - Seamless upgrades during development
- **Environment Variable Key Management** - Production-ready configuration
- **Load Balanced** - NGINX reverse proxy with health checks
- **Cloud-Native** - Runs on GCP free tier ($0/month)
- **DoS Protection** - 5-tier graduated rate limiting with IP banning

### Operational Security & Observability
- **Audit Logging** - Comprehensive audit trails stored on blockchain
  - All account and data operations logged (create, login, submit, decrypt, list)
  - Batched storage (10s intervals or 50 events) reduces blockchain bloat
  - Privacy-preserving: IP addresses hashed (truncated SHA-256)
  - Encrypted with user's API key (only account owner can view their logs)
  - Query API with time range, event type, and pagination filters
- **System Metrics** - Real-time performance monitoring via `/api/metrics` endpoint
  - Cache hit rates, operations per second, chain statistics
  - Prometheus-compatible metrics for external monitoring tools
  - Per-node health and status tracking
- **Dashboard Integration** - Visual audit log viewer with filtering and export
  - Real-time event streaming
  - Timeline visualization
  - CSV/JSON export capabilities

## Quick Start (Local Development)

```bash
./run start              # Production mode (release builds)
./run dev                # Hot reload (release builds - default)
./run dev --fast-build   # Hot reload (debug builds - fast iteration)
```

**Development Mode Options:**

- `./run dev` - Release builds: Slow rebuilds (~30-60s), fast runtime (~20-50ms blocks)
- `./run dev --fast-build` - Debug builds: Fast rebuilds (~5-10s), slow runtime (~4-10s blocks)

**Endpoints:**

- **Production (`./run start`):**
  - [API] http://localhost:8080 (Load Balancer)
  - [WEB] http://localhost:3000 (Dashboard - served via Docker/Nginx)
  - [NODES] http://localhost:8081, 8082, 8083 (debugging)

- **Development (`./run dev`):**
  - [API] http://localhost:8080 (Load Balancer)
  - [WEB] http://localhost:3000 (Dashboard - Docker/Nginx) OR http://localhost:3001 (Vite dev server with HMR)
  - [JUPYTER] http://localhost:8888
  - [NODES] http://localhost:8081, 8082, 8083 (debugging)

**Note:** In development, you can use either:
- Docker dashboard at :3000 (served via Nginx, matches production)
- Vite dev server at :3001 (hot module reload for faster frontend iteration)

## Architecture

### Local Development (3 nodes)

```
                    Developers
                        ↓
            ┌───────────────────────┐
            │  NGINX Load Balancer  │  ← Port 8080
            │  - Health checks      │
            │  - Failover           │
            │  - Request routing    │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    ┌───────┐      ┌───────┐      ┌───────┐
    │ node1 │◄────►│ node2 │◄────►│ node3 │
    │ :8081 │  P2P │ :8082 │  P2P │ :8083 │
    └───────┘      └───────┘      └───────┘
```

### GCP Production (2 nodes, single VM)

```
                 Cloudflare CDN
                 (HTTPS, Port 443)
                        ↓
                dev.goudchain.com
           (Dashboard + API endpoints)
                        ↓
        ┌───────────────────────────────┐
        │   GCP e2-micro VM (1GB RAM)   │
        │                               │
        │   ┌─────────────────┐         │
        │   │ NGINX (Port 80) │         │
        │   └────────┬─────────┘         │
        │            │                   │
        │    ┌───────┼───────┐           │
        │    ↓       ↓       ↓           │
        │  node1   node2  dashboard      │
        │  :8081   :8082   :3000         │
        │    ↕──P2P──↕                   │
        └───────────────────────────────┘
```

**Load Balancer Features:**
- Automatic failover to healthy nodes
- Health checks (monitors chain state and node availability)
- Intelligent routing:
  - **Read operations** (`GET /data/list`, `/chain`, `/peers`) → Round-robin
  - **Write operations** (`POST /data/submit`, `/data/decrypt`) → Least-connections
- Connection pooling for performance
- CORS support for browser access

### Data Flow

```
1. Account Creation → Generate 256-bit API Key → Hash with SHA-256 → Store on Blockchain
2. Authentication → API Key → JWT Session Token (1hr expiry)
3. Data Submission → JSON → Encrypt with API-derived key (HKDF) → HMAC → Sign (Ed25519) → Collection
4. Block Creation → Validator creates block → Encode envelopes (Base64) → Merkle Root → Blockchain
5. Data Retrieval → Decrypt envelope with API key → Decrypt collection → Verify HMAC → Return JSON
```

**Consensus:** Proof of Authority (PoA)
- Validators: `Validator_1`, `Validator_2`
- Deterministic round-robin rotation per block
- No mining, instant block creation

**Cryptography Architecture:**
- **Key Generation**: 256-bit random API keys (base64-encoded)
- **Key Storage**: SHA-256 hash stored on blockchain (not the key itself)
- **Key Derivation**: HKDF with 100k iterations produces:
  - Encryption key (32 bytes for AES-256)
  - MAC key (32 bytes for HMAC-SHA256)
- **Encryption**: AES-256-GCM with 12-byte random nonce
- **Integrity**: HMAC-SHA256 over encrypted payload
- **Authentication**: Constant-time comparison prevents timing attacks

**Block Structure:**
```rust
Block {
    index: u64,
    timestamp: i64,                   // Obfuscated to hourly granularity
    encrypted_block_data: String,     // All accounts + collections encrypted
    blind_indexes: Vec<String>,       // HMAC-based searchable indexes
    block_salt: String,               // Random salt per block (prevents correlation)
    validator_index: u64,             // Obfuscated validator identity
    previous_hash: String,
    merkle_root: String,              // Hash of encrypted data + blind indexes
    hash: String,
    nonce: String,                    // Encryption nonce
}
```

**User Account:**
```rust
UserAccount {
    account_id: String,           // UUID
    api_key_hash: String,         // SHA-256 hash (for verification)
    public_key: String,           // Ed25519 public key
    created_at: i64,
    metadata_encrypted: Option<String>,  // Optional encrypted metadata
    signature: String,            // Ed25519 signature
}
```

**Encrypted Collection:**
```rust
EncryptedCollection {
    collection_id: String,        // UUID
    owner_api_key_hash: String,   // Links to UserAccount
    encrypted_metadata: String,   // Encrypted label/tags
    encrypted_payload: String,    // Encrypted JSON data
    mac: String,                  // HMAC-SHA256 for integrity
    nonce: String,                // 12-byte random nonce
    signature: String,            // Ed25519 signature
    public_key: String,           // Ed25519 public key
    user_salt: String,            // Per-user random salt (prevents correlation)
}
```

## Rate Limiting

Goud Chain implements **graduated DoS protection** with a 5-tier penalty system to protect against abuse while preserving read access for legitimate users.

### Rate Limits

**Default (Local Development):**
- **Writes:** 10 requests/second per API key
- **Reads:** 100 requests/second per API key

**GCP Production (e2-micro):**
- **Writes:** 5 requests/second per API key
- **Reads:** 50 requests/second per API key

### Graduated Penalty System

Violations escalate through 5 tiers with increasing severity:

| Tier | Violation | Penalty | Blocks Writes? | Blocks Reads? | Duration |
|------|-----------|---------|----------------|---------------|----------|
| 1 | Warning | HTTP 200 with warning header | No | No | — |
| 2 | 1st offense | Cooldown period | No | No | 30 seconds |
| 3 | 2nd offense | Write operations blocked | Yes | No | 5 minutes |
| 4 | 3rd offense | Write operations blocked | Yes | No | 1 hour |
| 5 | 4th offense | Permanent write ban | Yes | No | Permanent |
| 6 | 5th offense | Complete blacklist + IP ban | Yes | Yes | 24 hours (IP) |

**Key Principles:**
- **Read Access Preserved:** Users can always read their data (until complete blacklist)
- **IP-Based Fallback:** If IP is blocked, read operations allowed at limited speed
- **Privacy-Preserving:** IP addresses hashed using SHA-256 before storage
- **Fail-Open Design:** If rate limiter errors, requests are allowed (availability over security)

### HTTP Headers

**Response Headers (All Requests):**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704067260
```

**Warning State (Tier 1):**
```
X-RateLimit-Violation: warning
X-RateLimit-Violation-Count: 0
X-RateLimit-Cooldown: 30
```

**Blocked State (HTTP 429):**
```json
{
  "error": "API key banned (WriteBlock5Min): expires at 1704067500"
}
```

### Configuration

**Environment Variables:**
```bash
# Rate limiting configuration
RATE_LIMIT_WRITE_PER_SEC=10         # Write operations per second
RATE_LIMIT_READ_PER_SEC=100         # Read operations per second
RATE_LIMIT_BYPASS_KEYS=             # Comma-separated API keys to bypass rate limiting
RATE_LIMIT_ENABLE_IP_BAN=true       # Enable 24-hour IP bans on 5th violation
```

**Bypass Whitelist:**
For testing or trusted clients, add API keys to bypass rate limiting:
```bash
RATE_LIMIT_BYPASS_KEYS=api_key_1,api_key_2,api_key_3
```

### Storage Architecture

**RocksDB Schema:**
- `ratelimit:{api_key_hash}:{window_start}` → Request count (u32)
- `violations:{api_key_hash}` → ViolationRecord (Bincode-serialized)
- `bans:{api_key_hash}` → BanRecord (Bincode-serialized)
- `ip_bans:{ip_hash}` → Expiry timestamp (i64)

**Performance:**
- LRU cache for 10,000 hot API keys
- <500µs overhead per request
- In-memory lookups for cached keys
- RocksDB persistence for violations/bans

### Testing

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for comprehensive testing strategy including isolated environment setup to avoid self-banning during development.

## API Documentation

**Interactive API Documentation:** [http://localhost:8080/rapidoc](http://localhost:8080/rapidoc) (local) or [https://dev.goudchain.com/rapidoc](https://dev.goudchain.com/rapidoc) (production)

Goud Chain provides comprehensive OpenAPI 3.1 documentation with interactive testing via RapiDoc UI:

- **Auto-generated schemas** - All request/response types derived from Rust code (single source of truth)
- **Live testing** - Try API endpoints directly from the browser
- **Authentication support** - Test with API keys and JWT session tokens
- **WebSocket documentation** - Real-time event streaming guide
- **Example requests** - Copy-paste ready curl commands

**OpenAPI Specification:** [http://localhost:8080/api-docs/openapi.json](http://localhost:8080/api-docs/openapi.json)

Compatible with Swagger UI, Postman, OpenAPI Generator, and other OpenAPI 3.1 tools. Use the JSON spec to generate client SDKs for any language.

## API Reference

### Create Account

```bash
curl -X POST http://localhost:8080/account/create \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": null
  }'

# Response:
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012",
  "warning": "IMPORTANT: Save this API key! It will only be shown once and cannot be recovered."
}
```

**⚠️ Important:** The API key is shown only once. Store it securely - it cannot be recovered.

### Login

```bash
curl -X POST http://localhost:8080/account/login \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012"
  }'

# Response:
{
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "account_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** Session tokens expire after 1 hour. You can use either the API key or session token for authenticated requests.

### Submit Encrypted Data

```bash
curl -X POST http://localhost:8080/data/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "label": "my-data",
    "data": "{\"key\": \"value\"}"
  }'

# Response:
{
  "collection_id": "650e8400-e29b-41d4-a716-446655440000",
  "label": "my-data",
  "block_number": 5
}
```

**Authentication Methods:**
- Header: `Authorization: Bearer YOUR_API_KEY`
- Header: `Authorization: Bearer YOUR_SESSION_TOKEN`

### List My Collections

```bash
curl -X GET http://localhost:8080/data/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
{
  "collections": [
    {
      "collection_id": "650e8400-e29b-41d4-a716-446655440000",
      "label": "my-data",
      "created_at": 1704067200,
      "block_number": 5
    }
  ]
}
```

### Decrypt Collection

```bash
curl -X POST http://localhost:8080/data/decrypt/650e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
{
  "collection_id": "650e8400-e29b-41d4-a716-446655440000",
  "data": "{\"key\": \"value\"}"
}
```

### View Blockchain

```bash
curl http://localhost:8080/chain

# Response:
{
  "chain": [
    {
      "index": 0,
      "timestamp": 1704067200,
      "encrypted_data": [],
      "previous_hash": "0",
      "merkle_root": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "hash": "abc123...",
      "validator": "Genesis"
    }
  ],
  "length": 1
}
```

### Health Check

```bash
curl http://localhost:8080/health

# Response:
{
  "status": "healthy",
  "chain_length": 1,
  "latest_block": 0,
  "node_id": "node1",
  "peer_count": 1
}
```

### System Metrics

```bash
curl http://localhost:8080/api/metrics

# Response:
{
  "node_id": "node1",
  "chain_length": 10,
  "peer_count": 2,
  "latest_block_index": 9,
  "latest_block_timestamp": 1704067200,
  "status": "healthy",
  "total_operations": 25,
  "cache_hit_rate": 99.3,
  "operations_per_second": 0.0
}
```

### Query Audit Logs

```bash
# Get all audit logs for authenticated user
curl -X GET "http://localhost:8080/api/audit?page=0&page_size=20" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by event type and time range
curl -X GET "http://localhost:8080/api/audit?event_type=DataSubmitted&start_ts=1704067200000&end_ts=1704153600000" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
{
  "logs": [
    {
      "event_type": "DataSubmitted",
      "timestamp": 1704067800000,
      "collection_id": "650e8400-e29b-41d4-a716-446655440000",
      "ip_hash": "1a2b3c4d5e6f7890",
      "metadata": {
        "block": 5,
        "label": "my-data"
      },
      "invalidated": false
    }
  ],
  "total": 25,
  "page": 0,
  "page_size": 20,
  "total_pages": 2
}
```

**Query Parameters:**
- `page` - Page number (0-indexed, default: 0)
- `page_size` - Items per page (default: 50, max: 100)
- `event_type` - Filter by event type (AccountCreated, DataSubmitted, DataDecrypted, DataListed, AccountLogin)
- `start_ts` - Start timestamp in milliseconds (inclusive)
- `end_ts` - End timestamp in milliseconds (inclusive)

### Load Balancer Status

```bash
curl http://localhost:8080/lb/health

# Response:
{
  "status": "healthy",
  "service": "goud_chain_lb",
  "nodes": 2,
  "platform": "gcp"
}
```

## Cloud Deployment (Google Cloud Platform)

**Live Demo:** https://dev.goudchain.com (Dashboard + API)

Runs on GCP's free tier (e2-micro VM, 1GB RAM) with Terraform-managed infrastructure. Single VM runs nginx load balancer, dashboard, and 2 blockchain nodes (node1: 384MB, node2: 384MB). Total memory footprint ~960MB leaves headroom for kernel and system processes.

**Deployment:** `./scripts/setup-gcp.sh` (one-time setup), `./scripts/deploy.sh` (deploy/update)

**Secret Management:** JWT and session secrets stored in GitHub Secrets, injected at Docker build time. Rotation via `./scripts/rotate-secrets.sh` (recommended every 90 days). See [docs/SECRET_MANAGEMENT.md](docs/SECRET_MANAGEMENT.md).

**CI/CD:** GitHub Actions deploys on push to main branch. Requires secrets: GCP_PROJECT_ID, GCP_SERVICE_ACCOUNT_KEY, SSH keys, JWT_SECRET, SESSION_SECRET. Optional Cloudflare integration for custom domains with automatic DNS and SSL.

**Troubleshooting:** Check nginx port 80 binding, Cloudflare SSL mode (Flexible), firewall rules, Docker service status, and memory usage (e2-micro has 1GB limit).

**Free Tier Limits:** 1× e2-micro instance (us-west1/central1/east1), 30GB disk, 1GB egress/month. Upgrade to e2-small ($13/mo) or e2-medium ($27/mo) for additional nodes.

## Persistent Storage

Goud Chain uses Docker persistent volumes with RocksDB for enterprise-grade data durability:

**Volume Architecture:**
- Named Docker volumes (`node1_data`, `node2_data`, `node3_data`) persist across container restarts
- RocksDB storage with Snappy compression (~50% reduction)
- Automatic schema migration on version changes
- Volume metrics exposed via `/api/metrics` endpoint

**Backup & Recovery:**
- Automated backup scripts with integrity verification (SHA-256 checksums)
- Cloud storage integration (Google Cloud Storage, Amazon S3)
- Point-in-time restore with schema compatibility validation
- 30-day retention policy (configurable)

**Volume Management:**
```bash
./run volumes-list        # List all data volumes
./run volumes-check       # Check volume health and disk usage
./run backup local        # Create backup (stops containers for consistency)
./run restore backup.tar.gz  # Restore from backup with validation
```

**Monitoring:**
```bash
# JSON metrics
curl http://localhost:8080/api/metrics | jq '.volume_metrics'

# Prometheus metrics
curl http://localhost:8080/api/metrics/prometheus | grep goud_volume
```

See [docs/VOLUME_MANAGEMENT.md](docs/VOLUME_MANAGEMENT.md) for comprehensive volume management, disaster recovery procedures, and production deployment guidelines.

## Configuration Management

Template-based configuration system prevents drift between local and production environments. All nginx and docker-compose configs are generated from base templates with environment-specific overrides. Pre-commit hooks automatically regenerate configs when templates change, ensuring consistency across deployments.

## Module Dependency Architecture

Enforces strict layered architecture with automatic circular dependency detection. Dependencies flow unidirectionally from higher to lower layers (Presentation → Network → Persistence → Business Logic → Utilities → Foundation). Pre-commit hooks validate architecture rules and block commits that introduce circular dependencies. See [docs/module-structure.png](docs/module-structure.png) for visual dependency graph.

## Local Development

### Running Tests

```bash
cargo test
cargo clippy
cargo fmt -- --check
```

### Running with Hot Reload

```bash
./run dev                # Release builds (default)
./run dev --fast-build   # Debug builds (fast iteration)
```

Uses `cargo-watch` for automatic recompilation on source file changes. Choose release builds for performance testing or debug builds for rapid iteration.

### Project Structure

```
goud_chain/
├── src/
│   ├── main.rs                     # Entry point
│   ├── lib.rs                      # Library exports for testing
│   ├── config.rs                   # Environment configuration & secret management
│   ├── constants.rs                # Configuration constants & schema version
│   ├── crypto/
│   │   ├── api_key.rs              # API key generation & validation
│   │   ├── blind_index.rs          # HMAC-based searchable encryption
│   │   ├── encryption.rs           # AES-256-GCM encryption
│   │   ├── hkdf.rs                 # Two-tier HKDF (100k auth, 1k encryption)
│   │   ├── key_cache.rs            # TTL cache with zeroization
│   │   ├── mac.rs                  # HMAC-SHA256 message authentication
│   │   └── signature.rs            # Ed25519 signatures
│   ├── domain/
│   │   ├── blockchain.rs           # Blockchain logic with blind index queries
│   │   ├── block.rs                # Privacy-preserving block structure
│   │   ├── user_account.rs         # User account model
│   │   └── encrypted_collection.rs # Encrypted data collection
│   ├── api/
│   │   ├── mod.rs                  # OpenAPI documentation definition
│   │   ├── handlers.rs             # Legacy handlers (kept for reference)
│   │   ├── routes/                 # OpenAPI route modules (organized by domain)
│   │   │   ├── account.rs          # Account creation & login endpoints
│   │   │   ├── data.rs             # Data submission & retrieval endpoints
│   │   │   ├── health.rs           # Health check & blockchain status endpoints
│   │   │   ├── metrics.rs          # System metrics & statistics endpoints
│   │   │   └── audit.rs            # Audit log query endpoint
│   │   ├── schemas.rs              # OpenAPI request/response schemas (single source of truth)
│   │   ├── auth.rs                 # JWT authentication middleware
│   │   ├── rate_limiter.rs         # Rate limiting & DoS protection
│   │   ├── websocket.rs            # WebSocket real-time event streaming
│   │   └── internal_client.rs      # Inter-node HTTP client
│   ├── p2p/
│   │   └── mod.rs                  # Peer-to-peer networking & validator selection
│   ├── storage/
│   │   └── mod.rs                  # Blockchain persistence with auto-migration
│   └── types/
│       ├── api.rs                  # Request/response types
│       └── errors.rs               # Error types
├── tests/
│   ├── module_dependencies.rs      # Circular dependency prevention
│   └── privacy_verification.rs     # Privacy architecture tests
├── scripts/
│   ├── setup-gcp.sh                    # GCP project setup
│   ├── deploy.sh                       # Deploy to GCP
│   ├── destroy.sh                      # Destroy GCP resources
│   ├── setup-terraform-backend.sh      # Create GCS bucket for Terraform state
│   ├── backup-volumes.sh               # Automated volume backup with cloud upload
│   ├── restore-volumes.sh              # Volume restore with integrity verification
│   └── generate_module_graph.sh        # Dependency visualization
├── config/
│   ├── base/
│   │   ├── constants.env               # All magic numbers centralized
│   │   ├── nginx.conf.template         # Nginx template ({{VARIABLE}} syntax)
│   │   └── docker-compose.base.yml     # YAML anchors for reusability
│   ├── environments/
│   │   ├── local/
│   │   │   ├── overrides.env           # Local-specific values (3 nodes)
│   │   │   └── docker-compose.template.yml
│   │   └── gcp/
│   │       ├── overrides.env           # GCP-specific values (2 nodes, e2-micro)
│   │       └── docker-compose.template.yml
│   └── scripts/
│       └── generate-configs.sh         # Config generation script
├── nginx/
│   ├── nginx.local.conf        # Generated from config/ templates
│   ├── nginx.gcp.conf          # Generated from config/ templates
│   └── cors.conf               # Shared CORS config
├── web/                        # React monorepo (migrated from Alpine.js)
│   ├── apps/
│   │   └── dashboard/          # Main dashboard application
│   ├── packages/
│   │   ├── ui/                 # Shared UI components
│   │   ├── hooks/              # React hooks
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript type definitions
│   │   └── config/             # Shared configurations
│   ├── Dockerfile              # Dashboard container
│   └── nginx.conf              # Dashboard nginx config
├── terraform/
│   ├── main.tf                 # Root Terraform module
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── modules/
│   │   ├── compute/            # GCP VM module
│   │   └── dns/                # Cloudflare DNS module
│   └── environments/
│       └── dev/                # Development environment
│           ├── main.tf         # Environment-specific config
│           ├── variables.tf    # Environment variables
│           └── terraform.tfvars.example  # Example configuration
├── .env.example                # Environment variable template
├── docker-compose.local.yml    # Generated - Local 3-node network
├── docker-compose.gcp.yml      # Generated - GCP 2-node network (e2-micro optimized)
├── docker-compose.local.dev.yml # Dev mode overlay (hot reload, jupyter)
├── Dockerfile                  # Rust production build
├── Dockerfile.dev              # Rust dev build with cargo-watch (debug/release)
├── run                         # CLI script
├── README.md                   # This file
└── CLAUDE.md                   # AI assistant guidelines
```

## Tech Stack

**Backend:**
- **Rust** - Core blockchain implementation
- **AES-256-GCM** - Symmetric encryption (aes-gcm crate)
- **HKDF** - Two-tier key derivation (100k auth, 1k encryption)
- **HMAC-SHA256** - Message authentication (hmac + sha2)
- **Ed25519** - Digital signatures (ed25519-dalek)
- **SHA-256** - Hashing (sha2)
- **JWT** - Session tokens (jsonwebtoken)
- **Base64** - API key encoding (base64)
- **JSON** - Serialization (serde_json)
- **HTTP** - Async API server (axum + tokio)
- **OpenAPI 3.1** - Auto-generated API documentation (utoipa + utoipa-axum)
- **subtle** - Constant-time comparisons (timing attack prevention)
- **zeroize** - Automatic memory clearing for sensitive data
- **lru** - LRU cache with TTL for key derivation optimization

**Infrastructure:**
- **NGINX** - Load balancer and reverse proxy
- **Docker & Docker Compose** - Containerization
- **Google Cloud Platform** - Cloud hosting (free tier)
- **Terraform** - Infrastructure as Code
- **Cloudflare** - DNS and CDN (free tier)

**Frontend:**
- **AlpineJS** - Reactive UI components
- **TailwindCSS** - Styling
- **localStorage** - Session management

## P2P Networking

**Message Types:**
```rust
enum P2PMessage {
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewAccount(UserAccount),
    NewCollection(EncryptedCollection),
}
```

**Peer Discovery:**
- Environment variable: `PEERS=node2:9000,node3:9000`
- Automatic chain sync on startup
- Block broadcasting on creation

**Chain Validation:**
- Longest chain wins
- Merkle root verification
- Validator authorization checks
- Timestamp validation
- Signature verification

## Configuration

Nodes configured via environment variables (NODE_ID, HTTP_PORT, P2P_PORT, PEERS). JWT_SECRET and SESSION_SECRET are auto-generated on first run if not provided (stored in `/data` directory). For production deployments, set these secrets via environment variables or GitHub Secrets (see [SECRET_MANAGEMENT.md](docs/SECRET_MANAGEMENT.md)).

## Privacy Architecture

**Design Goals:**
- Hide all metadata unless user has valid API key
- Prevent correlation attacks across blocks
- Obfuscate validator identity and timing information
- Enable efficient queries without exposing data

**Blind Indexes:**
- HMAC-SHA256 based searchable encryption
- **Per-user salt (32 bytes)** + per-block salt prevents cross-block correlation
- Attacker cannot correlate their own data across blocks (missing user_salt)
- Deterministic for same API key + user_salt + block_salt combination
- One-way: cannot reverse to find API key hash
- Query complexity: O(n) blocks (trade-off for privacy)

**Envelope Encryption Architecture:**
- User accounts encrypted with per-user keys derived from API key + block salt
- Collections encrypted with user's API key (separate from envelope encryption)
- Node operators cannot decrypt user data (zero-knowledge storage)
- Block envelope container is Base64-encoded (envelopes contain encrypted data)
- Each encryption layer uses independent key derivation with domain separation

**Timestamp Obfuscation:**
- Timestamps rounded to daily granularity (86400 seconds)
- Random jitter added (±4 hours) to each block timestamp
- Hides exact activity timing and timezone information
- Prevents timing-based correlation and bulk submission pattern detection

**Validator Obfuscation:**
- Validator identity stored inside encrypted block data
- Public `validator_index` is hash-based (validator + block index)
- Prevents identifying validator from blockchain inspection

**What's Visible On-Chain:**
- Block index, obfuscated timestamp, previous hash
- Encrypted block data (opaque ciphertext)
- Blind indexes (random-looking hex strings)
- Obfuscated validator index (not validator name)
- Merkle root, block hash, nonce

**What's Hidden:**
- Account IDs, API key hashes, public keys
- Collection IDs, labels, data contents
- Validator names (encrypted in block data)
- Exact timestamps (obfuscated to hour)
- Number of accounts/collections per block

## Security Model

**Key Generation:** 256-bit cryptographically secure random API keys. Only SHA-256 hash stored on blockchain (keys cannot be recovered if lost).

**Two-Tier HKDF Strategy:**
- **Tier 1 (Authentication):** 100,000 iterations for API key hashing (OWASP-compliant brute-force resistance)
- **Tier 2 (Encryption):** 1,000 iterations for encryption/MAC key derivation (domain separation after authentication)
- Rationale: Authentication requires strong protection; encryption keys only need context isolation after API key validation
- Hash caching: 5-minute TTL with LRU eviction (1000 entries), 3x performance improvement

**Encryption:** AES-256-GCM with 12-byte random nonces, HMAC-SHA256 integrity verification, independent collection encryption.

**Authentication:** Constant-time comparison (timing attack prevention), JWT session tokens (1-hour expiry), dual-mode auth (API key or session token).

**Signatures:** Ed25519 digital signatures on all blockchain data (tamper detection, authenticity verification).

## License

MIT

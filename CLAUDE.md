# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goud Chain is an encrypted blockchain with API key-based authentication using Proof of Authority (PoA) consensus. This is a proof-of-concept project demonstrating encrypted JSON storage on an immutable distributed ledger.

**Core Technologies:**
- Rust for blockchain implementation
- AES-256-GCM for symmetric encryption
- Ed25519 for digital signatures
- SHA-256 for hashing (blocks, Merkle trees, API key derivation)
- Docker Compose for multi-node deployment

## Development Commands

### Build & Test
```bash
cargo build --release
cargo test
cargo clippy
```

### Running the Network
```bash
./run dev          # Development mode with hot reload
./run start        # Production mode
./run stop         # Stop all containers
./run clean        # Remove all data and containers
./run logs node1   # View logs for specific node
```

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
This project follows a strict layered architecture to prevent circular dependencies and maintain clean separation of concerns. Dependencies flow **unidirectionally** from higher layers to lower layers.

**The Layer Hierarchy:**
```
Layer 0: Foundation     → Pure data types, constants (no internal dependencies)
Layer 1: Utilities      → Reusable helpers (crypto, config)
Layer 2: Business Logic → Core domain models and rules
Layer 3: Persistence    → Data storage and retrieval
Layer 4: Infrastructure → Network, external integrations
Layer 5: Presentation   → API, user interfaces
Entry Point             → Application startup and orchestration
```

**Key Principles:**

1. **Unidirectional Dependencies:**
   - Lower layers NEVER import from higher layers
   - Each layer can only depend on layers below it
   - Foundation layer (Layer 0) has ZERO internal dependencies
   - This prevents circular dependencies and keeps code testable

2. **Layer Responsibilities:**
   - **Foundation (Layer 0):** Constants, configuration values, pure type definitions (errors, API types)
     - No business logic, no external dependencies
     - Changes here affect all layers, so keep minimal and stable

   - **Utilities (Layer 1):** Reusable tools that don't depend on business logic
     - Cryptography (encryption, signatures, hashing)
     - Configuration management
     - Pure functions that can be used anywhere

   - **Business Logic (Layer 2):** Core domain models
     - Blockchain structure, blocks, encrypted data
     - Validation rules, consensus logic
     - Uses utilities for crypto/hashing but knows nothing about storage or networking

   - **Persistence (Layer 3):** Storage and retrieval
     - File I/O, database operations
     - Serialization/deserialization
     - Uses business models to know what to store

   - **Infrastructure (Layer 4):** External communication
     - P2P networking, message passing
     - Can depend on persistence for syncing data
     - Uses business logic to validate received data

   - **Presentation (Layer 5):** External interfaces
     - HTTP API, command-line interfaces
     - Orchestrates all lower layers
     - Never contains business logic

3. **When Adding New Code:**
   - **Ask:** "Which layer does this belong to?"
   - **Check:** "Does this create a circular dependency?" (run tests to verify)
   - **Validate:** Add new module to dependency tests if it's a top-level module
   - **Document:** Layer assignment should be obvious from module placement

4. **Circular Dependency Prevention:**
   - Automated tests detect cycles using depth-first search
   - Tests run on every commit via pre-commit hooks
   - If a cycle is detected, the commit is blocked
   - To fix: move shared code to a lower layer or extract to a new utility module

5. **Magic Numbers and Strings:**
   - ALL magic values go in the foundation layer (constants module)
   - Never hardcode timeouts, ports, file paths, cryptographic parameters
   - Use semantic constant names: `CHECKPOINT_INTERVAL` not `100`
   - This makes configuration changes safe and centralized

6. **Type Safety:**
   - Define custom error types in foundation layer
   - Use `Result<T, E>` everywhere, never panic in library code
   - Avoid string-based errors; use typed enums
   - Make invalid states unrepresentable with Rust's type system

**Modularity:**
- Extract reusable logic into separate functions/modules
- Keep functions focused on single responsibilities
- Each module should have a clear, single purpose

**DRY (Don't Repeat Yourself):**
- Abstract common patterns (e.g., CORS headers, response builders)
- Use traits for shared behavior across types
- Create helper functions for repeated operations
- If you copy-paste code more than once, extract it
- **Configuration as Code:** Extract ALL magic values to `config/base/constants.env`
- Use templates with variable substitution for infrastructure configs
- Environment-specific overrides, not full config duplicates
- Pre-commit hook ensures generated configs stay in sync with templates

**Atomic Operations:**
- Ensure blockchain state changes are atomic (add block + clear pending data together)
- Use transactions or locks to prevent partial state updates
- File persistence should be atomic (write to temp file, then rename)

**Visual Documentation:**
- Module dependency graph auto-generates on every commit
- Review the graph to spot architectural issues
- If the graph looks messy, the architecture needs refactoring

### Blockchain-Specific Principles

**Immutability:**
- Once blocks are added to the chain, they must never be modified
- Validation logic should be deterministic and reproducible
- Chain history is append-only

**Consensus:**
- Proof of Authority validator selection must be deterministic
- Block creation should be instant (no mining in PoA)
- Longest valid chain wins during synchronization

**Validation:**
- Validate all data at ingestion (signatures, hashes, structure)
- Re-validate the entire chain when syncing from peers
- Check Merkle roots to detect tampering
- Verify validator authorization for each block

**State Management:**
- Separate pending data from committed blocks
- Maintain clear boundaries between in-memory and persistent state
- Handle chain reorganization gracefully

### Security Best Practices

**Cryptography:**
- Never implement custom crypto primitives; use audited crates
- Use constant-time comparison for sensitive data (API key hashes)
- Generate cryptographically secure random values for nonces and keys
- Always use authenticated encryption (AES-GCM, not plain AES)

**Key Derivation:**
- Use proper key derivation functions (PBKDF2, Argon2, or scrypt)
- Include salt to prevent rainbow table attacks
- Consider versioning salt/KDF to allow future upgrades

**Input Validation:**
- Sanitize all external input (HTTP requests, P2P messages)
- Validate JSON structure before encryption/decryption
- Limit data sizes to prevent DoS attacks
- Verify signatures before processing any received data

**Network Security:**
- Validate all P2P messages before processing
- Implement peer reputation/blacklisting for malicious nodes
- Use timeouts to prevent resource exhaustion
- Authenticate peers in production deployments

### Testing Strategy

**Unit Tests:**
- Test cryptographic functions independently (encrypt/decrypt round-trips)
- Verify signature creation and validation
- Test Merkle tree construction and validation
- Validate chain validation logic with malformed blocks

**Integration Tests:**
- Test multi-node consensus scenarios
- Verify chain synchronization between peers
- Test API endpoints with various inputs
- Simulate network partitions and recovery

**Property-Based Testing:**
- Use `proptest` or `quickcheck` for blockchain invariants
- Verify that any valid chain remains valid after adding valid blocks
- Test that encryption/decryption is bijective

**Security Testing:**
- Test with invalid signatures
- Attempt to modify blocks after creation
- Try decrypting with wrong API keys
- Test with malformed P2P messages

### Performance Considerations

**Optimization Priorities:**
1. Correctness first - never sacrifice security for performance
2. Profile before optimizing - use `cargo flamegraph` or `perf`
3. Optimize hot paths: hashing, signature verification, chain validation

**Scaling:**
- Consider pagination for large chain queries
- Implement chain pruning or archival for long-running networks
- Cache computed values (Merkle roots) when safe
- Use async I/O for P2P networking to handle many concurrent peers

## Architecture Philosophy

This is a proof-of-concept, so prioritize:
- **Clarity over cleverness** - code should be easy to understand and modify
- **Simplicity over features** - add complexity only when necessary
- **Security over convenience** - never compromise cryptographic integrity
- **Flexibility over optimization** - premature optimization adds rigidity

Expect significant refactoring as the project evolves. Keep code modular and well-tested to enable rapid iteration.

## DevOps & Infrastructure

### Load Balancer Architecture

The system uses a **reverse proxy load balancer** as the single entry point for all API requests. This provides:

**High Availability:**
- Automatic failover when nodes become unhealthy
- Health checks monitor node responsiveness
- No single point of failure (nodes operate independently)

**Performance Optimization:**
- **Read operations** use round-robin distribution to balance load evenly
- **Write operations** use least-connections routing to avoid overwhelming nodes
- Connection pooling reduces TCP handshake overhead
- Appropriate cache headers for blockchain data (short TTL due to eventual consistency)

**Operational Benefits:**
- Single endpoint simplifies client configuration
- Transparent node maintenance (take nodes offline without API downtime)
- Centralized logging and metrics
- Easy to add/remove nodes without client changes

### Deployment Strategy

**Container Orchestration:**
- All services run in isolated containers
- Internal network for inter-node P2P communication
- Only load balancer and dashboard exposed externally
- Persistent volumes for blockchain data

**Scaling Approach:**
- **Horizontal scaling** - Add blockchain nodes to the upstream pool
- **Vertical scaling** - Increase container resources (CPU/memory)
- P2P peer discovery uses environment variables (configurable at runtime)

**Production Hardening:**
- Remove direct node access (only load balancer should be public)
- Enable TLS/HTTPS at load balancer termination
- Implement rate limiting to prevent abuse
- Add authentication layer for write operations
- Use secrets management for cryptographic keys
- Configure resource limits and health check intervals

### Infrastructure as Code

The system is designed to be **cloud-native** and **Terraform-ready**:

### Monitoring & Observability

**Health Check Strategy:**
- **Load balancer health**: Checks if reverse proxy is responsive
- **Node health**: Checks blockchain state (chain length, peer count, node ID)
- **Passive health checks**: Mark nodes unhealthy after failed requests
- **Active health checks**: Periodic probes to health endpoint

**Metrics to Monitor:**
- Load balancer: Request rate, error rate, connection count, upstream latency
- Blockchain nodes: Chain length, block creation time, peer count, pending transactions
- System: CPU, memory, disk I/O, network throughput

**Operational Commands:**
- Check overall system status (load balancer + all nodes)
- Get detailed load balancer statistics
- View logs from specific services
- Gracefully stop/start individual nodes

### Blockchain-Specific DevOps Considerations

**State Management:**
- Blockchain data is **append-only** and **immutable**
- Nodes synchronize via P2P gossip protocol
- Longest valid chain wins (eventual consistency)
- Checkpoints prevent deep chain reorganizations

**Consensus Coordination:**
- Proof of Authority uses deterministic validator rotation
- Load balancer routing doesn't interfere with consensus
- Write operations can go to any node (PoA validator creates block)
- P2P network handles block propagation independently

**Backup & Recovery:**
- Blockchain state stored in structured files (simple backup)
- Nodes can resync from peers if data is lost
- Genesis block is deterministic (always reconstructable)
- Consider periodic snapshots for faster recovery

**Network Partitions:**
- Nodes continue operating independently during partitions
- Chain sync occurs when partition heals
- Checkpoints provide safety against long-range attacks
- Monitor peer count to detect isolation

### Security Architecture

**Network Segmentation:**
- Public-facing: Load balancer, Dashboard
- Internal-only: P2P communication between nodes
- Debug endpoints: Individual node APIs (can be disabled in production)

**Attack Surface Reduction:**
- Load balancer performs input validation and rate limiting
- CORS headers restrict browser-based access if needed
- Individual nodes not directly accessible in production
- P2P messages validated before processing

**Cryptographic Operations:**
- API key-based encryption uses secure key derivation
- Digital signatures prevent data tampering
- Cryptographic hashing for integrity checks
- All crypto uses audited libraries, no custom primitives

**Future Enhancements:**
- OAuth2/JWT for API authentication
- TLS mutual authentication for P2P connections
- Hardware security modules (HSM) for key storage
- Audit logging for compliance requirements

## Configuration Management

### DRY Principle for Infrastructure

This project uses a **template-based configuration system** to eliminate duplication and prevent drift between local and GCP environments (the root cause of the EAGAIN socket error bug).

**Core Philosophy:**
- ALL configuration values live in `config/base/constants.env` (magic numbers, ports, timeouts, memory limits)
- Environment-specific overrides in `config/environments/{local,gcp}/overrides.env` (ONLY differences)
- Templates use `{{VARIABLE}}` placeholders for substitution
- Generation script (`config/scripts/generate-configs.sh`) produces final configs
- Pre-commit hook automatically regenerates when templates change

### Template System Architecture

**Base Layer (Shared Across All Environments):**
- `config/base/constants.env` - Single source of truth for all magic values
  - Network ports (HTTP_PORT=8080, P2P_PORT=9000)
  - Nginx settings (worker processes, timeouts, buffer sizes)
  - Docker resource limits (separate for local vs GCP)
  - Health check intervals
  - Logging configuration
  - All kernel tuning parameters

- `config/base/nginx.conf.template` - Nginx structure with variable placeholders
  - Uses `{{VARIABLE_NAME}}` syntax for substitution
  - Contains the full nginx configuration structure
  - Variables filled in by generation script from constants + overrides

- `config/base/docker-compose.base.yml` - YAML anchors for reusability
  - Shared service configurations (logging, health checks, networks)
  - Referenced by environment-specific templates using `<<: *anchor-name`

**Environment-Specific Layer (Overrides Only):**
- `config/environments/local/overrides.env`
  - NODE_COUNT=3 (local has 3 validators)
  - Local hostname patterns (node1, node2, node3)
  - Development-friendly resource limits
  - READ_ENDPOINTS includes data/list

- `config/environments/gcp/overrides.env`
  - NODE_COUNT=2 (GCP e2-micro limited to 2 nodes)
  - GCP hostname patterns (goud_node1, goud_node2)
  - Conservative memory limits (320M node1, 160M node2)
  - ACCOUNT_OPERATIONS_ROUTING_STRATEGY=node1_only (prevents chain inconsistency)
  - Reduced worker processes and connections

- `config/environments/{env}/docker-compose.template.yml`
  - Service definitions specific to environment
  - Uses YAML anchors from base for shared config
  - Variables substituted during generation

### Config Generation Workflow

**Manual Generation:**
```bash
./config/scripts/generate-configs.sh local   # Local development (3 nodes)
./config/scripts/generate-configs.sh gcp     # GCP deployment (2 nodes)
./config/scripts/generate-configs.sh all     # Both environments
```

**Automatic Generation:**
1. **Pre-commit Hook:** Detects changes to `config/` directory, regenerates all configs, stages them for commit
2. **./run Script:** Regenerates local config before starting containers
3. **scripts/deploy.sh:** Regenerates GCP config on VM before deployment
4. **GitHub Actions:** Regenerates configs during CI/CD pipeline before deployment

**Generation Process:**
1. Load `config/base/constants.env` (all default values)
2. Load `config/environments/{env}/overrides.env` (environment-specific overrides)
3. Generate dynamic sections (upstream nodes list, routing blocks)
4. Substitute all `{{VARIABLE}}` placeholders in templates
5. Output final configs:
   - `nginx/nginx.{env}.conf`
   - `docker-compose.{env}.yml`

### Generated Files (DO NOT EDIT MANUALLY)

**Warning:** These files are auto-generated from templates:
- `nginx/nginx.local.conf` ⚠️ Changes will be overwritten
- `nginx/nginx.gcp.conf` ⚠️ Changes will be overwritten
- `docker-compose.local.yml` ⚠️ Changes will be overwritten
- `docker-compose.gcp.yml` ⚠️ Changes will be overwritten

**Pre-commit hook enforcement:**
- If you edit a template file, the hook regenerates configs automatically
- Generated files are committed to git (visible diffs in PRs, easier debugging)
- Comment headers clearly mark files as "DO NOT EDIT MANUALLY"

### Adding New Configuration Values

**Example: Adding a new timeout value**

1. Add constant to `config/base/constants.env`:
```bash
NGINX_PROXY_TIMEOUT_NEW=120s
```

2. Use in template `config/base/nginx.conf.template`:
```nginx
proxy_timeout {{NGINX_PROXY_TIMEOUT_NEW}};
```

3. (Optional) Override for specific environment in `config/environments/gcp/overrides.env`:
```bash
NGINX_PROXY_TIMEOUT_NEW=60s  # Shorter timeout for GCP
```

4. Commit changes - pre-commit hook regenerates configs automatically

### Why This Matters

**Problem Solved:**
- **EAGAIN Bug Root Cause:** GCP nginx config had hardcoded `proxy_pass http://goud_node1:8080` while local used hash-based routing. Manual edits caused drift.
- **Magic Number Sprawl:** Timeouts, ports, memory limits scattered across multiple files
- **Copy-Paste Errors:** 85% duplication between nginx.local.conf and nginx.gcp.conf
- **Merge Conflicts:** Hard to track what actually differs between environments

**Benefits:**
- **Single Source of Truth:** Change a port in one place, affects all generated configs
- **Environment Comparison:** Easy to see differences (just diff the override files)
- **No Configuration Drift:** Templates enforce consistency
- **Pre-commit Validation:** Can't commit template changes without regenerating configs
- **Audit Trail:** Git history shows what values changed and when

**Development Workflow:**
1. Edit templates or constants (source of truth)
2. Commit → Pre-commit hook regenerates and stages configs
3. Deploy → Scripts regenerate on target environment
4. Zero manual config editing required

**Best Practices:**
- Never edit generated files directly (changes will be lost)
- Always add new values to `constants.env` first
- Use descriptive constant names (NGINX_PROXY_READ_TIMEOUT not TIMEOUT_1)
- Document non-obvious values with inline comments in constants.env
- When in doubt, regenerate: `./config/scripts/generate-configs.sh all`

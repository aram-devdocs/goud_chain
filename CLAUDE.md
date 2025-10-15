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

## Operational Security & Observability

**Audit Logging:** Blockchain-native storage (encrypted collections), privacy-preserving (per-user encryption, IP hashing), batched for efficiency (10s or 50 events), immutable and tamper-proof, non-blocking (fail-open design). Events: account creation/login, data submit/decrypt/list. Query performance: O(n) scan with pagination.

**System Metrics:** Real-time monitoring via API endpoint. Metrics: chain statistics (length, latest block), network health (peer count), performance (cache hit rates, operations total). Prometheus-compatible for Grafana dashboards.

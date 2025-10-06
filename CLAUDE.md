# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goud Chain is an encrypted blockchain with PIN-based access control using Proof of Authority (PoA) consensus. This is a proof-of-concept project demonstrating PIN-encrypted JSON storage on an immutable distributed ledger.

**Core Technologies:**
- Rust for blockchain implementation
- AES-256-GCM for symmetric encryption
- Ed25519 for digital signatures
- SHA-256 for hashing (blocks, Merkle trees, PIN derivation)
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
- Use constant-time comparison for sensitive data (PIN hashes)
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

**PIN Security:**
- Store only hashes of PINs, never plaintext
- Use timing-safe comparison to prevent timing attacks
- Consider rate limiting PIN attempts
- Document that PINs provide symmetric security only (anyone with PIN can decrypt)

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
- Try decrypting with wrong PINs
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

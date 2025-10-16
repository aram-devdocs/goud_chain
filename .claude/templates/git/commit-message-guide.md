# Git Commit Message Guide

## Format

```
<type>: <subject>

<body>
```

### Structure Rules

**Subject Line:**
- Start with lowercase (except proper nouns)
- No period at the end
- Maximum 72 characters
- Imperative mood (e.g., "add" not "added", "fix" not "fixed")
- Describe what the commit does, not what you did

**Body (Optional):**
- Separate from subject with blank line
- Wrap at 72 characters
- Explain what changed and why, not how (code shows how)
- Use bullet points for multiple changes
- Include breaking changes, migration steps, or notable impacts

**When to Include a Body:**
- Complex changes affecting multiple components
- Breaking changes requiring migration
- Security fixes or performance optimizations
- Architectural decisions or trade-offs

**When Subject-Only is Acceptable:**
- Simple bug fixes
- Documentation updates
- Formatting changes
- Dependency bumps
- Minor refactoring

## Commit Types

**feat:** New feature or enhancement
```
feat: implement blind index queries for encrypted collections

- Add HMAC-based searchable encryption using per-user and per-block salts
- Enable O(n) collection lookups without exposing API key hashes
- Prevent cross-block correlation attacks
```

**fix:** Bug fix
```
fix: resolve P2P deadlock during chain synchronization

- Replace blocking mutex with async RwLock in peer connection handler
- Prevent timeout during concurrent block broadcasts
- Add integration test for multi-peer synchronization
```

**refactor:** Code restructuring without behavior change
```
refactor: extract key derivation into dedicated crypto module

- Move HKDF logic from blockchain to crypto/hkdf.rs (Layer 1)
- Eliminate circular dependency between storage and domain layers
- No functional changes to key derivation algorithm
```

**perf:** Performance improvement
```
perf: cache derived encryption keys with 5-minute TTL

- Add LRU cache for HKDF-derived keys (1000 entries)
- Reduce authentication latency from 800ms to 250ms
- Automatic zeroization on cache eviction
```

**test:** Add or modify tests
```
test: add property-based tests for Merkle tree construction

- Verify Merkle root consistency across random input permutations
- Test invariant: modifying any leaf changes root hash
- 1000 test cases with randomly generated block data
```

**docs:** Documentation changes
```
docs: update README with rate limiting configuration

- Document 5-tier graduated penalty system
- Add environment variable reference
- Include example HTTP headers
```

**chore:** Build, dependencies, tooling, configuration
```
chore: upgrade axum from 0.7 to 0.8

- Update all axum dependencies and middleware
- Refactor router construction for new API
- No breaking changes to application logic
```

**security:** Security fixes or enhancements
```
security: implement constant-time API key comparison

- Replace std::cmp::PartialEq with subtle::ConstantTimeEq
- Prevent timing attacks on authentication
- Add security regression test
```

**style:** Code formatting, whitespace, syntax (no logic change)
```
style: apply cargo fmt to all source files
```

**ci:** CI/CD pipeline changes
```
ci: add cargo-nextest to pre-commit hook

- Install cargo-nextest if available, fallback to cargo test
- Ensure local testing matches CI/CD environment
- Add informative message about nextest installation
```

**build:** Build system or dependency changes
```
build: pin cargo-chef to 0.1.68 for Rust 1.83 compatibility

- Resolve build failure in GitHub Actions
- Update Dockerfile to use compatible version
```

**revert:** Revert a previous commit
```
revert: revert "feat: add experimental WebSocket compression"

This reverts commit abc1234.

- WebSocket compression causing client disconnects
- Reverting until root cause identified
```

## Examples

### Simple Change (Subject Only)
```
fix: correct typo in API documentation
```

### Complex Change (With Body)
```
feat: add WebSocket real-time event streaming

- Implement bidirectional WebSocket communication for live updates
- Add event types: blockchain updates, audit logs, metrics, peer changes
- Configure nginx sticky session routing using hash-based load balancing
- Include client auto-reconnect with exponential backoff
- Add dashboard integration with toast notifications for events

Breaking Change: Requires nginx configuration regeneration
```

### Security Fix
```
security: validate JSON depth to prevent DoS attacks

- Add max_depth parameter to serde_json deserializer (limit: 10 levels)
- Reject deeply nested JSON structures before processing
- Add security regression test with nested payload
- Prevents stack overflow and CPU exhaustion attacks
```

### Performance Optimization
```
perf: optimize block validation with parallel signature verification

- Use rayon to parallelize Ed25519 signature checks across block envelopes
- Reduce validation time for 100-envelope blocks: 2.5s -> 400ms
- Benchmark included in tests/benchmarks/signature_verification.rs
```

### Breaking Change
```
feat: migrate from full-chain JSON serialization to incremental RocksDB

- Replace single JSON file with RocksDB key-value storage
- Implement incremental O(1) block writes (was O(n))
- Add automatic schema migration from blockchain.json
- Enable Snappy compression for 50% disk space reduction

Breaking Change: Requires data migration
Migration: Run `cargo run -- migrate` before upgrading
```

## Best Practices

**Atomic Commits:**
- Each commit should represent a single logical change
- If you can't describe it concisely, it should be multiple commits
- Keep commits focused and reviewable

**Commit Frequency:**
- Commit often during development
- Squash related commits before pushing (via rebase)
- Each pushed commit should be deployable and pass all tests

**References:**
- Include issue numbers: `Closes #123`, `Relates to #456`, `Fixes #789`
- Link to relevant documentation or external resources
- Reference Linear tickets: `Implements GC-123`

**Language:**
- Use present tense imperative mood: "add", "fix", "refactor"
- Be specific: "authentication" not "code", "RocksDB" not "database"
- Avoid vague terms: "improve", "update", "change" (specify what improved/updated/changed)

**Architecture References:**
- Mention affected layers when relevant: "move validation to Layer 2 (Business Logic)"
- Note breaking changes to layer dependencies
- Highlight separation of concerns improvements

## Anti-Patterns

**Too Vague:**
```
fix: bug fix
chore: update code
refactor: improvements
```

**Too Detailed (belongs in code/comments):**
```
feat: add new feature

- Changed line 42 in file.rs to use match instead of if-else
- Renamed variable x to account_id
- Added 3 unit tests in tests/mod.rs
```

**Multiple Unrelated Changes:**
```
feat: add WebSocket support and fix rate limiting bug and update README

(Should be 3 separate commits)
```

**WIP or Temporary Commits (acceptable locally, squash before push):**
```
wip: debugging
fix: oops
test: testing
```

## Enforcement

**Pre-commit Hook:**
Current pre-commit hook enforces:
- `cargo fmt` (automatic formatting)
- `cargo clippy` (linting with `-D warnings`)
- `cargo test` (all tests must pass)
- `cargo audit` (security vulnerability scan)
- Config regeneration (if templates changed)
- Module dependency graph update

**Optional Commit Message Validation:**
To enforce commit message format, create `.git/hooks/commit-msg`:
```bash
#!/bin/sh
# Validate commit message format

commit_msg=$(cat "$1")
first_line=$(echo "$commit_msg" | head -n 1)

# Check format: <type>: <subject>
if ! echo "$first_line" | grep -qE '^(feat|fix|refactor|perf|test|docs|chore|security|style|ci|build|revert): .{10,72}$'; then
    echo "Error: Invalid commit message format"
    echo "Expected: <type>: <subject>"
    echo "Types: feat, fix, refactor, perf, test, docs, chore, security, style, ci, build, revert"
    echo "Subject: 10-72 characters, no period at end"
    exit 1
fi
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Documentation](https://git-scm.com/doc)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

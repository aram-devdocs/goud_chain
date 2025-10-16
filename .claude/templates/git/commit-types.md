# Git Commit Type Reference

## Type Taxonomy

### feat (Feature)
**Purpose:** New functionality or enhancement to existing features

**Use When:**
- Adding new API endpoints
- Implementing new cryptographic operations
- Adding new blockchain consensus rules
- Creating new UI components
- Introducing new configuration options
- Extending existing features with new capabilities

**Examples:**
```
feat: add blind index queries for encrypted collections
feat: implement WebSocket real-time event streaming
feat: support multi-tier HKDF key derivation
feat: add Prometheus metrics endpoint
```

**Characteristics:**
- Changes user-visible behavior
- Adds new capabilities to the system
- May require documentation updates
- Often includes new tests

---

### fix (Bug Fix)
**Purpose:** Correct defects in existing functionality

**Use When:**
- Resolving incorrect behavior
- Fixing crashes or panics
- Correcting data corruption issues
- Resolving race conditions or deadlocks
- Fixing memory leaks
- Correcting security vulnerabilities (also use `security:` type)

**Examples:**
```
fix: resolve P2P deadlock during chain synchronization
fix: prevent integer overflow in block timestamp calculation
fix: correct Merkle tree leaf ordering
fix: handle empty collection list in dashboard
```

**Characteristics:**
- Restores expected behavior
- Should not change API contracts (unless fixing a regression)
- Always includes test demonstrating the fix
- May reference issue number: `fix: resolve timeout (Closes #123)`

---

### refactor (Code Restructuring)
**Purpose:** Improve code structure without changing behavior

**Use When:**
- Extracting functions or modules
- Renaming for clarity
- Reorganizing code to respect layer boundaries
- Eliminating duplication (DRY)
- Simplifying complex logic
- Improving type safety

**Examples:**
```
refactor: extract key derivation into crypto module
refactor: consolidate error types into types/errors.rs
refactor: replace nested match with early returns
refactor: move validation logic from API to domain layer
```

**Characteristics:**
- Zero functional changes (same inputs → same outputs)
- Tests should pass without modification
- Improves maintainability, readability, or architecture
- May resolve circular dependencies or layer violations

---

### perf (Performance Optimization)
**Purpose:** Improve runtime performance, memory usage, or resource efficiency

**Use When:**
- Reducing algorithmic complexity
- Adding caching
- Optimizing hot paths
- Reducing memory allocations
- Parallelizing computation
- Improving database query efficiency

**Examples:**
```
perf: cache HKDF-derived keys with 5-minute TTL
perf: parallelize signature verification in block validation
perf: replace O(n) chain scan with O(1) RocksDB lookup
perf: reduce JSON serialization overhead with Bincode
```

**Characteristics:**
- Includes benchmark results in commit message
- Demonstrates measurable improvement
- No behavior changes (same output, faster execution)
- May include trade-offs (e.g., memory for speed)

---

### test (Testing)
**Purpose:** Add, modify, or improve tests

**Use When:**
- Adding unit tests for new functionality
- Creating integration tests
- Adding property-based tests
- Improving test coverage
- Fixing flaky tests
- Adding security or performance tests

**Examples:**
```
test: add property-based tests for Merkle tree construction
test: add integration test for multi-node consensus
test: improve test coverage for encryption module
test: add security regression test for timing attacks
```

**Characteristics:**
- No production code changes (only test code)
- May improve test reliability or coverage
- Can include test refactoring or test infrastructure improvements

---

### docs (Documentation)
**Purpose:** Update documentation (code comments, README, guides)

**Use When:**
- Updating README.md
- Modifying CLAUDE.md architecture docs
- Updating API documentation
- Adding inline code comments
- Creating migration guides
- Updating OpenAPI schemas

**Examples:**
```
docs: update README with rate limiting configuration
docs: add CLAUDE.md section on blind index architecture
docs: document HKDF two-tier key derivation strategy
docs: improve inline comments for signature verification
```

**Characteristics:**
- No code behavior changes
- May improve clarity or onboarding
- Can include fixing typos or formatting

---

### chore (Build, Dependencies, Tooling)
**Purpose:** Changes to build system, dependencies, or tooling

**Use When:**
- Updating dependencies (cargo, npm)
- Modifying CI/CD configuration
- Changing build scripts
- Updating Docker configuration
- Modifying pre-commit hooks
- Adding development tools

**Examples:**
```
chore: upgrade axum from 0.7 to 0.8
chore: update Dockerfile for multi-stage builds
chore: add cargo-watch for hot reload development
chore: regenerate configs after template changes
```

**Characteristics:**
- No user-facing changes
- May affect development workflow
- Can include dependency security updates

---

### security (Security)
**Purpose:** Security fixes or enhancements

**Use When:**
- Fixing security vulnerabilities
- Implementing security hardening
- Adding authentication/authorization
- Improving cryptographic operations
- Preventing attacks (timing, injection, DoS)
- Updating security-related dependencies

**Examples:**
```
security: implement constant-time API key comparison
security: validate JSON depth to prevent DoS attacks
security: upgrade openssl to patch CVE-2024-XXXX
security: add HMAC verification before decryption
```

**Characteristics:**
- May be combined with `fix:` for vulnerabilities
- Should include security regression tests
- May reference CVE numbers or security advisories
- Consider private disclosure for critical vulnerabilities

---

### style (Code Formatting)
**Purpose:** Code formatting, whitespace, syntax (no logic changes)

**Use When:**
- Running `cargo fmt`
- Fixing whitespace inconsistencies
- Reorganizing imports
- Correcting indentation
- Renaming for style guide compliance (no functional changes)

**Examples:**
```
style: apply cargo fmt to all source files
style: organize imports alphabetically
style: fix trailing whitespace in markdown files
```

**Characteristics:**
- Zero behavior changes
- Automated by tools (cargo fmt, prettier)
- Often skipped in commit history reviews

---

### ci (CI/CD)
**Purpose:** Changes to continuous integration or deployment pipelines

**Use When:**
- Modifying GitHub Actions workflows
- Updating CI/CD scripts
- Changing deployment automation
- Adding or modifying pipeline steps
- Improving CI performance

**Examples:**
```
ci: add cargo-nextest to pre-commit hook
ci: parallelize test execution in GitHub Actions
ci: add terraform validation to workflow
ci: cache cargo dependencies to reduce build time
```

**Characteristics:**
- Affects automated testing or deployment
- May improve CI speed or reliability
- No production code changes

---

### build (Build System)
**Purpose:** Changes to build configuration or process

**Use When:**
- Modifying Cargo.toml
- Updating build scripts
- Changing compiler flags
- Adding build-time dependencies
- Configuring feature flags

**Examples:**
```
build: pin cargo-chef to 0.1.68 for Rust 1.83 compatibility
build: enable LTO for release builds
build: add serde_json feature for utoipa integration
build: update minimum supported Rust version to 1.83
```

**Characteristics:**
- Affects compilation or linking
- May change binary output or build performance
- Can include dependency management

---

### revert (Revert Commit)
**Purpose:** Revert a previous commit

**Use When:**
- Rolling back a problematic commit
- Undoing changes that caused regressions
- Reverting experimental features

**Format:**
```
revert: revert "<original commit message>"

This reverts commit <hash>.

<reason for revert>
```

**Example:**
```
revert: revert "feat: add experimental WebSocket compression"

This reverts commit abc1234def5678.

WebSocket compression causing client disconnects on mobile browsers.
Reverting until root cause identified and proper testing performed.
```

**Characteristics:**
- Includes original commit hash
- Explains reason for revert
- May be temporary (until issue resolved)

---

## Type Selection Decision Tree

1. **Does this change user-visible behavior?**
   - Yes → Is it a bug fix? → `fix:`
   - Yes → Is it a new feature? → `feat:`
   - No → Continue to step 2

2. **Does this change code logic?**
   - Yes → Does it improve performance? → `perf:`
   - Yes → Is it restructuring without behavior change? → `refactor:`
   - No → Continue to step 3

3. **Does this change tests?**
   - Yes → `test:`
   - No → Continue to step 4

4. **Does this change documentation?**
   - Yes → `docs:`
   - No → Continue to step 5

5. **Does this affect security?**
   - Yes → `security:` (may combine with `fix:`)
   - No → Continue to step 6

6. **Does this affect build/dependencies/tools?**
   - Yes → Build system? → `build:`
   - Yes → CI/CD? → `ci:`
   - Yes → Other tooling? → `chore:`
   - No → Continue to step 7

7. **Is this only formatting?**
   - Yes → `style:`
   - No → Default to `chore:`

---

## Multiple Types

**When a commit spans multiple types:**

**Preferred:** Split into multiple focused commits
```
feat: add blind index queries
refactor: extract HMAC logic into crypto module
test: add integration tests for blind index queries
docs: document blind index architecture in CLAUDE.md
```

**Acceptable (if changes are inseparable):** Choose primary type
```
feat: add blind index queries with HMAC-based searchable encryption

- Implement blind index generation and query logic
- Extract HMAC utilities into crypto module (refactor)
- Add comprehensive test suite (100% coverage)
- Update CLAUDE.md with architecture documentation
```

**Rule of Thumb:** If the commit message requires multiple type labels, it should be multiple commits.

---

## Architecture-Specific Guidance

### Layer Boundary Changes
```
refactor: move validation from API (Layer 5) to domain (Layer 2)

- Extract input validation logic from HTTP handlers
- Add ValidateInput trait in domain/validation.rs
- Respect unidirectional dependency flow (Presentation → Business Logic)
- Eliminate circular dependency detected by pre-commit tests
```

### Blockchain Changes
```
feat: implement deterministic validator rotation in PoA consensus

- Add round-robin validator selection based on block index
- Store validator identity inside encrypted block data
- Add obfuscated validator_index field to prevent identification
- Include integration test for multi-node consensus
```

### Cryptographic Changes
```
security: migrate from single-tier to two-tier HKDF key derivation

- Tier 1 (100k iterations): API key hashing for authentication
- Tier 2 (1k iterations): Encryption/MAC key derivation
- Prevents downgrade attacks while maintaining performance
- Add security regression tests for key derivation
```

### Storage Changes
```
feat: migrate from JSON serialization to RocksDB incremental storage

- Replace full-chain serialization with per-block storage
- Reduce block write from O(n) to O(1)
- Enable Snappy compression for 50% disk space savings
- Automatic migration from blockchain.json on first run

Breaking Change: Requires data migration
```

# Template System

Professional templates for Linear issues, GitHub issues/PRs, and git commit conventions. Designed for blockchain/distributed systems development with focus on architecture, security, and technical precision.

## Directory Structure

```
.claude/templates/
├── README.md              # This file
├── linear/
│   ├── issue-template.md      # Linear issue format
│   └── project-template.md    # Linear project format
└── git/
    ├── commit-message-guide.md    # Commit message standards
    └── commit-types.md            # Type taxonomy reference

.github/
├── PULL_REQUEST_TEMPLATE.md       # GitHub PR template
└── ISSUE_TEMPLATE/
    ├── bug_report.md              # Bug report format
    ├── feature_request.md         # Feature request format
    ├── performance.md             # Performance issue format
    └── security.md                # Security issue format
```

## Design Principles

### Architecture-Focused
Templates reference the 6-layer architecture system, not specific files:
- **Layer 0 (Foundation):** Constants, type definitions, errors
- **Layer 1 (Utilities):** Crypto, configuration management
- **Layer 2 (Business Logic):** Domain models, validation, consensus
- **Layer 3 (Persistence):** RocksDB storage, serialization
- **Layer 4 (Infrastructure):** P2P networking, external integrations
- **Layer 5 (Presentation):** HTTP API, interfaces

Use abstract component names (e.g., "persistence layer" not "storage/mod.rs") to remain resilient to refactoring.

### System Context
Templates account for Goud Chain's specific architecture:
- **Blockchain:** Proof of Authority consensus, deterministic validator rotation
- **Cryptography:** AES-256-GCM encryption, Ed25519 signatures, HKDF key derivation
- **Storage:** RocksDB with Bincode serialization, incremental O(1) writes
- **Privacy:** Blind indexes, envelope encryption, timestamp obfuscation
- **Infrastructure:** Docker Compose, nginx load balancing, GCP deployment

### Professional Tone
- No emojis
- No filler language ("Let's", "Great!", "Oops")
- No AI-style verbosity
- Declarative statements
- Technical precision
- Concise rationale

### Enforcement

**GitHub Templates:**
- Automatically enforced by GitHub UI when creating issues/PRs
- Users select template from dropdown
- Template fields pre-populate the issue/PR body

**Linear Templates:**
- No programmatic enforcement (Linear API limitation)
- Templates integrated into `.claude/agents/linear-ticket-scoper.md` instructions
- Agent uses templates when creating/scoping Linear issues

**Git Commit Messages:**
- Format enforced by optional `commit-msg` hook (see [git/commit-message-guide.md](git/commit-message-guide.md))
- Pre-commit hook already enforces: formatting, linting, tests, security audit
- Commit message validation is opt-in (requires manual hook installation)

## Usage

### Linear Issues
When creating Linear issues, reference [linear/issue-template.md](linear/issue-template.md):

1. **Overview:** Problem statement, motivation, scope
2. **Technical Approach:** Affected layers, integration points, data flow
3. **Implementation Details:** Security, performance, correctness considerations
4. **Testing Strategy:** Unit, integration, security, performance tests
5. **Documentation:** Code, external docs, migration guides
6. **Acceptance Criteria:** Functional and non-functional requirements

### Linear Projects
When creating Linear projects, reference [linear/project-template.md](linear/project-template.md):

1. **Project Overview:** Name, objective, duration, priority
2. **Problem Statement:** Current state, desired state, business value
3. **Scope:** In scope, out of scope, success metrics
4. **Technical Approach:** Architecture impact, key components, design decisions
5. **Work Breakdown:** Phased issue breakdown
6. **Risk Assessment:** Technical, operational, security risks

### GitHub Issues
When creating GitHub issues, select appropriate template:
- **[bug_report.md](../.github/ISSUE_TEMPLATE/bug_report.md):** Defects in existing functionality
- **[feature_request.md](../.github/ISSUE_TEMPLATE/feature_request.md):** New functionality or enhancements
- **[performance.md](../.github/ISSUE_TEMPLATE/performance.md):** Performance degradation or optimization
- **[security.md](../.github/ISSUE_TEMPLATE/security.md):** Security vulnerabilities or concerns

### GitHub Pull Requests
When creating pull requests, the template ([../.github/PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md)) auto-populates with sections:

1. **Overview:** Type, summary, related issues
2. **Changes:** Functionality, affected layers, system impact
3. **Testing Performed:** Unit, integration, security, performance, manual tests
4. **Code Quality:** Pre-commit checks, code review checklist
5. **Documentation:** Code docs, external docs, breaking changes
6. **Deployment Considerations:** Config changes, migration, rollback plan

### Git Commit Messages
Follow conventions in [git/commit-message-guide.md](git/commit-message-guide.md):

**Format:**
```
<type>: <subject>

<body>
```

**Types:** feat, fix, refactor, perf, test, docs, chore, security, style, ci, build, revert

**Examples:**
```
feat: implement blind index queries for encrypted collections

- Add HMAC-based searchable encryption using per-user and per-block salts
- Enable O(n) collection lookups without exposing API key hashes
- Prevent cross-block correlation attacks
```

```
fix: resolve P2P deadlock during chain synchronization

- Replace blocking mutex with async RwLock in peer connection handler
- Prevent timeout during concurrent block broadcasts
```

See [git/commit-types.md](git/commit-types.md) for detailed type taxonomy.

## Integration with AI Agents

### linear-ticket-scoper Agent
The [.claude/agents/linear-ticket-scoper.md](../agents/linear-ticket-scoper.md) agent is configured to:
1. Reference templates when creating Linear issues/projects
2. Enforce template structure in scoping discussions
3. Validate that all required sections are completed
4. Ensure architecture-focused, professional language

### CLAUDE.md
The [CLAUDE.md](../../CLAUDE.md) file references:
- Template system location and purpose
- Architecture principles reflected in templates
- Commit message conventions
- Documentation standards

## Pre-commit Enforcement

Current pre-commit hook ([.git/hooks/pre-commit](../../.git/hooks/pre-commit)) enforces:
- `cargo fmt` - Code formatting
- `cargo clippy -- -D warnings` - Linting
- `cargo test` - All tests pass
- `cargo audit` - Security vulnerability scan
- Config regeneration (if templates changed)
- Module dependency graph update
- Dashboard tests
- Terraform validation

**Optional commit message validation:**
To enforce commit message format, create `.git/hooks/commit-msg`:
```bash
#!/bin/sh
commit_msg=$(cat "$1")
first_line=$(echo "$commit_msg" | head -n 1)

if ! echo "$first_line" | grep -qE '^(feat|fix|refactor|perf|test|docs|chore|security|style|ci|build|revert): .{10,72}$'; then
    echo "Error: Invalid commit message format"
    echo "Expected: <type>: <subject>"
    exit 1
fi
```

## Template Maintenance

### When to Update Templates

**Architecture Changes:**
- If layer responsibilities change, update layer descriptions
- If new layers are added, update affected layer checklists
- If system components are renamed, update component references

**Technology Changes:**
- If core technologies change (e.g., replace RocksDB), update storage sections
- If cryptographic primitives change, update security sections
- If deployment infrastructure changes, update infrastructure sections

**Process Changes:**
- If testing strategy evolves, update testing sections
- If documentation standards change, update documentation sections
- If commit conventions change, update git templates

### How to Update Templates

1. **Edit template files** in `.claude/templates/` or `.github/`
2. **Update references** in:
   - `.claude/agents/linear-ticket-scoper.md`
   - `CLAUDE.md`
   - This README
3. **Test with agent:** Verify linear-ticket-scoper uses updated templates correctly
4. **Document changes:** Update this README with rationale for changes
5. **Commit:** Use `docs: update templates for <reason>` commit message

## Examples

### Well-Formed Linear Issue
```markdown
# Overview
**Problem Statement:** Blockchain validation fails when chain reorganization occurs during concurrent peer synchronization.

**Motivation:** System reliability. Nodes reject valid blocks during network partitions, causing consensus failures.

**Scope:** Fix validation logic in consensus layer. Excludes P2P connection handling.

## Technical Approach
**Affected Layers:**
- [x] Layer 2 (Business Logic): Consensus validation
- [x] Layer 3 (Persistence): Block storage atomicity

**System Components:**
- Blockchain consensus validation
- RocksDB transaction handling
- P2P synchronization

[... rest of template ...]
```

### Well-Formed Commit Message
```
fix: prevent race condition in concurrent block validation

- Add RwLock to chain state during validation to prevent TOCTOU
- Ensure atomic block addition and pending data clear
- Add integration test for concurrent peer synchronization
- Resolves consensus failures during network partitions

Closes #456
```

### Well-Formed Pull Request
```markdown
# Pull Request

## Overview
**Type:** Bug Fix
**Summary:** Prevent race condition in concurrent block validation
**Related Issues:** Closes #456

## Changes

### Affected Layers
- [x] Layer 2 (Business Logic): Consensus validation
- [x] Layer 3 (Persistence): Block storage atomicity

### System Impact
**Blockchain:**
Consensus validation now uses RwLock to prevent TOCTOU race conditions during chain reorganization.

[... rest of template ...]
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
- [README.md](../../README.md) - Project overview

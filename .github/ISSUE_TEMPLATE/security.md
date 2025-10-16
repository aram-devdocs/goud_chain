---
name: Security Issue
about: Report a security vulnerability or concern (use private disclosure for critical issues)
title: '[Security] '
labels: security
assignees: ''
---

## Security Issue Classification
- [ ] Vulnerability (exploitable security flaw)
- [ ] Security Enhancement (proactive hardening)
- [ ] Security Audit Finding (from external review)
- [ ] Compliance Issue (crypto standards, best practices)

## Severity
- [ ] Critical (immediate exploitation possible, data compromise)
- [ ] High (exploitation likely, significant impact)
- [ ] Medium (exploitation difficult, moderate impact)
- [ ] Low (theoretical risk, minimal impact)

## Vulnerability Description
[Clear description of the security issue]

**Attack Vector:**
[How could this vulnerability be exploited?]

**Affected Component:**
- [ ] Authentication/Authorization
- [ ] Cryptographic Operations
- [ ] Input Validation
- [ ] API Security
- [ ] Storage Layer
- [ ] P2P Networking
- [ ] Infrastructure
- [ ] Dependencies

## Impact

**Confidentiality:**
[Can an attacker access data they should not?]

**Integrity:**
[Can an attacker modify data or blockchain state?]

**Availability:**
[Can an attacker cause denial of service?]

**Privilege Escalation:**
[Can an attacker gain unauthorized access or permissions?]

## Reproduction (if applicable)

**Prerequisites:**
[What access or conditions are required?]

**Steps to Exploit:**
1. [First step]
2. [Second step]
3. [Third step]

**Proof of Concept:**
```
[Code, API requests, or commands demonstrating the vulnerability]
```

## Current Mitigation
[Are there any existing controls that partially mitigate this issue?]

## Proposed Remediation

**Short-term Fix:**
[Immediate mitigation to reduce risk]

**Long-term Solution:**
[Comprehensive fix addressing root cause]

**Testing Strategy:**
[How to verify the fix works and doesn't introduce regressions]

## Affected Layers
- [ ] Layer 0 (Foundation): Constants, type definitions, errors
- [ ] Layer 1 (Utilities): Crypto, configuration management
- [ ] Layer 2 (Business Logic): Domain models, validation, consensus
- [ ] Layer 3 (Persistence): RocksDB storage, serialization
- [ ] Layer 4 (Infrastructure): P2P networking, external integrations
- [ ] Layer 5 (Presentation): HTTP API, interfaces

## Security Best Practices

**Cryptography:**
- [ ] Uses audited crates only
- [ ] Constant-time comparisons
- [ ] Authenticated encryption (AES-GCM)
- [ ] Proper key derivation (HKDF)

**Input Validation:**
- [ ] Sanitizes all external input
- [ ] Validates JSON structure
- [ ] Enforces size limits
- [ ] Signature verification before processing

**Authentication:**
- [ ] API key hashing with sufficient iterations
- [ ] JWT token validation
- [ ] Session expiry enforcement
- [ ] Rate limiting

## Testing Requirements
- [ ] Unit tests for security-critical functions
- [ ] Integration tests with malformed input
- [ ] Fuzz testing (if applicable)
- [ ] Security regression test suite

## References
[CVE numbers, OWASP guidelines, security advisories, related issues]

## Disclosure
[If this is a vulnerability, has it been disclosed to maintainers privately first?]

## Additional Context
[Any other relevant information, attack scenarios, related vulnerabilities]

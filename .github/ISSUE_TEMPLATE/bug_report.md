---
name: Bug Report
about: Report a defect in existing functionality
title: '[Bug] '
labels: bug
assignees: ''
---

## Description
[Clear, concise description of the bug]

## Environment
- **Deployment:** [Local 3-node / GCP 2-node / Other]
- **OS:** [macOS / Linux / Windows]
- **Rust Version:** [Output of `rustc --version`]
- **Docker Version:** [If applicable]
- **Affected Component:** [API / Blockchain / P2P / Storage / Dashboard / Infrastructure]

## Reproduction Steps
1. [First step]
2. [Second step]
3. [Third step]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Messages
```
[Paste relevant logs, error messages, or stack traces]
```

## Impact
- **Severity:** [Critical / High / Medium / Low]
- **Affected Functionality:** [Authentication / Data Encryption / Consensus / Storage / API / Other]
- **User Impact:** [Description of how users are affected]

## System State
**Blockchain State:**
- Chain length: [Number]
- Latest block hash: [Hash]
- Validator: [Validator ID]

**API Response:**
```json
[Paste relevant API responses if applicable]
```

**Resource Usage:**
- Memory: [Amount used]
- CPU: [Usage percentage]
- Disk: [Storage used]

## Additional Context
[Any other relevant information: timing, frequency, workarounds discovered, related issues]

## Affected Layers
- [ ] Layer 0 (Foundation): Constants, type definitions, errors
- [ ] Layer 1 (Utilities): Crypto, configuration management
- [ ] Layer 2 (Business Logic): Domain models, validation, consensus
- [ ] Layer 3 (Persistence): RocksDB storage, serialization
- [ ] Layer 4 (Infrastructure): P2P networking, external integrations
- [ ] Layer 5 (Presentation): HTTP API, interfaces

## Proposed Solution
[If you have an idea for how to fix this, describe it here]

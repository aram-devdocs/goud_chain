---
name: Performance Issue
about: Report performance degradation or optimization opportunity
title: '[Performance] '
labels: performance
assignees: ''
---

## Performance Issue
**Component:** [API / Blockchain / P2P / Storage / Cryptography / Other]

**Summary:** [Brief description of the performance problem]

## Current Performance

**Metric:** [Response time / Throughput / Memory usage / CPU usage / Disk I/O]

**Measurement:**
- Current: [Measured value with units]
- Expected: [Target value with units]
- Degradation: [Percentage or absolute difference]

**Measurement Methodology:**
[How was this measured? Tools used, test conditions, sample size]

## Reproduction

**Environment:**
- Deployment: [Local 3-node / GCP 2-node / Other]
- Load: [Number of concurrent requests, operations per second]
- Dataset: [Chain length, number of collections, data size]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Profiling Data:**
```
[Paste relevant profiler output, flame graphs, or benchmark results]
```

## Impact

**User Experience:**
[How does this affect users? Increased latency, timeouts, degraded responsiveness?]

**System Resources:**
- Memory: [Current usage and trend]
- CPU: [Current usage and trend]
- Disk: [Storage consumption and I/O patterns]
- Network: [Bandwidth usage]

**Scalability:**
[Does this limit the number of nodes, users, or operations?]

## Analysis

**Hot Paths:**
[Which code paths are affected? Hashing, signature verification, chain validation, storage operations?]

**Bottleneck Hypothesis:**
[What do you believe is causing the performance issue?]

**Affected Layers:**
- [ ] Layer 0 (Foundation): Constants, type definitions, errors
- [ ] Layer 1 (Utilities): Crypto, configuration management
- [ ] Layer 2 (Business Logic): Domain models, validation, consensus
- [ ] Layer 3 (Persistence): RocksDB storage, serialization
- [ ] Layer 4 (Infrastructure): P2P networking, external integrations
- [ ] Layer 5 (Presentation): HTTP API, interfaces

**Code Location:**
[File paths, function names, or modules where optimization is needed]

## Proposed Optimization

**Strategy:**
[Caching, algorithmic improvement, parallelization, lazy evaluation, other]

**Expected Improvement:**
[Target metric after optimization]

**Trade-offs:**
[What are the downsides? Increased memory usage, code complexity, reduced correctness guarantees?]

## Testing Requirements

**Benchmarks:**
[What performance benchmarks should be created or updated?]

**Regression Tests:**
[How will we prevent performance regressions in the future?]

**Validation:**
- [ ] Benchmark shows expected improvement
- [ ] No correctness regressions
- [ ] Memory usage within acceptable limits
- [ ] No new bottlenecks introduced

## Additional Context
[Profiler screenshots, flame graphs, related performance issues, prior optimization attempts]

## Priority
[Low / Medium / High / Critical]

**Rationale:** [Why is this priority level appropriate?]

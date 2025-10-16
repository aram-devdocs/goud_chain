//! System-wide constants for the Goud Chain blockchain.
//! This module contains all magic numbers and strings used throughout the application.

// Schema versioning
pub const SCHEMA_VERSION: &str = "v8_envelope_encryption";

// Storage paths
pub const DATA_DIRECTORY: &str = "/data";
pub const ROCKSDB_PATH: &str = "/data/rocksdb";

// Blockchain parameters
pub const CHECKPOINT_INTERVAL: u64 = 100;
pub const TIMESTAMP_TOLERANCE_SECONDS: i64 = 120;
pub const TIMESTAMP_GRANULARITY_SECONDS: i64 = 86400; // 1 day - hides exact timing and timezone
pub const TIMESTAMP_JITTER_SECONDS: i64 = 14400; // ±4 hours random jitter prevents pattern analysis

// Cryptography constants
pub const ENCRYPTION_SALT: &[u8] = b"goud_chain_salt_v2";
pub const NONCE_SIZE_BYTES: usize = 12;
pub const AES_KEY_SIZE_BYTES: usize = 32;
pub const ED25519_PUBLIC_KEY_SIZE: usize = 32;
pub const ED25519_SIGNATURE_SIZE: usize = 64;
pub const API_KEY_SIZE_BYTES: usize = 32;
// HKDF iteration counts (context-aware security)
// Security-critical: API key hashing for authentication (prevents offline brute-force)
pub const HKDF_ITERATIONS: u32 = 100_000; // OWASP recommended: 100k+ iterations
                                          // Performance-critical: Encryption key derivation from validated API keys (domain separation only)
                                          // Used AFTER API key has been validated - iteration count doesn't affect domain separation security
pub const HKDF_FAST_ITERATIONS: u32 = 1_000;

// API Key derivation contexts
pub const HKDF_CONTEXT_ENCRYPTION: &[u8] = b"goud_chain_encryption_v2";
pub const HKDF_CONTEXT_MAC: &[u8] = b"goud_chain_mac_v2";

// JWT/Session
pub const SESSION_EXPIRY_SECONDS: i64 = 3600; // 1 hour

// Genesis block
pub const GENESIS_PREVIOUS_HASH: &str = "0";
// Fixed genesis timestamp (Jan 1, 2024 00:00:00 UTC) - ensures all nodes create identical genesis
// Must be in the past to pass validation (TIMESTAMP_TOLERANCE_SECONDS check)
pub const GENESIS_TIMESTAMP: i64 = 1704067200; // Jan 1, 2024 00:00:00 UTC
pub const EMPTY_MERKLE_ROOT: &str = "0";

// Default network configuration
pub const DEFAULT_HTTP_PORT: &str = "8080";
pub const DEFAULT_P2P_PORT: &str = "9000";

// Peer reputation
pub const REPUTATION_REWARD_VALID_BLOCK: i32 = 1;
pub const REPUTATION_PENALTY_INVALID_BLOCK: i32 = -5;

// P2P Network Security
pub const MIN_REPUTATION_THRESHOLD: i32 = -10; // Block peers below this reputation
pub const MAX_MESSAGES_PER_MINUTE: u32 = 100;

// P2P Connection Timeouts (async architecture - prevent hung connections)
pub const P2P_CONNECT_TIMEOUT_SECONDS: u64 = 5;
pub const P2P_READ_TIMEOUT_SECONDS: u64 = 10;
pub const P2P_WRITE_TIMEOUT_SECONDS: u64 = 5;

// HTTP Client Retry Settings (for internal node-to-node communication)
pub const HTTP_MAX_RETRIES: u32 = 3;
pub const HTTP_INITIAL_BACKOFF_MS: u64 = 50;
pub const HTTP_MAX_BACKOFF_MS: u64 = 500;

// Rate Limiting - DoS Protection
// Request limits per API key
pub const RATE_LIMIT_WRITE_PER_SECOND: u32 = 10; // Maximum write operations per second
pub const RATE_LIMIT_READ_PER_SECOND: u32 = 100; // Maximum read operations per second
pub const RATE_LIMIT_WINDOW_SECONDS: u64 = 1; // Sliding window duration

// Graduated penalties (escalating ban durations)
pub const VIOLATION_COOLDOWN_SECONDS: u64 = 30; // 1st violation: 30-second cooldown
pub const BAN_WRITE_5MIN_SECONDS: u64 = 300; // 2nd violation: 5-minute write block
pub const BAN_WRITE_1HR_SECONDS: u64 = 3600; // 3rd violation: 1-hour write block
pub const BAN_IP_24HR_SECONDS: u64 = 86400; // After complete blacklist: 24-hour IP ban

// Performance tuning
pub const RATE_LIMIT_CACHE_SIZE: usize = 10000; // LRU cache for hot API keys

// Audit Logging - Operational Security
pub const AUDIT_LABEL_PREFIX: &str = "AUDIT:"; // Special collection label prefix for audit logs
pub const AUDIT_BATCH_INTERVAL_SECONDS: u64 = 10; // Flush audit logs every 10 seconds
pub const AUDIT_BATCH_SIZE: usize = 50; // Or when 50 events accumulated
pub const AUDIT_IP_HASH_LENGTH: usize = 8; // Store truncated SHA256(IP) for privacy

// Metrics - Operational Security

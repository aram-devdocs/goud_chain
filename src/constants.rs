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
pub const TIMESTAMP_GRANULARITY_SECONDS: i64 = 3600; // 1 hour (privacy: hides exact timing)

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
pub const PEER_SYNC_DELAY_SECONDS: u64 = 10; // Sync every 10 seconds to avoid thrashing

// Peer reputation
pub const REPUTATION_REWARD_VALID_BLOCK: i32 = 1;
pub const REPUTATION_PENALTY_INVALID_BLOCK: i32 = -5;

// HTTP headers
pub const HEADER_CONTENT_TYPE: &[u8] = b"Content-Type";
pub const HEADER_VALUE_JSON: &[u8] = b"application/json";

// Proof of Authority validators
// Reduced to 2 validators for single-VM GCP deployment (optimized for e2-micro 1GB RAM)
pub const VALIDATORS: [&str; 2] = ["Validator_1", "Validator_2"];

// P2P Network Security (Phase 4)
// Whitelist of allowed peer node IDs (must match NODE_ID env var of allowed peers)
// In production, this should be configured via environment variable
pub const ALLOWED_PEERS: [&str; 3] = ["node1", "node2", "node3"];
pub const MIN_REPUTATION_THRESHOLD: i32 = -10; // Block peers below this reputation
pub const MAX_MESSAGES_PER_MINUTE: u32 = 100;
pub const MAX_CONCURRENT_CONNECTIONS: usize = 10;

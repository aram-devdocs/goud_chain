//! System-wide constants for the Goud Chain blockchain.
//! This module contains all magic numbers and strings used throughout the application.

// Schema versioning
pub const SCHEMA_VERSION: &str = "v4_deterministic_genesis";

// Storage paths
pub const BLOCKCHAIN_FILE_PATH: &str = "/data/blockchain.json";
pub const DATA_DIRECTORY: &str = "/data";

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
pub const API_KEY_SIZE_BYTES: usize = 32; // 256-bit API keys
pub const HKDF_ITERATIONS: u32 = 100_000; // Key stretching

// API Key derivation contexts
pub const HKDF_CONTEXT_ENCRYPTION: &[u8] = b"goud_chain_encryption_v2";
pub const HKDF_CONTEXT_MAC: &[u8] = b"goud_chain_mac_v2";

// JWT/Session
// Default JWT secret for development (override with JWT_SECRET env var in production)
pub const JWT_SECRET_DEFAULT: &[u8] =
    b"goud_chain_jwt_secret_development_only_change_in_production";
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

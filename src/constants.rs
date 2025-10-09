/// System-wide constants for the Goud Chain blockchain
/// This module contains all magic numbers and strings used throughout the application

// Storage paths
pub const BLOCKCHAIN_FILE_PATH: &str = "/data/blockchain.json";
pub const DATA_DIRECTORY: &str = "/data";

// Blockchain parameters
pub const CHECKPOINT_INTERVAL: u64 = 100;
pub const TIMESTAMP_TOLERANCE_SECONDS: i64 = 120;

// Cryptography constants
pub const ENCRYPTION_SALT: &[u8] = b"goud_chain_salt_v1";
pub const NONCE_SIZE_BYTES: usize = 12;
pub const AES_KEY_SIZE_BYTES: usize = 32;
pub const ED25519_PUBLIC_KEY_SIZE: usize = 32;
pub const ED25519_SIGNATURE_SIZE: usize = 64;

// Genesis block
pub const GENESIS_PIN: &str = "0000";
pub const GENESIS_LABEL: &str = "Genesis Block";
pub const GENESIS_DATA: &str =
    r#"{"message": "Goud Chain initialized", "timestamp": "2025-01-01"}"#;
pub const GENESIS_PREVIOUS_HASH: &str = "0";
pub const EMPTY_MERKLE_ROOT: &str = "0";

// Default network configuration
pub const DEFAULT_HTTP_PORT: &str = "8080";
pub const DEFAULT_P2P_PORT: &str = "9000";
pub const PEER_SYNC_DELAY_SECONDS: u64 = 2;

// Peer reputation
pub const REPUTATION_REWARD_VALID_BLOCK: i32 = 1;
pub const REPUTATION_PENALTY_INVALID_BLOCK: i32 = -5;

// HTTP headers
pub const HEADER_ACCESS_CONTROL_ALLOW_ORIGIN: &[u8] = b"Access-Control-Allow-Origin";
pub const HEADER_ACCESS_CONTROL_ALLOW_METHODS: &[u8] = b"Access-Control-Allow-Methods";
pub const HEADER_ACCESS_CONTROL_ALLOW_HEADERS: &[u8] = b"Access-Control-Allow-Headers";
pub const HEADER_CONTENT_TYPE: &[u8] = b"Content-Type";

pub const HEADER_VALUE_WILDCARD: &[u8] = b"*";
pub const HEADER_VALUE_METHODS: &[u8] = b"GET, POST, OPTIONS";
pub const HEADER_VALUE_HEADERS: &[u8] = b"Content-Type";
pub const HEADER_VALUE_JSON: &[u8] = b"application/json";

// Proof of Authority validators
// Reduced to 2 validators for single-VM GCP deployment (optimized for e2-micro 1GB RAM)
pub const VALIDATORS: [&str; 2] = ["Validator_1", "Validator_2"];

use sha2::{Digest, Sha256};
use std::env;
use uuid::Uuid;

/// Configuration for the Goud Chain node
#[derive(Debug, Clone)]
pub struct Config {
    pub node_id: String,
    pub http_port: String,
    pub p2p_port: u16,
    pub peers: Vec<String>,
    pub master_chain_key: Vec<u8>,
}

impl Config {
    /// Load configuration from environment variables with sensible defaults
    pub fn from_env() -> Result<Self, ConfigError> {
        let node_id = env::var("NODE_ID").unwrap_or_else(|_| Uuid::new_v4().to_string());

        let http_port = env::var("HTTP_PORT")
            .unwrap_or_else(|_| crate::constants::DEFAULT_HTTP_PORT.to_string());

        let p2p_port = env::var("P2P_PORT")
            .unwrap_or_else(|_| crate::constants::DEFAULT_P2P_PORT.to_string())
            .parse()
            .map_err(|_| ConfigError::InvalidPort)?;

        let peers = Self::parse_peers();
        let master_chain_key = Self::load_master_chain_key()?;

        Ok(Config {
            node_id,
            http_port,
            p2p_port,
            peers,
            master_chain_key,
        })
    }

    /// Parse peer URLs from environment variable
    fn parse_peers() -> Vec<String> {
        env::var("PEERS")
            .ok()
            .map(|peer_urls| {
                peer_urls
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Load master chain key from environment variable
    /// Falls back to passphrase-derived key for development
    fn load_master_chain_key() -> Result<Vec<u8>, ConfigError> {
        // Try to load key from hex-encoded environment variable
        if let Ok(key_hex) = env::var("MASTER_CHAIN_KEY") {
            return hex::decode(&key_hex).map_err(|_| ConfigError::InvalidMasterKey);
        }

        // Development fallback: derive from passphrase using SHA256
        let passphrase = env::var("MASTER_KEY_PASSPHRASE")
            .unwrap_or_else(|_| "goud_chain_dev_passphrase_v3_change_in_production".to_string());

        // Derive 32-byte key from passphrase using simple SHA256 hash
        let mut hasher = Sha256::new();
        hasher.update(passphrase.as_bytes());
        Ok(hasher.finalize().to_vec())
    }

    /// Get HTTP bind address
    pub fn http_bind_addr(&self) -> String {
        format!("0.0.0.0:{}", self.http_port)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Invalid port number in P2P_PORT environment variable")]
    InvalidPort,

    #[error("Invalid master chain key format - must be 64-character hex string (32 bytes)")]
    InvalidMasterKey,
}

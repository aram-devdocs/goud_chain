use std::{env, fs, path::Path};
use uuid::Uuid;

use crate::constants::DATA_DIRECTORY;

/// Configuration for the Goud Chain node
#[derive(Debug, Clone)]
pub struct Config {
    pub node_id: String,
    pub http_port: String,
    pub p2p_port: u16,
    pub peers: Vec<String>,
    pub jwt_secret: Vec<u8>,
    pub session_secret: Vec<u8>,
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

        // Load JWT secret (auto-generate if not present)
        let jwt_secret = Self::load_jwt_secret()?;

        // Load session secret (auto-generate if not present)
        let session_secret = Self::load_session_secret()?;

        Ok(Config {
            node_id,
            http_port,
            p2p_port,
            peers,
            jwt_secret,
            session_secret,
        })
    }

    /// Load JWT secret from environment or file, auto-generate if missing
    fn load_jwt_secret() -> Result<Vec<u8>, ConfigError> {
        // Try environment variable first
        if let Ok(secret) = env::var("JWT_SECRET") {
            let secret_bytes = secret.into_bytes();
            if secret_bytes.len() < 32 {
                return Err(ConfigError::WeakJwtSecret);
            }
            return Ok(secret_bytes);
        }

        // Try to load from persistent file
        let secret_path = format!("{}/jwt_secret", DATA_DIRECTORY);
        if Path::new(&secret_path).exists() {
            return Ok(fs::read(&secret_path)?);
        }

        // Auto-generate and persist
        let new_secret: [u8; 32] = rand::random();
        fs::write(&secret_path, new_secret)?;
        Ok(new_secret.to_vec())
    }

    /// Load session secret from environment or file, auto-generate if missing
    fn load_session_secret() -> Result<Vec<u8>, ConfigError> {
        // Try environment variable first
        if let Ok(secret) = env::var("SESSION_SECRET") {
            let secret_bytes = secret.into_bytes();
            if secret_bytes.len() < 32 {
                return Err(ConfigError::WeakSessionSecret);
            }
            return Ok(secret_bytes);
        }

        // Try to load from persistent file
        let secret_path = format!("{}/session_secret", DATA_DIRECTORY);
        if Path::new(&secret_path).exists() {
            return Ok(fs::read(&secret_path)?);
        }

        // Auto-generate and persist
        let new_secret: [u8; 32] = rand::random();
        fs::write(&secret_path, new_secret)?;
        Ok(new_secret.to_vec())
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

    /// Get HTTP bind address
    pub fn http_bind_addr(&self) -> String {
        format!("0.0.0.0:{}", self.http_port)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Invalid port number in P2P_PORT environment variable")]
    InvalidPort,

    #[error("JWT_SECRET must be at least 32 bytes (256 bits)")]
    WeakJwtSecret,

    #[error("SESSION_SECRET must be at least 32 bytes (256 bits)")]
    WeakSessionSecret,

    #[error("Failed to load/save secret: {0}")]
    IoError(#[from] std::io::Error),
}

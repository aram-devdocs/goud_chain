use std::collections::HashMap;
use std::{env, fs, path::Path};
use uuid::Uuid;

use crate::constants::DATA_DIRECTORY;

/// Validator configuration - maps node IDs to validator names and addresses
/// This decouples the code from deployment-specific naming (node1, Validator_1, etc.)
#[derive(Debug, Clone, Default)]
pub struct ValidatorConfig {
    /// List of validator names (e.g., ["Validator_1", "Validator_2"])
    pub validators: Vec<String>,
    /// Maps node_id -> validator_name (e.g., "node1" -> "Validator_1")
    pub node_to_validator: HashMap<String, String>,
    /// Maps validator_name -> node_address (e.g., "Validator_1" -> "node1:8080")
    pub validator_to_address: HashMap<String, String>,
}

impl ValidatorConfig {
    /// Get current validator for a block number (round-robin PoA)
    pub fn get_validator_for_block(&self, block_number: u64) -> String {
        let validator_index = (block_number as usize) % self.validators.len();
        self.validators[validator_index].clone()
    }

    /// Check if a node is authorized to create a block
    pub fn is_node_authorized(&self, node_id: &str, block_number: u64) -> bool {
        let expected_validator = self.get_validator_for_block(block_number);
        self.node_to_validator
            .get(node_id)
            .map(|v| v == &expected_validator)
            .unwrap_or(false)
    }

    /// Get node address for a validator
    pub fn get_validator_address(&self, validator: &str) -> Option<String> {
        self.validator_to_address.get(validator).cloned()
    }
}

/// Configuration for the Goud Chain node
#[derive(Debug, Clone)]
pub struct Config {
    pub node_id: String,
    pub http_port: String,
    pub p2p_port: u16,
    pub peers: Vec<String>,
    pub jwt_secret: Vec<u8>,
    pub session_secret: Vec<u8>,
    pub validator_config: ValidatorConfig,
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

        // Load validator configuration
        let validator_config = Self::load_validator_config()?;

        Ok(Config {
            node_id,
            http_port,
            p2p_port,
            peers,
            jwt_secret,
            session_secret,
            validator_config,
        })
    }

    /// Load validator configuration from environment variables
    /// Format:
    ///   VALIDATORS=Validator_1,Validator_2,Validator_3
    ///   VALIDATOR_NODES=node1:Validator_1,node2:Validator_2,node3:Validator_3
    ///   VALIDATOR_ADDRESSES=Validator_1:node1:8080,Validator_2:node2:8080,Validator_3:node3:8080
    fn load_validator_config() -> Result<ValidatorConfig, ConfigError> {
        // Parse validators list
        let validators: Vec<String> = env::var("VALIDATORS")
            .unwrap_or_else(|_| {
                // Default to 2-validator setup for backwards compatibility
                "Validator_1,Validator_2".to_string()
            })
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        if validators.is_empty() {
            return Err(ConfigError::InvalidValidatorConfig(
                "No validators configured".to_string(),
            ));
        }

        // Parse node-to-validator mapping
        let mut node_to_validator = HashMap::new();
        if let Ok(mapping) = env::var("VALIDATOR_NODES") {
            for entry in mapping.split(',') {
                let parts: Vec<&str> = entry.split(':').collect();
                if parts.len() == 2 {
                    node_to_validator
                        .insert(parts[0].trim().to_string(), parts[1].trim().to_string());
                }
            }
        } else {
            // Default mapping for backwards compatibility
            node_to_validator.insert("node1".to_string(), "Validator_1".to_string());
            node_to_validator.insert("node2".to_string(), "Validator_2".to_string());
            node_to_validator.insert("node3".to_string(), "Validator_3".to_string());
        }

        // Parse validator-to-address mapping
        let mut validator_to_address = HashMap::new();
        if let Ok(mapping) = env::var("VALIDATOR_ADDRESSES") {
            for entry in mapping.split(',') {
                let parts: Vec<&str> = entry.split(':').collect();
                if parts.len() == 3 {
                    let validator = parts[0].trim();
                    let address = format!("{}:{}", parts[1].trim(), parts[2].trim());
                    validator_to_address.insert(validator.to_string(), address);
                }
            }
        } else {
            // Default addresses for backwards compatibility
            let node1_addr = env::var("NODE1_ADDR").unwrap_or_else(|_| "node1:8080".to_string());
            let node2_addr = env::var("NODE2_ADDR").unwrap_or_else(|_| "node2:8080".to_string());
            let node3_addr = env::var("NODE3_ADDR").unwrap_or_else(|_| "node3:8080".to_string());

            validator_to_address.insert("Validator_1".to_string(), node1_addr);
            validator_to_address.insert("Validator_2".to_string(), node2_addr);
            validator_to_address.insert("Validator_3".to_string(), node3_addr);
        }

        Ok(ValidatorConfig {
            validators,
            node_to_validator,
            validator_to_address,
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

    #[error("Invalid validator configuration: {0}")]
    InvalidValidatorConfig(String),

    #[error("Failed to load/save secret: {0}")]
    IoError(#[from] std::io::Error),
}

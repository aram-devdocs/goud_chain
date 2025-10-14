use std::env;
use uuid::Uuid;

/// Configuration for the Goud Chain node
#[derive(Debug, Clone)]
pub struct Config {
    pub node_id: String,
    pub http_port: String,
    pub p2p_port: u16,
    pub peers: Vec<String>,
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

        Ok(Config {
            node_id,
            http_port,
            p2p_port,
            peers,
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

    /// Get HTTP bind address
    pub fn http_bind_addr(&self) -> String {
        format!("0.0.0.0:{}", self.http_port)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Invalid port number in P2P_PORT environment variable")]
    InvalidPort,
}

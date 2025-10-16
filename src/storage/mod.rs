pub mod audit_log;
pub mod blockchain_store;
pub mod nonce_store;
pub mod rate_limit_store;

use std::fs;
use tracing::{info, warn};

use crate::constants::{DATA_DIRECTORY, SCHEMA_VERSION};
use crate::crypto::generate_signing_key;
use crate::domain::Blockchain;
use crate::types::{GoudChainError, Result};

// Re-export storage modules
pub use self::audit_log::AuditLogger;
pub use self::blockchain_store::BlockchainStore;
pub use self::nonce_store::NonceStore;
pub use self::rate_limit_store::{BanLevel, RateLimitStore};

/// Load the blockchain from RocksDB or create a new one
/// Handles schema versioning automatically
pub fn load_blockchain(
    node_id: String,
    validator_config: crate::config::ValidatorConfig,
    store: &BlockchainStore,
) -> Result<Blockchain> {
    // Check if RocksDB has data
    if !store.is_empty() {
        info!("Loading blockchain from RocksDB");

        // Load metadata and check schema version
        let (_stored_node_id, stored_schema) = store.load_metadata()?;

        if stored_schema != SCHEMA_VERSION {
            warn!(
                old_schema = %stored_schema,
                new_schema = %SCHEMA_VERSION,
                "Schema version mismatch - clearing RocksDB and creating new blockchain"
            );
            store.clear_all()?;
            info!("Creating new blockchain with schema {}", SCHEMA_VERSION);
            let blockchain = Blockchain::new(node_id.clone(), validator_config.clone())?;

            // Save genesis block to RocksDB
            if let Some(genesis) = blockchain.chain.first() {
                store.save_block(genesis)?;
                info!("Genesis block saved to RocksDB");
            }

            store.save_metadata(&node_id, SCHEMA_VERSION)?;
            return Ok(blockchain);
        }

        // Load chain from RocksDB
        let chain = store.load_chain()?;
        let checkpoints = store.load_checkpoints()?;

        info!(
            chain_length = chain.len(),
            checkpoints = checkpoints.len(),
            schema_version = %stored_schema,
            "Blockchain loaded from RocksDB"
        );

        // Reconstruct blockchain
        Ok(Blockchain {
            schema_version: SCHEMA_VERSION.to_string(),
            chain,
            node_id,
            checkpoints,
            pending_accounts_with_keys: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: Some(generate_signing_key()),
            validator_config,
        })
    } else {
        // RocksDB is empty - create new blockchain
        info!("No existing blockchain found, creating new one");
        let blockchain = Blockchain::new(node_id.clone(), validator_config)?;

        // Save genesis block to RocksDB
        if let Some(genesis) = blockchain.chain.first() {
            store.save_block(genesis)?;
            info!("Genesis block saved to RocksDB");
        }

        store.save_metadata(&node_id, SCHEMA_VERSION)?;
        Ok(blockchain)
    }
}

/// Initialize the data directory
pub fn init_data_directory() -> Result<()> {
    fs::create_dir_all(DATA_DIRECTORY)
        .map_err(|e| GoudChainError::DirectoryCreationFailed(e.to_string()))?;
    Ok(())
}

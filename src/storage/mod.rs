pub mod blockchain_store;

use std::fs;
use tracing::{info, warn};

use crate::constants::{DATA_DIRECTORY, SCHEMA_VERSION};
use crate::crypto::generate_signing_key;
use crate::domain::Blockchain;
use crate::types::{GoudChainError, Result};

// Re-export storage modules
pub use self::blockchain_store::BlockchainStore;

/// Load the blockchain from RocksDB or create a new one
/// Handles schema migration and JSON-to-RocksDB conversion automatically
pub fn load_blockchain(
    node_id: String,
    master_chain_key: Vec<u8>,
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
            let blockchain = Blockchain::new(node_id.clone(), master_chain_key.clone())?;
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
            pending_accounts: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: Some(generate_signing_key()),
            master_chain_key,
        })
    } else {
        // RocksDB is empty - check for legacy JSON file
        check_json_migration(&node_id, &master_chain_key, store)
    }
}

/// Check if JSON file exists and migrate to RocksDB
fn check_json_migration(
    node_id: &str,
    master_chain_key: &[u8],
    store: &BlockchainStore,
) -> Result<Blockchain> {
    // Legacy JSON path (keeping for migration)
    const LEGACY_JSON_PATH: &str = "/data/blockchain.json";

    match fs::read_to_string(LEGACY_JSON_PATH) {
        Ok(content) => {
            warn!("Found legacy JSON blockchain file - migrating to RocksDB");

            // Try to parse JSON
            match serde_json::from_str::<Blockchain>(&content) {
                Ok(mut blockchain) => {
                    // Update runtime fields
                    blockchain.node_id = node_id.to_string();
                    blockchain.pending_accounts = Vec::new();
                    blockchain.pending_collections = Vec::new();
                    blockchain.node_signing_key = Some(generate_signing_key());
                    blockchain.master_chain_key = master_chain_key.to_vec();

                    info!(
                        chain_length = blockchain.chain.len(),
                        "Migrating {} blocks from JSON to RocksDB",
                        blockchain.chain.len()
                    );

                    // Migrate to RocksDB
                    store.migrate_from_json(&blockchain)?;

                    // Rename JSON file to .backup
                    if let Err(e) = fs::rename(LEGACY_JSON_PATH, "/data/blockchain.json.backup") {
                        warn!(error = %e, "Failed to rename JSON file to backup");
                    } else {
                        info!("Legacy JSON file backed up to blockchain.json.backup");
                    }

                    Ok(blockchain)
                }
                Err(e) => {
                    warn!(
                        error = %e,
                        "Failed to parse legacy JSON file - creating new blockchain"
                    );

                    // Delete corrupted JSON
                    if let Err(e) = fs::remove_file(LEGACY_JSON_PATH) {
                        warn!(error = %e, "Failed to delete corrupted JSON file");
                    }

                    let blockchain =
                        Blockchain::new(node_id.to_string(), master_chain_key.to_vec())?;
                    store.save_metadata(node_id, SCHEMA_VERSION)?;
                    Ok(blockchain)
                }
            }
        }
        Err(_) => {
            // No JSON file found - create new blockchain
            info!("No existing blockchain found, creating new one");
            let blockchain = Blockchain::new(node_id.to_string(), master_chain_key.to_vec())?;
            store.save_metadata(node_id, SCHEMA_VERSION)?;
            Ok(blockchain)
        }
    }
}

/// Initialize the data directory
pub fn init_data_directory() -> Result<()> {
    fs::create_dir_all(DATA_DIRECTORY)
        .map_err(|e| GoudChainError::DirectoryCreationFailed(e.to_string()))?;
    Ok(())
}

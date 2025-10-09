use std::fs;
use std::io::Write;
use tracing::{info, warn};

use crate::constants::{BLOCKCHAIN_FILE_PATH, DATA_DIRECTORY, SCHEMA_VERSION};
use crate::crypto::generate_signing_key;
use crate::domain::Blockchain;
use crate::types::{GoudChainError, Result};

/// Save the blockchain to disk
pub fn save_blockchain(blockchain: &Blockchain) -> Result<()> {
    let json = serde_json::to_string_pretty(blockchain)
        .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

    let mut file = fs::File::create(BLOCKCHAIN_FILE_PATH)
        .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

    file.write_all(json.as_bytes())
        .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

    info!("Blockchain saved to disk");
    Ok(())
}

/// Load the blockchain from disk or create a new one
/// Validates schema version and auto-migrates by deleting old data
pub fn load_blockchain(node_id: String, master_chain_key: Vec<u8>) -> Result<Blockchain> {
    match fs::read_to_string(BLOCKCHAIN_FILE_PATH) {
        Ok(content) => {
            // Try to extract just the schema_version field to check compatibility
            let schema_check: serde_json::Result<serde_json::Value> =
                serde_json::from_str(&content);

            match schema_check {
                Ok(value) => {
                    let file_schema = value
                        .get("schema_version")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown");

                    // Check if schema versions match
                    if file_schema != SCHEMA_VERSION {
                        warn!(
                            old_schema = %file_schema,
                            new_schema = %SCHEMA_VERSION,
                            "Schema version mismatch detected - deleting old blockchain and starting fresh"
                        );

                        // Delete the old file
                        fs::remove_file(BLOCKCHAIN_FILE_PATH)
                            .map_err(|e| GoudChainError::LoadFailed(e.to_string()))?;

                        info!("Creating new blockchain with schema {}", SCHEMA_VERSION);
                        return Blockchain::new(node_id, master_chain_key);
                    }

                    // Schema matches, try full deserialization
                    match serde_json::from_str::<Blockchain>(&content) {
                        Ok(blockchain) => {
                            let mut blockchain = blockchain;
                            blockchain.node_id = node_id;
                            blockchain.pending_accounts = Vec::new();
                            blockchain.pending_collections = Vec::new();
                            blockchain.node_signing_key = Some(generate_signing_key());
                            blockchain.master_chain_key = master_chain_key;

                            info!(
                                chain_length = blockchain.chain.len(),
                                schema_version = %blockchain.schema_version,
                                "Blockchain loaded from disk"
                            );
                            Ok(blockchain)
                        }
                        Err(e) => {
                            warn!(
                                error = %e,
                                "Failed to deserialize blockchain (likely schema mismatch) - deleting and starting fresh"
                            );

                            // Delete incompatible file
                            fs::remove_file(BLOCKCHAIN_FILE_PATH)
                                .map_err(|e| GoudChainError::LoadFailed(e.to_string()))?;

                            info!("Creating new blockchain with schema {}", SCHEMA_VERSION);
                            Blockchain::new(node_id, master_chain_key)
                        }
                    }
                }
                Err(e) => {
                    warn!(
                        error = %e,
                        "Failed to parse blockchain file - deleting and starting fresh"
                    );

                    // Delete corrupted file
                    fs::remove_file(BLOCKCHAIN_FILE_PATH)
                        .map_err(|e| GoudChainError::LoadFailed(e.to_string()))?;

                    info!("Creating new blockchain with schema {}", SCHEMA_VERSION);
                    Blockchain::new(node_id, master_chain_key.clone())
                }
            }
        }
        Err(_) => {
            info!("No existing blockchain found, creating new one");
            Blockchain::new(node_id, master_chain_key)
        }
    }
}

/// Initialize the data directory
pub fn init_data_directory() -> Result<()> {
    fs::create_dir_all(DATA_DIRECTORY)
        .map_err(|e| GoudChainError::DirectoryCreationFailed(e.to_string()))?;
    Ok(())
}

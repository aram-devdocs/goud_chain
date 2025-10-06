use std::fs;
use std::io::Write;
use tracing::info;

use crate::constants::{BLOCKCHAIN_FILE_PATH, DATA_DIRECTORY};
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
pub fn load_blockchain(node_id: String) -> Result<Blockchain> {
    match fs::read_to_string(BLOCKCHAIN_FILE_PATH) {
        Ok(content) => {
            let mut blockchain: Blockchain = serde_json::from_str(&content)
                .map_err(|e| GoudChainError::LoadFailed(e.to_string()))?;

            blockchain.node_id = node_id;
            blockchain.pending_data = Vec::new();
            blockchain.node_signing_key = Some(generate_signing_key());

            info!(
                chain_length = blockchain.chain.len(),
                "Blockchain loaded from disk"
            );
            Ok(blockchain)
        }
        Err(_) => {
            info!("Creating new blockchain");
            Blockchain::new(node_id)
        }
    }
}

/// Initialize the data directory
pub fn init_data_directory() -> Result<()> {
    fs::create_dir_all(DATA_DIRECTORY)
        .map_err(|e| GoudChainError::DirectoryCreationFailed(e.to_string()))?;
    Ok(())
}

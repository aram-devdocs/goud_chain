use chrono::Utc;
use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use super::{
    block::{generate_block_salt, Block, BlockConfig},
    encrypted_collection::EncryptedCollection,
    user_account::UserAccount,
};
use crate::constants::{
    CHECKPOINT_INTERVAL, GENESIS_PREVIOUS_HASH, SCHEMA_VERSION, TIMESTAMP_TOLERANCE_SECONDS,
};
use crate::crypto::{generate_account_blind_index_with_salt, generate_signing_key};
use crate::types::{GoudChainError, Result};

/// Get the current validator for a given block number (round-robin)
pub fn get_current_validator(block_number: u64) -> String {
    let validators = crate::constants::VALIDATORS;
    let index = (block_number % validators.len() as u64) as usize;
    validators[index].to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub schema_version: String,
    pub chain: Vec<Block>,
    pub node_id: String,
    pub checkpoints: Vec<String>,
    #[serde(skip)]
    pub pending_accounts: Vec<UserAccount>,
    #[serde(skip)]
    pub pending_collections: Vec<EncryptedCollection>,
    #[serde(skip)]
    pub node_signing_key: Option<SigningKey>,
    #[serde(skip)]
    pub master_chain_key: Vec<u8>,
}

impl Blockchain {
    /// Create a new blockchain with genesis block
    pub fn new(node_id: String, master_chain_key: Vec<u8>) -> Result<Self> {
        info!(
            node_id = %node_id,
            schema = %SCHEMA_VERSION,
            "Creating new blockchain with deterministic genesis"
        );
        info!(
            "Master key hash (first 8 bytes): {}",
            hex::encode(&master_chain_key[..8])
        );

        let signing_key = generate_signing_key();
        let validator = get_current_validator(0);

        let genesis = Block::new(BlockConfig {
            index: 0,
            user_accounts: Vec::new(),
            encrypted_collections: Vec::new(),
            previous_hash: GENESIS_PREVIOUS_HASH.to_string(),
            validator,
            blind_indexes: Vec::new(),
            block_salt: String::from("genesis_salt"),
            master_key: &master_chain_key,
        })?;

        info!(
            genesis_hash = %genesis.hash,
            genesis_nonce = %genesis.nonce,
            genesis_timestamp = genesis.timestamp,
            "Genesis block created - ALL NODES MUST HAVE IDENTICAL HASH"
        );

        Ok(Blockchain {
            schema_version: SCHEMA_VERSION.to_string(),
            chain: vec![genesis],
            node_id,
            checkpoints: Vec::new(),
            pending_accounts: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: Some(signing_key),
            master_chain_key,
        })
    }

    /// Get the latest block in the chain
    pub fn get_latest_block(&self) -> Result<&Block> {
        self.chain.last().ok_or(GoudChainError::EmptyBlockchain)
    }

    /// Add a user account to pending queue
    pub fn add_account(&mut self, account: UserAccount) -> Result<()> {
        account.verify()?;
        self.pending_accounts.push(account);
        Ok(())
    }

    /// Add an encrypted collection to pending queue
    pub fn add_collection(&mut self, collection: EncryptedCollection) -> Result<()> {
        collection.verify(None)?;
        self.pending_collections.push(collection);
        Ok(())
    }

    /// Create a block from pending accounts and collections
    pub fn add_block(&mut self) -> Result<Block> {
        if self.pending_accounts.is_empty() && self.pending_collections.is_empty() {
            return Err(GoudChainError::NoPendingData);
        }

        let previous_block = self.get_latest_block()?;
        let block_number = previous_block.index + 1;
        let validator = get_current_validator(block_number);

        // Generate random salt for this block
        let block_salt = generate_block_salt();

        // Generate blind indexes for all accounts and collections using block-specific salt
        let mut blind_indexes = Vec::new();

        for account in &self.pending_accounts {
            let blind_index =
                generate_account_blind_index_with_salt(&account.api_key_hash, &block_salt)?;
            blind_indexes.push(blind_index);
        }

        // Collections already have owner_api_key_hash for blind index generation
        // We generate a blind index for each collection owner
        for collection in &self.pending_collections {
            let blind_index = generate_account_blind_index_with_salt(
                &collection.owner_api_key_hash,
                &block_salt,
            )?;
            if !blind_indexes.contains(&blind_index) {
                blind_indexes.push(blind_index);
            }
        }

        let new_block = Block::new(BlockConfig {
            index: block_number,
            user_accounts: self.pending_accounts.clone(),
            encrypted_collections: self.pending_collections.clone(),
            previous_hash: previous_block.hash.clone(),
            validator: validator.clone(),
            blind_indexes,
            block_salt,
            master_key: &self.master_chain_key,
        })?;

        info!(
            block_number = new_block.index,
            validator = %validator,
            accounts = self.pending_accounts.len(),
            collections = self.pending_collections.len(),
            "Block created with accounts and collections"
        );

        self.chain.push(new_block.clone());
        self.pending_accounts.clear();
        self.pending_collections.clear();

        // Create checkpoint
        #[allow(unknown_lints)]
        #[allow(clippy::manual_is_multiple_of)]
        if new_block.index % CHECKPOINT_INTERVAL == 0 {
            self.checkpoints.push(new_block.hash.clone());
            info!(block_number = new_block.index, "Checkpoint created");
        }

        Ok(new_block)
    }

    /// Validate the entire blockchain
    pub fn is_valid(&self) -> Result<()> {
        for i in 1..self.chain.len() {
            let current = &self.chain[i];
            let previous = &self.chain[i - 1];

            // Validate hash
            if current.hash != current.calculate_hash() {
                return Err(GoudChainError::InvalidBlockHash(i as u64));
            }

            // Validate chain link
            if current.previous_hash != previous.hash {
                return Err(GoudChainError::BrokenChain(i as u64));
            }

            // Validate timestamp
            let now = Utc::now().timestamp();
            if current.timestamp > now + TIMESTAMP_TOLERANCE_SECONDS {
                return Err(GoudChainError::FutureTimestamp(current.timestamp));
            }
            if current.timestamp < previous.timestamp {
                return Err(GoudChainError::InvalidTimestamp(i as u64));
            }

            // Validate merkle root
            if current.merkle_root
                != Block::calculate_merkle_root(
                    &current.encrypted_block_data,
                    &current.blind_indexes,
                )
            {
                return Err(GoudChainError::InvalidMerkleRoot(i as u64));
            }

            // Validate all encrypted data (decrypt and verify signatures)
            current.verify_data(&self.master_chain_key)?;

            // Validate validator authorization (decrypt to get validator name)
            let block_data = current.decrypt_data(&self.master_chain_key)?;
            let expected_validator = get_current_validator(current.index);
            if block_data.validator != expected_validator {
                return Err(GoudChainError::InvalidValidator {
                    index: i as u64,
                    expected: expected_validator,
                    actual: block_data.validator.clone(),
                });
            }
        }
        Ok(())
    }

    /// Replace the chain with a new one if it's longer and valid
    pub fn replace_chain(&mut self, new_chain: Vec<Block>) -> Result<bool> {
        // Don't reorganize past checkpoints
        if let Some(last_checkpoint_hash) = self.checkpoints.last() {
            if let Some(checkpoint_block) =
                self.chain.iter().find(|b| &b.hash == last_checkpoint_hash)
            {
                if new_chain.len() <= checkpoint_block.index as usize {
                    warn!("Chain reorganization blocked by checkpoint");
                    return Ok(false);
                }
            }
        }

        let temp_blockchain = Blockchain {
            schema_version: self.schema_version.clone(),
            chain: new_chain.clone(),
            node_id: self.node_id.clone(),
            checkpoints: self.checkpoints.clone(),
            pending_accounts: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: None,
            master_chain_key: self.master_chain_key.clone(),
        };

        // Use chain length (longest chain wins in PoA)
        if new_chain.len() > self.chain.len() {
            temp_blockchain.is_valid()?;
            info!(
                old_length = self.chain.len(),
                new_length = new_chain.len(),
                "Replacing chain"
            );
            self.chain = new_chain;
            return Ok(true);
        }

        Ok(false)
    }

    /// Find an account by API key hash using per-block salted blind indexes
    pub fn find_account(&self, api_key_hash: &str) -> Option<UserAccount> {
        // Search blocks - must try each block's salt
        for block in &self.chain {
            // Generate blind index using this block's salt
            let blind_index =
                match generate_account_blind_index_with_salt(api_key_hash, &block.block_salt) {
                    Ok(idx) => idx,
                    Err(_) => continue,
                };

            // Check if this block contains the blind index
            if block.blind_indexes.contains(&blind_index) {
                // Decrypt block data
                if let Ok(block_data) = block.decrypt_data(&self.master_chain_key) {
                    for account in &block_data.accounts {
                        if account.api_key_hash == api_key_hash {
                            return Some(account.clone());
                        }
                    }
                }
            }
        }
        None
    }

    /// Find a collection by ID using blind indexes
    pub fn find_collection(&self, collection_id: &str) -> Option<EncryptedCollection> {
        // We need to search all blocks since we don't know the owner's API key hash
        for block in &self.chain {
            // Decrypt block data
            if let Ok(block_data) = block.decrypt_data(&self.master_chain_key) {
                for collection in &block_data.collections {
                    if collection.collection_id == collection_id {
                        return Some(collection.clone());
                    }
                }
            }
        }
        None
    }

    /// Find all collections owned by an API key hash using per-block salted blind indexes
    pub fn find_collections_by_owner(&self, api_key_hash: &str) -> Vec<EncryptedCollection> {
        let mut results = Vec::new();

        // Search blocks - must try each block's salt
        for block in &self.chain {
            // Generate blind index using this block's salt
            let blind_index =
                match generate_account_blind_index_with_salt(api_key_hash, &block.block_salt) {
                    Ok(idx) => idx,
                    Err(_) => continue,
                };

            // Check if this block contains the blind index
            if block.blind_indexes.contains(&blind_index) {
                // Decrypt block data
                if let Ok(block_data) = block.decrypt_data(&self.master_chain_key) {
                    for collection in &block_data.collections {
                        if collection.owner_api_key_hash == api_key_hash {
                            results.push(collection.clone());
                        }
                    }
                }
            }
        }

        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blockchain_creation() {
        let master_key = b"test_master_key_32_bytes_long!!".to_vec();
        let blockchain = Blockchain::new("test-node".to_string(), master_key).unwrap();
        assert_eq!(blockchain.chain.len(), 1);
        assert!(blockchain.is_valid().is_ok());
    }

    #[test]
    fn test_add_block() {
        let master_key = b"test_master_key_32_bytes_long!!".to_vec();
        let blockchain = Blockchain::new("test-node".to_string(), master_key).unwrap();
        assert_eq!(blockchain.chain.len(), 1); // Genesis block
        assert!(blockchain.is_valid().is_ok());
    }
}

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
use crate::crypto::{
    generate_account_blind_index_with_salt, generate_signing_key, hash_api_key_hex,
};
use crate::types::{GoudChainError, Result};

/// Get the current validator for a given block number (round-robin)
pub fn get_current_validator(block_number: u64) -> String {
    let validators = crate::constants::VALIDATORS;
    let index = (block_number % validators.len() as u64) as usize;
    validators[index].to_string()
}

/// Check if a node is authorized to be a validator for a given block
/// In PoA, we map node IDs to validator names deterministically
pub fn is_authorized_validator(node_id: &str, block_number: u64) -> bool {
    let expected_validator = get_current_validator(block_number);

    // Map node IDs to validator names
    // node1 -> Validator_1, node2 -> Validator_2, etc.
    let node_validator = match node_id {
        "node1" => "Validator_1",
        "node2" => "Validator_2",
        "node3" => "Validator_3",
        _ => {
            // For unknown node IDs, check if node_id matches validator name directly
            return node_id == expected_validator;
        }
    };

    node_validator == expected_validator
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub schema_version: String,
    pub chain: Vec<Block>,
    pub node_id: String,
    pub checkpoints: Vec<String>,
    #[serde(skip)]
    pub pending_accounts_with_keys: Vec<(UserAccount, Vec<u8>)>, // (account, api_key) for envelope creation
    #[serde(skip)]
    pub pending_collections: Vec<EncryptedCollection>,
    #[serde(skip)]
    pub node_signing_key: Option<SigningKey>,
}

impl Blockchain {
    /// Create a new zero-knowledge blockchain with genesis block
    pub fn new(node_id: String) -> Result<Self> {
        info!(
            node_id = %node_id,
            schema = %SCHEMA_VERSION,
            "Creating new zero-knowledge blockchain with deterministic genesis"
        );

        let signing_key = generate_signing_key();
        let validator = get_current_validator(0);

        let genesis = Block::new(BlockConfig {
            index: 0,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: GENESIS_PREVIOUS_HASH.to_string(),
            validator,
            blind_indexes: Vec::new(),
            block_salt: String::from("genesis_salt"),
        })?;

        info!(
            genesis_hash = %genesis.hash,
            genesis_timestamp = genesis.timestamp,
            "Genesis block created - ALL NODES MUST HAVE IDENTICAL HASH"
        );

        Ok(Blockchain {
            schema_version: SCHEMA_VERSION.to_string(),
            chain: vec![genesis],
            node_id,
            checkpoints: Vec::new(),
            pending_accounts_with_keys: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: Some(signing_key),
        })
    }

    /// Get the latest block in the chain
    pub fn get_latest_block(&self) -> Result<&Block> {
        self.chain.last().ok_or(GoudChainError::EmptyBlockchain)
    }

    pub fn add_account_with_key(&mut self, account: UserAccount, api_key: Vec<u8>) -> Result<()> {
        // Skip signature verification (happens during chain validation)
        self.pending_accounts_with_keys.push((account, api_key));
        Ok(())
    }

    pub fn add_collection(&mut self, collection: EncryptedCollection) -> Result<()> {
        // Skip signature verification (happens during chain validation)
        self.pending_collections.push(collection);
        Ok(())
    }

    /// Create a block from pending accounts and collections
    /// Only the designated PoA validator can create blocks (enforces consensus)
    pub fn add_block(&mut self) -> Result<Block> {
        use super::envelope::{encrypt_account_envelope, CollectionEnvelope};

        if self.pending_accounts_with_keys.is_empty() && self.pending_collections.is_empty() {
            return Err(GoudChainError::NoPendingData);
        }

        let previous_block = self.get_latest_block()?;
        let block_number = previous_block.index + 1;
        let validator = get_current_validator(block_number);

        // Proof of Authority: Only the designated validator can create this block
        if !is_authorized_validator(&self.node_id, block_number) {
            warn!(
                node_id = %self.node_id,
                block_number = block_number,
                expected_validator = %validator,
                "Node not authorized to create block - only designated PoA validator can create blocks"
            );
            return Err(GoudChainError::NotAuthorizedValidator {
                node_id: self.node_id.clone(),
                expected_validator: validator,
                block_number,
            });
        }

        // Generate random salt for this block
        let block_salt = generate_block_salt();

        // Encrypt accounts into envelopes
        let mut account_envelopes = Vec::new();
        for (account, api_key) in &self.pending_accounts_with_keys {
            let envelope = encrypt_account_envelope(account, api_key, &block_salt)?;
            account_envelopes.push(envelope);
        }

        // Wrap collections in envelopes (collections already encrypted with user's API key)
        let collection_envelopes: Vec<CollectionEnvelope> = self
            .pending_collections
            .iter()
            .map(|c| CollectionEnvelope {
                collection: c.clone(),
            })
            .collect();

        // Lazy blind index generation (defer HMAC until search time)
        let blind_indexes = Vec::new();

        let new_block = Block::new(BlockConfig {
            index: block_number,
            account_envelopes,
            collection_envelopes,
            previous_hash: previous_block.hash.clone(),
            validator: validator.clone(),
            blind_indexes,
            block_salt,
        })?;

        info!(
            block_number = new_block.index,
            validator = %validator,
            accounts = self.pending_accounts_with_keys.len(),
            collections = self.pending_collections.len(),
            "Block created with encrypted envelopes"
        );

        self.chain.push(new_block.clone());
        self.pending_accounts_with_keys.clear();
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

            // Validate all user data signatures (no decryption - zero-knowledge)
            current.verify_data()?;

            // Validate validator authorization (plaintext field)
            let expected_validator = get_current_validator(current.index);
            if current.validator != expected_validator {
                return Err(GoudChainError::InvalidValidator {
                    index: i as u64,
                    expected: expected_validator,
                    actual: current.validator.clone(),
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
            pending_accounts_with_keys: Vec::new(),
            pending_collections: Vec::new(),
            node_signing_key: None,
        };

        // Chain selection logic with tie-breaking
        let should_replace = if new_chain.len() > self.chain.len() {
            // Longer chain always wins
            true
        } else if new_chain.len() == self.chain.len() && new_chain.len() > 1 {
            // Equal length chains: use tie-breaking rules
            // This handles the case where nodes create different blocks simultaneously

            // First, check if chains are identical (common case after sync)
            if self
                .chain
                .iter()
                .zip(&new_chain)
                .all(|(a, b)| a.hash == b.hash)
            {
                // Chains are identical, no replacement needed
                false
            } else {
                // Chains have diverged - use tie-breaking rules
                warn!(
                    our_length = self.chain.len(),
                    their_length = new_chain.len(),
                    "Chain divergence detected with equal lengths - applying tie-breaking rules"
                );

                // Tie-breaker 1: Prefer chain with blocks from proper validators
                // (This prevents non-validator nodes from creating conflicting blocks)
                // Compare the last block's validator (most recent divergence point)
                let our_last = &self.chain[self.chain.len() - 1];
                let their_last = &new_chain[new_chain.len() - 1];

                // Check validator authorization (plaintext field - no decryption needed)
                let expected_validator = get_current_validator(our_last.index);

                let our_is_valid = our_last.validator == expected_validator;
                let their_is_valid = their_last.validator == expected_validator;

                if their_is_valid && !our_is_valid {
                    // Their chain has proper validator, ours doesn't - accept theirs
                    info!("Accepting peer chain: created by proper PoA validator");
                    true
                } else if our_is_valid && !their_is_valid {
                    // Our chain has proper validator - keep ours
                    info!("Rejecting peer chain: not created by proper PoA validator");
                    false
                } else {
                    // Both valid or both invalid - use hash tie-breaker
                    // Lexicographically smaller hash wins (deterministic)
                    their_last.hash < our_last.hash
                }
            }
        } else {
            // Shorter or equal length (genesis only) - keep our chain
            false
        };

        if should_replace {
            // Validate the new chain before accepting
            temp_blockchain.is_valid()?;
            info!(
                old_length = self.chain.len(),
                new_length = new_chain.len(),
                old_last_hash = %self.chain.last().map(|b| b.hash.clone()).unwrap_or_default(),
                new_last_hash = %new_chain.last().map(|b| b.hash.clone()).unwrap_or_default(),
                "Replacing chain (tie-breaker applied if equal length)"
            );
            self.chain = new_chain;
            return Ok(true);
        }

        Ok(false)
    }

    /// Find account by API key (requires full API key, not just hash)
    /// Searches all blocks and decrypts matching envelopes
    pub fn find_account(&self, api_key: &[u8]) -> Option<UserAccount> {
        self.find_account_with_hash(api_key, None)
    }

    /// Find account with optional pre-computed hash (optimization)
    pub fn find_account_with_hash(
        &self,
        api_key: &[u8],
        api_key_hash: Option<String>,
    ) -> Option<UserAccount> {
        let api_key_hash = api_key_hash.unwrap_or_else(|| hash_api_key_hex(api_key));

        for block in &self.chain {
            let should_search_block = if block.blind_indexes.is_empty() {
                true
            } else {
                match generate_account_blind_index_with_salt(&api_key_hash, &block.block_salt) {
                    Ok(idx) => block.blind_indexes.contains(&idx),
                    Err(_) => false,
                }
            };

            if should_search_block {
                // Try to decrypt account envelope with user's API key
                if let Ok(Some(account)) = block.get_account(api_key) {
                    return Some(account);
                }
            }
        }
        None
    }

    /// Find a collection by ID (requires API key to decrypt envelope and verify ownership)
    /// Returns None if collection not found or user doesn't own it
    pub fn find_collection(
        &self,
        collection_id: &str,
        api_key: &[u8],
    ) -> Option<EncryptedCollection> {
        let api_key_hash = hash_api_key_hex(api_key);

        // Search all blocks
        for block in &self.chain {
            // Get collections for this user
            if let Ok(collections) = block.get_collections_by_owner(api_key) {
                for collection in collections {
                    if collection.collection_id == collection_id
                        && collection.owner_api_key_hash == api_key_hash
                    {
                        return Some(collection);
                    }
                }
            }
        }
        None
    }

    /// Find all collections owned by user (requires API key to access envelopes)
    pub fn find_collections_by_owner(&self, api_key: &[u8]) -> Vec<EncryptedCollection> {
        let api_key_hash = hash_api_key_hex(api_key);
        let mut results = Vec::new();

        for block in &self.chain {
            let should_search_block = if block.blind_indexes.is_empty() {
                true
            } else {
                match generate_account_blind_index_with_salt(&api_key_hash, &block.block_salt) {
                    Ok(idx) => block.blind_indexes.contains(&idx),
                    Err(_) => false,
                }
            };

            if should_search_block {
                // Get collections from envelope
                if let Ok(collections) = block.get_collections_by_owner(api_key) {
                    results.extend(collections);
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
        let blockchain = Blockchain::new("test-node".to_string()).unwrap();
        assert_eq!(blockchain.chain.len(), 1);
        assert!(blockchain.is_valid().is_ok());
    }

    #[test]
    fn test_add_block() {
        let blockchain = Blockchain::new("test-node".to_string()).unwrap();
        assert_eq!(blockchain.chain.len(), 1); // Genesis block
        assert!(blockchain.is_valid().is_ok());
    }
}

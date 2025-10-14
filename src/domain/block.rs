use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use rand::Rng;
use serde::{Deserialize, Serialize};

use super::{
    encrypted_collection::EncryptedCollection,
    envelope::{AccountEnvelope, BlockEnvelopeContainer, CollectionEnvelope},
    user_account::UserAccount,
};
use crate::constants::{EMPTY_MERKLE_ROOT, GENESIS_TIMESTAMP, TIMESTAMP_GRANULARITY_SECONDS};
use crate::crypto::hash_api_key;
use crate::types::{GoudChainError, Result};

/// Generate a random 32-byte salt for blind index generation
pub fn generate_block_salt() -> String {
    let mut rng = rand::thread_rng();
    let salt_bytes: [u8; 32] = rng.gen();
    hex::encode(salt_bytes)
}

/// Obfuscate timestamp to hourly granularity for privacy
/// Rounds down to the nearest hour to hide exact activity timing
fn obfuscate_timestamp(timestamp: i64) -> i64 {
    timestamp - (timestamp % TIMESTAMP_GRANULARITY_SECONDS)
}

/// Internal structure for block contents before encryption
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockData {
    pub accounts: Vec<UserAccount>,
    pub collections: Vec<EncryptedCollection>,
    pub validator: String,
}

/// Configuration for creating a new block
pub struct BlockConfig {
    pub index: u64,
    pub account_envelopes: Vec<AccountEnvelope>,
    pub collection_envelopes: Vec<CollectionEnvelope>,
    pub previous_hash: String,
    pub validator: String,
    pub blind_indexes: Vec<String>,
    pub block_salt: String,
}

/// Privacy-preserving block structure (v8 - Envelope Encryption)
/// User data encrypted in per-user envelopes with API-key-derived keys
/// Node operators CANNOT decrypt user data - true zero-knowledge storage
/// Metadata (account IDs, hashes) hidden inside encrypted envelopes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub encrypted_block_data: String, // Base64(BlockEnvelopeContainer) - encrypted envelopes
    pub blind_indexes: Vec<String>,
    pub block_salt: String, // Random salt for blind index generation (prevents correlation)
    pub validator: String,  // Plaintext validator name (needed for consensus validation)
    pub previous_hash: String,
    pub merkle_root: String,
    pub hash: String,
}

impl Block {
    /// Create a new zero-knowledge block with envelope encryption
    /// User data encrypted in per-user envelopes, node operators cannot decrypt
    pub fn new(config: BlockConfig) -> Result<Self> {
        // Genesis block uses fixed timestamp, regular blocks use current time
        let timestamp = if config.index == 0 {
            GENESIS_TIMESTAMP
        } else {
            obfuscate_timestamp(Utc::now().timestamp())
        };

        // Create envelope container
        let envelope_container = BlockEnvelopeContainer {
            account_envelopes: config.account_envelopes,
            collection_envelopes: config.collection_envelopes,
            validator: config.validator.clone(),
        };

        // Serialize envelope container to JSON and encode as Base64
        let container_json = serde_json::to_string(&envelope_container).map_err(|e| {
            GoudChainError::Internal(format!("Failed to serialize envelope container: {}", e))
        })?;
        let encrypted_block_data = general_purpose::STANDARD.encode(container_json);

        // Calculate merkle root over encrypted data
        let merkle_root = Self::calculate_merkle_root(&encrypted_block_data, &config.blind_indexes);

        let mut block = Block {
            index: config.index,
            timestamp,
            encrypted_block_data,
            blind_indexes: config.blind_indexes,
            block_salt: config.block_salt,
            validator: config.validator,
            previous_hash: config.previous_hash,
            merkle_root,
            hash: String::new(),
        };

        block.hash = block.calculate_hash();
        Ok(block)
    }

    pub fn calculate_merkle_root(encrypted_data: &str, blind_indexes: &[String]) -> String {
        if encrypted_data.is_empty() && blind_indexes.is_empty() {
            return EMPTY_MERKLE_ROOT.to_string();
        }

        let mut hashes: Vec<String> = Vec::new();

        let hash = blake3::hash(encrypted_data.as_bytes());
        hashes.push(hash.to_hex().to_string());

        for index in blind_indexes {
            let hash = blake3::hash(index.as_bytes());
            hashes.push(hash.to_hex().to_string());
        }

        // Build Merkle tree
        while hashes.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in hashes.chunks(2) {
                let combined = if chunk.len() == 2 {
                    format!("{}{}", chunk[0], chunk[1])
                } else {
                    chunk[0].clone()
                };
                let hash = blake3::hash(combined.as_bytes());
                next_level.push(hash.to_hex().to_string());
            }
            hashes = next_level;
        }

        hashes[0].clone()
    }

    pub fn calculate_hash(&self) -> String {
        let content = format!(
            "{}{}{}{}{}",
            self.index, self.timestamp, self.merkle_root, self.previous_hash, self.validator
        );
        let hash = blake3::hash(content.as_bytes());
        hash.to_hex().to_string()
    }

    /// Get the envelope container (deserialize Base64 + JSON)
    /// This only deserializes the container structure, does NOT decrypt envelopes
    pub fn get_envelope_container(&self) -> Result<BlockEnvelopeContainer> {
        let container_json = general_purpose::STANDARD
            .decode(&self.encrypted_block_data)
            .map_err(|e| GoudChainError::Internal(format!("Failed to decode Base64: {}", e)))?;

        serde_json::from_slice(&container_json).map_err(|e| {
            GoudChainError::Internal(format!("Failed to deserialize envelope container: {}", e))
        })
    }

    /// Get account by API key (server-side decryption with user's API key)
    /// Returns None if no matching envelope found
    pub fn get_account(&self, api_key: &[u8]) -> Result<Option<UserAccount>> {
        use super::envelope::decrypt_account_envelope;

        let api_key_hash = hash_api_key(api_key);
        let container = self.get_envelope_container()?;

        // Find matching envelope by api_key_hash
        for envelope in container.account_envelopes {
            if envelope.api_key_hash == api_key_hash {
                let account = decrypt_account_envelope(&envelope, api_key, &self.block_salt)?;
                return Ok(Some(account));
            }
        }

        Ok(None)
    }

    /// Get all collections for a specific API key
    /// Returns empty vec if no matching collections found
    pub fn get_collections_by_owner(&self, api_key: &[u8]) -> Result<Vec<EncryptedCollection>> {
        let api_key_hash = hash_api_key(api_key);
        let container = self.get_envelope_container()?;

        let collections = container
            .collection_envelopes
            .into_iter()
            .filter(|env| env.collection.owner_api_key_hash == api_key_hash)
            .map(|env| env.collection)
            .collect();

        Ok(collections)
    }

    /// Get account count (without decrypting)
    /// Useful for statistics/health endpoints
    pub fn get_account_count(&self) -> Result<usize> {
        let container = self.get_envelope_container()?;
        Ok(container.account_envelopes.len())
    }

    /// Get collection count (without decrypting)
    /// Useful for statistics/health endpoints
    pub fn get_collection_count(&self) -> Result<usize> {
        let container = self.get_envelope_container()?;
        Ok(container.collection_envelopes.len())
    }

    /// Verify all encrypted data in this block (signature verification only)
    /// Does NOT decrypt user data - preserves zero-knowledge property
    /// Note: We can only verify collection signatures without decrypting accounts
    pub fn verify_data(&self) -> Result<()> {
        let container = self.get_envelope_container()?;

        // Verify all collection signatures (no MAC verification without user key)
        for collection_env in &container.collection_envelopes {
            collection_env.collection.verify(None)?;
        }

        // Account signatures verified during envelope decryption (when accessed with API key)
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_creation() {
        let block = Block::new(BlockConfig {
            index: 1,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
        })
        .unwrap();

        assert_eq!(block.index, 1);
        assert_eq!(block.previous_hash, "previous_hash");
        assert_eq!(block.validator, "Validator_1");
        assert!(!block.hash.is_empty());
        assert_eq!(block.hash, block.calculate_hash());
        assert!(!block.encrypted_block_data.is_empty());
    }

    #[test]
    fn test_empty_merkle_root() {
        let merkle_root = Block::calculate_merkle_root("", &[]);
        assert_eq!(merkle_root, EMPTY_MERKLE_ROOT);
    }

    #[test]
    fn test_get_envelope_container() {
        let block = Block::new(BlockConfig {
            index: 1,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
        })
        .unwrap();

        let container = block.get_envelope_container().unwrap();
        assert_eq!(container.account_envelopes.len(), 0);
        assert_eq!(container.collection_envelopes.len(), 0);
        assert_eq!(container.validator, "Validator_1");
    }

    #[test]
    fn test_verify_data_signatures() {
        let block = Block::new(BlockConfig {
            index: 1,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
        })
        .unwrap();

        // Should verify successfully (empty block, no signatures to check)
        assert!(block.verify_data().is_ok());
    }

    #[test]
    fn test_get_account_count() {
        let block = Block::new(BlockConfig {
            index: 1,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
        })
        .unwrap();

        assert_eq!(block.get_account_count().unwrap(), 0);
        assert_eq!(block.get_collection_count().unwrap(), 0);
    }
}

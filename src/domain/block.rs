use chrono::Utc;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use super::{encrypted_collection::EncryptedCollection, user_account::UserAccount};
use crate::constants::{
    EMPTY_MERKLE_ROOT, ENCRYPTION_SALT, GENESIS_TIMESTAMP, NONCE_SIZE_BYTES,
    TIMESTAMP_GRANULARITY_SECONDS,
};
use crate::crypto::{
    decrypt_data_with_key, encrypt_data_with_key, encrypt_data_with_nonce, global_key_cache,
};
use crate::types::{GoudChainError, Result};

/// Generate a random 32-byte salt for blind index generation
pub fn generate_block_salt() -> String {
    let mut rng = rand::thread_rng();
    let salt_bytes: [u8; 32] = rng.gen();
    hex::encode(salt_bytes)
}

/// Derive a deterministic nonce for the genesis block
/// This ensures all nodes create identical genesis blocks
pub fn derive_genesis_nonce(master_key: &[u8]) -> [u8; NONCE_SIZE_BYTES] {
    let mut hasher = Sha256::new();
    hasher.update(b"goud_chain_genesis_nonce_v4");
    hasher.update(master_key);
    let hash = hasher.finalize();

    // Take first 12 bytes for nonce
    let mut nonce = [0u8; NONCE_SIZE_BYTES];
    nonce.copy_from_slice(&hash[..NONCE_SIZE_BYTES]);
    nonce
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
pub struct BlockConfig<'a> {
    pub index: u64,
    pub user_accounts: Vec<UserAccount>,
    pub encrypted_collections: Vec<EncryptedCollection>,
    pub previous_hash: String,
    pub validator: String,
    pub blind_indexes: Vec<String>,
    pub block_salt: String,
    pub master_key: &'a [u8],
}

/// Privacy-preserving block structure (v3)
/// All sensitive data is encrypted, only structural metadata exposed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub encrypted_block_data: String,
    pub blind_indexes: Vec<String>,
    pub block_salt: String, // Random salt for blind index generation (prevents correlation)
    pub validator_index: u64,
    pub previous_hash: String,
    pub merkle_root: String,
    pub hash: String,
    pub nonce: String,
}

impl Block {
    /// Create a new privacy-preserving block with encrypted data
    pub fn new(config: BlockConfig) -> Result<Self> {
        // Genesis block uses fixed timestamp, regular blocks use current time
        let timestamp = if config.index == 0 {
            GENESIS_TIMESTAMP
        } else {
            obfuscate_timestamp(Utc::now().timestamp())
        };

        // Create block data structure
        let block_data = BlockData {
            accounts: config.user_accounts,
            collections: config.encrypted_collections,
            validator: config.validator.clone(),
        };

        // Serialize block data
        let block_data_json = serde_json::to_string(&block_data).map_err(|e| {
            GoudChainError::Internal(format!("Failed to serialize block data: {}", e))
        })?;

        let key_cache = global_key_cache();
        let encryption_key = key_cache.get_encryption_key(config.master_key, ENCRYPTION_SALT);
        let (encrypted_block_data, nonce) = if config.index == 0 {
            // Genesis block: deterministic nonce for identical genesis across all nodes
            let genesis_nonce = derive_genesis_nonce(config.master_key);
            encrypt_data_with_nonce(&block_data_json, &encryption_key, &genesis_nonce)?
        } else {
            // Regular blocks: random nonce for security
            encrypt_data_with_key(&block_data_json, &encryption_key)?
        };

        // Calculate validator index (obfuscated)
        let validator_index = Self::calculate_validator_index(&config.validator, config.index);

        // Calculate merkle root
        let merkle_root = Self::calculate_merkle_root(&encrypted_block_data, &config.blind_indexes);

        let mut block = Block {
            index: config.index,
            timestamp,
            encrypted_block_data,
            blind_indexes: config.blind_indexes,
            block_salt: config.block_salt,
            validator_index,
            previous_hash: config.previous_hash,
            merkle_root,
            hash: String::new(),
            nonce,
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

    /// Calculate obfuscated validator index
    fn calculate_validator_index(validator: &str, block_index: u64) -> u64 {
        let combined = format!("{}{}", validator, block_index);
        let mut hasher = Sha256::new();
        hasher.update(combined.as_bytes());
        let hash_bytes = hasher.finalize();

        // Use first 8 bytes of hash as u64
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&hash_bytes[0..8]);
        u64::from_le_bytes(bytes)
    }

    pub fn calculate_hash(&self) -> String {
        let content = format!(
            "{}{}{}{}{}",
            self.index, self.timestamp, self.merkle_root, self.previous_hash, self.validator_index
        );
        let hash = blake3::hash(content.as_bytes());
        hash.to_hex().to_string()
    }

    /// Decrypt block data with master key
    pub fn decrypt_data(&self, master_key: &[u8]) -> Result<BlockData> {
        let key_cache = global_key_cache();
        let encryption_key = key_cache.get_encryption_key(master_key, ENCRYPTION_SALT);
        let decrypted_json = decrypt_data_with_key(&self.encrypted_block_data, &encryption_key)?;

        serde_json::from_str(&decrypted_json).map_err(|e| {
            GoudChainError::Internal(format!("Failed to deserialize block data: {}", e))
        })
    }

    /// Verify all encrypted data in this block
    pub fn verify_data(&self, master_key: &[u8]) -> Result<()> {
        let block_data = self.decrypt_data(master_key)?;

        // Verify all accounts
        for account in &block_data.accounts {
            account.verify()?;
        }

        // Verify all collections (signature only, not MAC)
        for collection in &block_data.collections {
            collection.verify(None)?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_creation() {
        let master_key = b"test_master_key_32_bytes_long!!";
        let block = Block::new(BlockConfig {
            index: 1,
            user_accounts: Vec::new(),
            encrypted_collections: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
            master_key,
        })
        .unwrap();

        assert_eq!(block.index, 1);
        assert_eq!(block.previous_hash, "previous_hash");
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
    fn test_decrypt_block_data() {
        let master_key = b"test_master_key_32_bytes_long!!";
        let block = Block::new(BlockConfig {
            index: 1,
            user_accounts: Vec::new(),
            encrypted_collections: Vec::new(),
            previous_hash: "previous_hash".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
            master_key,
        })
        .unwrap();

        let decrypted = block.decrypt_data(master_key).unwrap();
        assert_eq!(decrypted.accounts.len(), 0);
        assert_eq!(decrypted.collections.len(), 0);
        assert_eq!(decrypted.validator, "Validator_1");
    }

    #[test]
    fn test_validator_index_obfuscation() {
        let index1 = Block::calculate_validator_index("Validator_1", 1);
        let index2 = Block::calculate_validator_index("Validator_1", 2);
        let index3 = Block::calculate_validator_index("Validator_2", 1);

        // Different block indexes should produce different validator indexes
        assert_ne!(index1, index2);
        // Different validators should produce different indexes
        assert_ne!(index1, index3);
    }
}

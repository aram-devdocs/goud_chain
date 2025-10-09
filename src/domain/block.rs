use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use super::{encrypted_collection::EncryptedCollection, user_account::UserAccount};
use crate::constants::EMPTY_MERKLE_ROOT;
use crate::types::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub user_accounts: Vec<UserAccount>,
    pub encrypted_collections: Vec<EncryptedCollection>,
    pub previous_hash: String,
    pub merkle_root: String,
    pub hash: String,
    pub validator: String,
}

impl Block {
    /// Create a new block with accounts and collections
    pub fn new(
        index: u64,
        user_accounts: Vec<UserAccount>,
        encrypted_collections: Vec<EncryptedCollection>,
        previous_hash: String,
        validator: String,
    ) -> Self {
        let timestamp = Utc::now().timestamp();
        let merkle_root = Self::calculate_merkle_root(&user_accounts, &encrypted_collections);

        let mut block = Block {
            index,
            timestamp,
            user_accounts,
            encrypted_collections,
            previous_hash,
            merkle_root,
            hash: String::new(),
            validator,
        };

        block.hash = block.calculate_hash();
        block
    }

    /// Calculate the merkle root from accounts and collections
    pub fn calculate_merkle_root(
        accounts: &[UserAccount],
        collections: &[EncryptedCollection],
    ) -> String {
        if accounts.is_empty() && collections.is_empty() {
            return EMPTY_MERKLE_ROOT.to_string();
        }

        let mut hashes: Vec<String> = Vec::new();

        // Hash all accounts
        for account in accounts {
            let account_hash = format!("{}{}", account.account_id, account.api_key_hash);
            let mut hasher = Sha256::new();
            hasher.update(account_hash.as_bytes());
            hashes.push(format!("{:x}", hasher.finalize()));
        }

        // Hash all collections
        for collection in collections {
            hashes.push(collection.hash());
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
                let mut hasher = Sha256::new();
                hasher.update(combined.as_bytes());
                next_level.push(format!("{:x}", hasher.finalize()));
            }
            hashes = next_level;
        }

        hashes[0].clone()
    }

    /// Calculate the hash of this block
    pub fn calculate_hash(&self) -> String {
        let content = format!(
            "{}{}{}{}{}",
            self.index, self.timestamp, self.merkle_root, self.previous_hash, self.validator
        );
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Verify all encrypted data in this block
    pub fn verify_data(&self) -> Result<()> {
        // Verify all accounts
        for account in &self.user_accounts {
            account.verify()?;
        }

        // Verify all collections (signature only, not MAC)
        for collection in &self.encrypted_collections {
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
        let block = Block::new(
            1,
            Vec::new(),
            Vec::new(),
            "previous_hash".to_string(),
            "Validator_1".to_string(),
        );

        assert_eq!(block.index, 1);
        assert_eq!(block.previous_hash, "previous_hash");
        assert!(!block.hash.is_empty());
        assert_eq!(block.hash, block.calculate_hash());
    }

    #[test]
    fn test_empty_merkle_root() {
        let merkle_root = Block::calculate_merkle_root(&[], &[]);
        assert_eq!(merkle_root, EMPTY_MERKLE_ROOT);
    }
}

use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use super::encrypted_data::EncryptedData;
use crate::constants::EMPTY_MERKLE_ROOT;
use crate::types::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub encrypted_data: Vec<EncryptedData>,
    pub previous_hash: String,
    pub merkle_root: String,
    pub hash: String,
    pub validator: String,
}

impl Block {
    /// Create a new block with the given data
    pub fn new(
        index: u64,
        encrypted_data: Vec<EncryptedData>,
        previous_hash: String,
        validator: String,
    ) -> Self {
        let timestamp = Utc::now().timestamp();
        let merkle_root = Self::calculate_merkle_root(&encrypted_data);

        let mut block = Block {
            index,
            timestamp,
            encrypted_data,
            previous_hash,
            merkle_root,
            hash: String::new(),
            validator,
        };

        block.hash = block.calculate_hash();
        block
    }

    /// Calculate the merkle root from encrypted data entries
    pub fn calculate_merkle_root(encrypted_data: &[EncryptedData]) -> String {
        if encrypted_data.is_empty() {
            return EMPTY_MERKLE_ROOT.to_string();
        }

        let mut hashes: Vec<String> = encrypted_data.iter().map(|d| d.hash()).collect();

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
        for data in &self.encrypted_data {
            data.verify()?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::generate_signing_key;

    #[test]
    fn test_block_creation() {
        let signing_key = generate_signing_key();
        let data = EncryptedData::new(
            "Test".to_string(),
            r#"{"value": 42}"#.to_string(),
            "1234",
            &signing_key,
        )
        .unwrap();

        let block = Block::new(
            1,
            vec![data],
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
        let merkle_root = Block::calculate_merkle_root(&[]);
        assert_eq!(merkle_root, EMPTY_MERKLE_ROOT);
    }
}

use chrono::Utc;
use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use super::{block::Block, encrypted_data::EncryptedData};
use crate::constants::{
    CHECKPOINT_INTERVAL, GENESIS_DATA, GENESIS_LABEL, GENESIS_PIN, GENESIS_PREVIOUS_HASH,
    TIMESTAMP_TOLERANCE_SECONDS,
};
use crate::crypto::generate_signing_key;
use crate::types::{GoudChainError, Result};

/// Get the current validator for a given block number (round-robin)
pub fn get_current_validator(block_number: u64) -> String {
    let validators = crate::constants::VALIDATORS;
    let index = (block_number % validators.len() as u64) as usize;
    validators[index].to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub node_id: String,
    pub checkpoints: Vec<String>,
    #[serde(skip)]
    pub pending_data: Vec<EncryptedData>,
    #[serde(skip)]
    pub node_signing_key: Option<SigningKey>,
}

impl Blockchain {
    /// Create a new blockchain with genesis block
    pub fn new(node_id: String) -> Result<Self> {
        let signing_key = generate_signing_key();

        let genesis_data = EncryptedData::new(
            GENESIS_LABEL.to_string(),
            GENESIS_DATA.to_string(),
            GENESIS_PIN,
            &signing_key,
        )?;

        let validator = get_current_validator(0);
        let mut genesis = Block {
            index: 0,
            timestamp: Utc::now().timestamp(),
            encrypted_data: vec![genesis_data],
            previous_hash: GENESIS_PREVIOUS_HASH.to_string(),
            merkle_root: String::new(),
            hash: String::new(),
            validator,
        };

        genesis.merkle_root = Block::calculate_merkle_root(&genesis.encrypted_data);
        genesis.hash = genesis.calculate_hash();

        Ok(Blockchain {
            chain: vec![genesis],
            node_id,
            checkpoints: Vec::new(),
            pending_data: Vec::new(),
            node_signing_key: Some(signing_key),
        })
    }

    /// Get the latest block in the chain
    pub fn get_latest_block(&self) -> Result<&Block> {
        self.chain.last().ok_or(GoudChainError::EmptyBlockchain)
    }

    /// Add a new block with pending data
    pub fn add_block(&mut self) -> Result<Block> {
        if self.pending_data.is_empty() {
            return Err(GoudChainError::NoPendingData);
        }

        let previous_block = self.get_latest_block()?;
        let block_number = previous_block.index + 1;
        let validator = get_current_validator(block_number);

        let new_block = Block::new(
            block_number,
            self.pending_data.clone(),
            previous_block.hash.clone(),
            validator,
        );

        info!(
            block_number = new_block.index,
            validator = %new_block.validator,
            "Block created"
        );

        self.chain.push(new_block.clone());
        self.pending_data.clear();

        // Create checkpoint
        #[allow(unknown_lints)]
        #[allow(clippy::manual_is_multiple_of)]
        if new_block.index % CHECKPOINT_INTERVAL == 0 {
            self.checkpoints.push(new_block.hash.clone());
            info!(block_number = new_block.index, "Checkpoint created");
        }

        Ok(new_block)
    }

    /// Add encrypted data to pending queue
    pub fn add_encrypted_data(&mut self, data: EncryptedData) -> Result<()> {
        data.verify()?;
        self.pending_data.push(data);
        Ok(())
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
            if current.merkle_root != Block::calculate_merkle_root(&current.encrypted_data) {
                return Err(GoudChainError::InvalidMerkleRoot(i as u64));
            }

            // Validate all encrypted data
            current.verify_data()?;

            // Validate validator authorization
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
            chain: new_chain.clone(),
            node_id: self.node_id.clone(),
            checkpoints: self.checkpoints.clone(),
            pending_data: Vec::new(),
            node_signing_key: None,
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

    /// Find encrypted data by ID
    pub fn find_data(&self, data_id: &str) -> Option<EncryptedData> {
        for block in &self.chain {
            for data in &block.encrypted_data {
                if data.data_id == data_id {
                    return Some(data.clone());
                }
            }
        }
        None
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
        let mut blockchain = Blockchain::new("test-node".to_string()).unwrap();
        let signing_key = generate_signing_key();

        let data = EncryptedData::new(
            "Test".to_string(),
            r#"{"value": 42}"#.to_string(),
            "1234",
            &signing_key,
        )
        .unwrap();

        blockchain.add_encrypted_data(data).unwrap();
        let block = blockchain.add_block().unwrap();

        assert_eq!(block.index, 1);
        assert_eq!(blockchain.chain.len(), 2);
        assert!(blockchain.is_valid().is_ok());
    }
}

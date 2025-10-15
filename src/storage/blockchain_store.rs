//! RocksDB storage layer for blockchain persistence.
//! Layer 3: Persistence - Handles blockchain storage using RocksDB for high performance.
//!
//! **Storage Schema:**
//! - `block:{index}` → Bincode-serialized Block
//! - `metadata:chain_length` → u64 (number of blocks)
//! - `metadata:schema_version` → String
//! - `metadata:node_id` → String
//! - `checkpoint:{index}` → Block hash
//!
//! **Performance Benefits:**
//! - O(1) block writes (vs O(n) for JSON full serialization)
//! - O(1) block reads by index
//! - Snappy compression (50% disk space reduction)
//! - Incremental writes (only new blocks, not entire chain)

use rocksdb::DB;
use std::sync::Arc;
use tracing::{info, warn};

use crate::constants::{CHECKPOINT_INTERVAL, ROCKSDB_PATH};
use crate::domain::{Block, Blockchain};
use crate::types::{GoudChainError, Result};

/// Thread-safe wrapper around RocksDB for blockchain storage
pub struct BlockchainStore {
    db: Arc<DB>,
}

impl BlockchainStore {
    /// Initialize RocksDB at the configured path with optimized settings
    pub fn new() -> Result<Self> {
        info!(path = %ROCKSDB_PATH, "Opening RocksDB for blockchain storage");

        let mut opts = rocksdb::Options::default();
        opts.create_if_missing(true);
        opts.set_write_buffer_size(64 * 1024 * 1024);
        opts.set_max_write_buffer_number(3);
        opts.set_min_write_buffer_number_to_merge(1);
        opts.set_compression_type(rocksdb::DBCompressionType::Lz4);
        opts.set_manual_wal_flush(true);
        opts.set_level_compaction_dynamic_level_bytes(true);

        let db = DB::open(&opts, ROCKSDB_PATH)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        info!("BlockchainStore initialized with optimized settings");

        Ok(Self { db: Arc::new(db) })
    }

    /// Get the underlying RocksDB instance (for rate limiting and other extensions)
    pub fn get_db(&self) -> Arc<DB> {
        Arc::clone(&self.db)
    }

    pub fn save_block(&self, block: &Block) -> Result<()> {
        let block_bytes = bincode::serialize(block)
            .map_err(|e| GoudChainError::SaveFailed(format!("Bincode serialization: {}", e)))?;

        let mut batch = rocksdb::WriteBatch::default();

        let block_key = format!("block:{}", block.index);
        batch.put(block_key.as_bytes(), &block_bytes);

        let chain_length = block.index + 1;
        batch.put(b"metadata:chain_length", chain_length.to_le_bytes());
        self.db
            .write(batch)
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

        info!(block_index = block.index, "Block saved to RocksDB");
        Ok(())
    }

    /// Save checkpoint (block hash at checkpoint interval)
    pub fn save_checkpoint(&self, block_index: u64, block_hash: &str) -> Result<()> {
        let checkpoint_key = format!("checkpoint:{}", block_index);
        self.db
            .put(checkpoint_key.as_bytes(), block_hash.as_bytes())
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

        info!(block_index = block_index, "Checkpoint saved to RocksDB");
        Ok(())
    }

    /// Save blockchain metadata (schema version, node ID)
    pub fn save_metadata(&self, node_id: &str, schema_version: &str) -> Result<()> {
        self.db
            .put(b"metadata:node_id", node_id.as_bytes())
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

        self.db
            .put(b"metadata:schema_version", schema_version.as_bytes())
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

        info!("Blockchain metadata saved to RocksDB");
        Ok(())
    }

    /// Load the entire blockchain from RocksDB
    pub fn load_chain(&self) -> Result<Vec<Block>> {
        // Get chain length
        let chain_length = match self.db.get(b"metadata:chain_length") {
            Ok(Some(bytes)) => {
                let mut length_bytes = [0u8; 8];
                length_bytes.copy_from_slice(&bytes);
                u64::from_le_bytes(length_bytes)
            }
            Ok(None) => {
                info!("No blockchain found in RocksDB");
                return Ok(Vec::new());
            }
            Err(e) => {
                return Err(GoudChainError::LoadFailed(format!(
                    "Failed to read chain length: {}",
                    e
                )))
            }
        };

        info!(
            chain_length = chain_length,
            "Loading blockchain from RocksDB"
        );

        // Load all blocks
        let mut chain = Vec::with_capacity(chain_length as usize);
        for index in 0..chain_length {
            let block_key = format!("block:{}", index);
            match self.db.get(block_key.as_bytes()) {
                Ok(Some(bytes)) => {
                    let block: Block = bincode::deserialize(&bytes).map_err(|e| {
                        GoudChainError::LoadFailed(format!("Bincode deserialization: {}", e))
                    })?;
                    chain.push(block);
                }
                Ok(None) => {
                    return Err(GoudChainError::LoadFailed(format!(
                        "Missing block at index {}",
                        index
                    )))
                }
                Err(e) => {
                    return Err(GoudChainError::LoadFailed(format!(
                        "Failed to read block {}: {}",
                        index, e
                    )))
                }
            }
        }

        info!(
            blocks_loaded = chain.len(),
            "Blockchain loaded from RocksDB"
        );
        Ok(chain)
    }

    /// Load blockchain metadata (schema version)
    pub fn load_metadata(&self) -> Result<(String, String)> {
        let node_id = match self.db.get(b"metadata:node_id") {
            Ok(Some(bytes)) => String::from_utf8(bytes)
                .map_err(|e| GoudChainError::LoadFailed(format!("Invalid node_id: {}", e)))?,
            Ok(None) => String::from("unknown"),
            Err(e) => {
                return Err(GoudChainError::LoadFailed(format!(
                    "Failed to read node_id: {}",
                    e
                )))
            }
        };

        let schema_version = match self.db.get(b"metadata:schema_version") {
            Ok(Some(bytes)) => String::from_utf8(bytes).map_err(|e| {
                GoudChainError::LoadFailed(format!("Invalid schema_version: {}", e))
            })?,
            Ok(None) => String::from("unknown"),
            Err(e) => {
                return Err(GoudChainError::LoadFailed(format!(
                    "Failed to read schema_version: {}",
                    e
                )))
            }
        };

        Ok((node_id, schema_version))
    }

    /// Load checkpoints from RocksDB
    pub fn load_checkpoints(&self) -> Result<Vec<String>> {
        let mut checkpoints = Vec::new();
        let mut index = CHECKPOINT_INTERVAL;

        // Scan for checkpoints (every CHECKPOINT_INTERVAL blocks)
        loop {
            let checkpoint_key = format!("checkpoint:{}", index);
            match self.db.get(checkpoint_key.as_bytes()) {
                Ok(Some(bytes)) => {
                    let hash = String::from_utf8(bytes).map_err(|e| {
                        GoudChainError::LoadFailed(format!("Invalid checkpoint hash: {}", e))
                    })?;
                    checkpoints.push(hash);
                    index += CHECKPOINT_INTERVAL;
                }
                Ok(None) => break, // No more checkpoints
                Err(e) => {
                    return Err(GoudChainError::LoadFailed(format!(
                        "Failed to read checkpoint: {}",
                        e
                    )))
                }
            }
        }

        info!(
            checkpoint_count = checkpoints.len(),
            "Checkpoints loaded from RocksDB"
        );
        Ok(checkpoints)
    }

    /// Check if RocksDB contains blockchain data
    pub fn is_empty(&self) -> bool {
        self.db.get(b"metadata:chain_length").unwrap().is_none()
    }

    /// Migrate from JSON file to RocksDB (one-time migration)
    pub fn migrate_from_json(&self, blockchain: &Blockchain) -> Result<()> {
        warn!("Migrating blockchain from JSON to RocksDB");

        // Save all blocks
        for block in &blockchain.chain {
            self.save_block(block)?;
        }

        // Save checkpoints
        for (i, checkpoint_hash) in blockchain.checkpoints.iter().enumerate() {
            let block_index = (i as u64 + 1) * CHECKPOINT_INTERVAL;
            self.save_checkpoint(block_index, checkpoint_hash)?;
        }

        // Save metadata
        self.save_metadata(&blockchain.node_id, &blockchain.schema_version)?;

        info!(
            blocks = blockchain.chain.len(),
            checkpoints = blockchain.checkpoints.len(),
            "Migration to RocksDB complete"
        );

        Ok(())
    }

    /// Clear all blockchain data (for testing/reset)
    #[allow(dead_code)]
    pub fn clear_all(&self) -> Result<()> {
        warn!("Clearing all blockchain data from RocksDB");

        // Get chain length
        let chain_length = match self.db.get(b"metadata:chain_length") {
            Ok(Some(bytes)) => {
                let mut length_bytes = [0u8; 8];
                length_bytes.copy_from_slice(&bytes);
                u64::from_le_bytes(length_bytes)
            }
            Ok(None) => return Ok(()), // Already empty
            Err(e) => {
                return Err(GoudChainError::SaveFailed(format!(
                    "Failed to read chain length: {}",
                    e
                )))
            }
        };

        // Delete all blocks
        for index in 0..chain_length {
            let block_key = format!("block:{}", index);
            self.db
                .delete(block_key.as_bytes())
                .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;
        }

        // Delete metadata
        self.db
            .delete(b"metadata:chain_length")
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;
        self.db
            .delete(b"metadata:node_id")
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;
        self.db
            .delete(b"metadata:schema_version")
            .map_err(|e| GoudChainError::SaveFailed(e.to_string()))?;

        info!("All blockchain data cleared from RocksDB");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::block::BlockConfig;
    use rocksdb::DB;
    use std::sync::Arc;

    // Helper function to create a test store with temporary directory
    fn create_test_store() -> BlockchainStore {
        let temp_dir = std::env::temp_dir().join(format!("test_rocksdb_{}", rand::random::<u64>()));
        let db = DB::open_default(&temp_dir).expect("Failed to open test DB");
        BlockchainStore { db: Arc::new(db) }
    }

    #[test]
    fn test_save_and_load_block() {
        let store = create_test_store();
        store.clear_all().unwrap();

        let block = Block::new(BlockConfig {
            index: 0,
            account_envelopes: Vec::new(),
            collection_envelopes: Vec::new(),
            previous_hash: "0".to_string(),
            validator: "Validator_1".to_string(),
            blind_indexes: Vec::new(),
            block_salt: "test_salt".to_string(),
        })
        .unwrap();

        // Save block
        store.save_block(&block).unwrap();

        // Load chain
        let chain = store.load_chain().unwrap();
        assert_eq!(chain.len(), 1);
        assert_eq!(chain[0].index, 0);
        assert_eq!(chain[0].hash, block.hash);
    }

    #[test]
    fn test_save_and_load_metadata() {
        let store = create_test_store();
        store.clear_all().unwrap();

        store.save_metadata("node1", "v6_rocksdb").unwrap();

        let (node_id, schema_version) = store.load_metadata().unwrap();
        assert_eq!(node_id, "node1");
        assert_eq!(schema_version, "v6_rocksdb");
    }
}

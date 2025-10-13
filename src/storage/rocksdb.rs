//! RocksDB storage layer for key-value operations.
//! Layer 3: Persistence - Handles database operations using RocksDB.

use rocksdb::{IteratorMode, DB};
use std::sync::Arc;
use tracing::{info, warn};

use crate::constants::ROCKSDB_PATH;
use crate::domain::KeyValue;
use crate::types::{GoudChainError, Result};

/// Thread-safe wrapper around RocksDB
pub struct RocksDbStore {
    db: Arc<DB>,
}

impl RocksDbStore {
    /// Initialize RocksDB at the configured path
    pub fn new() -> Result<Self> {
        info!(path = %ROCKSDB_PATH, "Opening RocksDB database");

        let db = DB::open_default(ROCKSDB_PATH)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        info!("RocksDB initialized successfully");

        Ok(Self { db: Arc::new(db) })
    }

    /// Store a key-value pair
    pub fn put(&self, key: &str, value: &str) -> Result<()> {
        self.db
            .put(key.as_bytes(), value.as_bytes())
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        info!(key = %key, "Stored key-value pair");
        Ok(())
    }

    /// Retrieve a value by key
    pub fn get(&self, key: &str) -> Result<String> {
        let result = self
            .db
            .get(key.as_bytes())
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        match result {
            Some(bytes) => {
                let value = String::from_utf8(bytes)
                    .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;
                info!(key = %key, "Retrieved value");
                Ok(value)
            }
            None => {
                warn!(key = %key, "Key not found");
                Err(GoudChainError::KeyNotFound(key.to_string()))
            }
        }
    }

    /// Delete a key-value pair
    pub fn delete(&self, key: &str) -> Result<()> {
        // Check if key exists first
        let exists = self
            .db
            .get(key.as_bytes())
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?
            .is_some();

        if !exists {
            return Err(GoudChainError::KeyNotFound(key.to_string()));
        }

        self.db
            .delete(key.as_bytes())
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        info!(key = %key, "Deleted key");
        Ok(())
    }

    /// List all keys in the database
    pub fn list_keys(&self) -> Result<Vec<String>> {
        let mut keys = Vec::new();

        let iter = self.db.iterator(IteratorMode::Start);
        for item in iter {
            match item {
                Ok((key, _)) => {
                    let key_str = String::from_utf8(key.to_vec())
                        .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;
                    keys.push(key_str);
                }
                Err(e) => {
                    return Err(GoudChainError::RocksDbError(e.to_string()));
                }
            }
        }

        info!(count = keys.len(), "Listed all keys");
        Ok(keys)
    }

    /// List all key-value pairs in the database
    pub fn list_all(&self) -> Result<Vec<KeyValue>> {
        let mut pairs = Vec::new();

        let iter = self.db.iterator(IteratorMode::Start);
        for item in iter {
            match item {
                Ok((key, value)) => {
                    let key_str = String::from_utf8(key.to_vec())
                        .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;
                    let value_str = String::from_utf8(value.to_vec())
                        .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

                    pairs.push(KeyValue::new(key_str, value_str));
                }
                Err(e) => {
                    return Err(GoudChainError::RocksDbError(e.to_string()));
                }
            }
        }

        info!(count = pairs.len(), "Listed all key-value pairs");
        Ok(pairs)
    }
}

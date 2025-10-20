//! Migration: add_metadata_index
//!
//! Description: Example migration that demonstrates adding a new RocksDB key namespace
//! for indexing block metadata. This is a template showing up/down pattern.
//!
//! Safety: This migration has direct RocksDB access and runs with full privileges.
//! Ensure all operations are idempotent and can be safely rolled back.

use crate::storage::BlockchainStore;
use crate::storage::Migration;
use crate::types::{GoudChainError, Result};
use rocksdb::WriteBatch;

pub struct Migration20240101120000AddMetadataIndex;

impl Migration20240101120000AddMetadataIndex {
    pub fn new() -> Self {
        Self
    }
}

impl Migration for Migration20240101120000AddMetadataIndex {
    fn version(&self) -> &str {
        "20240101120000"
    }

    fn description(&self) -> &str {
        "add_metadata_index"
    }

    fn up(&self, store: &BlockchainStore) -> Result<()> {
        // Example: Create a new key namespace for metadata indexing
        // In a real migration, you would:
        // 1. Read existing data
        // 2. Transform it
        // 3. Write new index entries
        // 4. Use WriteBatch for atomic operations

        let db = store.get_db();
        let mut batch = WriteBatch::default();

        // Example: Add metadata index marker
        batch.put(b"metadata:index:enabled", b"true");

        // Example: Add migration metadata
        batch.put(
            b"metadata:index:created_at",
            chrono::Utc::now().timestamp().to_string().as_bytes(),
        );

        // Atomic write
        db.write(batch)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        Ok(())
    }

    fn down(&self, store: &BlockchainStore) -> Result<()> {
        // Revert changes made in up()
        // This MUST restore database to exact state before migration

        let db = store.get_db();
        let mut batch = WriteBatch::default();

        // Remove all keys created in up()
        batch.delete(b"metadata:index:enabled");
        batch.delete(b"metadata:index:created_at");

        // Atomic write
        db.write(batch)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tempfile::TempDir;

    fn create_test_store() -> (TempDir, Arc<BlockchainStore>) {
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path().join("rocksdb");
        let store = BlockchainStore::new_with_path(&temp_path.to_string_lossy()).unwrap();
        (temp_dir, Arc::new(store))
    }

    #[test]
    fn test_migration_up_down() {
        let (_temp_dir, store) = create_test_store();
        let migration = Migration20240101120000AddMetadataIndex::new();

        let db = store.get_db();

        // Verify keys don't exist before migration
        assert!(db.get(b"metadata:index:enabled").unwrap().is_none());

        // Apply migration
        migration.up(&store).unwrap();

        // Verify keys created
        let enabled = db.get(b"metadata:index:enabled").unwrap();
        assert!(enabled.is_some());
        assert_eq!(&enabled.unwrap()[..], b"true");

        // Rollback migration
        migration.down(&store).unwrap();

        // Verify keys removed
        assert!(db.get(b"metadata:index:enabled").unwrap().is_none());
        assert!(db.get(b"metadata:index:created_at").unwrap().is_none());
    }

    #[test]
    fn test_migration_idempotent() {
        let (_temp_dir, store) = create_test_store();
        let migration = Migration20240101120000AddMetadataIndex::new();

        // Apply twice - should not fail
        migration.up(&store).unwrap();
        migration.up(&store).unwrap();

        // Rollback twice - should not fail
        migration.down(&store).unwrap();
        migration.down(&store).unwrap();
    }
}

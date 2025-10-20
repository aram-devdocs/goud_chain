//! RocksDB persistence layer for migration state tracking.
//!
//! This module provides the `MigrationStore` which manages migration metadata
//! in RocksDB using atomic operations. It tracks which migrations have been applied
//! and maintains the current schema version.

use crate::storage::blockchain_store::BlockchainStore;
use crate::storage::migration::MigrationMetadata;
use crate::types::{GoudChainError, Result};
use rocksdb::WriteBatch;

/// RocksDB key prefixes for migration state
const MIGRATION_APPLIED_PREFIX: &str = "migration:applied:";
const MIGRATION_CURRENT_SCHEMA: &str = "migration:current_schema";

/// Manages migration state in RocksDB
///
/// Uses the following key schema:
/// - `migration:applied:{version}` → `MigrationMetadata` (Bincode serialized)
/// - `migration:current_schema` → `String` (UTF-8 encoded version)
pub struct MigrationStore<'a> {
    store: &'a BlockchainStore,
}

impl<'a> MigrationStore<'a> {
    /// Create a new MigrationStore wrapping an existing BlockchainStore
    pub fn new(store: &'a BlockchainStore) -> Self {
        Self { store }
    }

    /// Get list of all applied migrations, sorted by version (oldest first)
    pub fn get_applied_migrations(&self) -> Result<Vec<MigrationMetadata>> {
        let mut migrations = Vec::new();
        let db = self.store.get_db();

        // Scan all keys with migration:applied: prefix
        let iter = db.prefix_iterator(MIGRATION_APPLIED_PREFIX.as_bytes());

        for item in iter {
            let (key, value) = item.map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

            // Only process keys that start with our prefix
            let key_str = String::from_utf8(key.to_vec()).map_err(GoudChainError::Utf8Error)?;

            if !key_str.starts_with(MIGRATION_APPLIED_PREFIX) {
                break; // Prefix scan completed
            }

            let metadata: MigrationMetadata = bincode::deserialize(&value)
                .map_err(|e| GoudChainError::DeserializationError(e.to_string()))?;

            migrations.push(metadata);
        }

        // Sort by version (timestamp) to ensure correct order
        migrations.sort_by(|a, b| a.version.cmp(&b.version));

        Ok(migrations)
    }

    /// Check if a migration has been applied
    pub fn is_applied(&self, version: &str) -> Result<bool> {
        let key = format!("{}{}", MIGRATION_APPLIED_PREFIX, version);
        let db = self.store.get_db();

        match db.get(key.as_bytes()) {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(GoudChainError::RocksDbError(e.to_string())),
        }
    }


    /// Mark a migration as applied (atomic operation)
    ///
    /// Uses WriteBatch to atomically update both migration metadata and current schema.
    pub fn mark_applied(&self, metadata: &MigrationMetadata) -> Result<()> {
        let key = format!("{}{}", MIGRATION_APPLIED_PREFIX, metadata.version);
        let db = self.store.get_db();

        let mut batch = WriteBatch::default();

        // Serialize metadata
        let serialized = bincode::serialize(metadata)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Add to batch: migration metadata + current schema update
        batch.put(key.as_bytes(), &serialized);
        batch.put(
            MIGRATION_CURRENT_SCHEMA.as_bytes(),
            metadata.version.as_bytes(),
        );

        // Atomic write
        db.write(batch)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        Ok(())
    }

    /// Remove a migration record (for rollback)
    ///
    /// This removes the migration from applied list and updates current schema
    /// to the previous migration version (or empty if no migrations remain).
    pub fn mark_unapplied(&self, version: &str) -> Result<()> {
        let key = format!("{}{}", MIGRATION_APPLIED_PREFIX, version);
        let db = self.store.get_db();

        let mut batch = WriteBatch::default();

        // Remove migration metadata
        batch.delete(key.as_bytes());

        // Determine new current schema (previous migration or empty)
        let remaining = self
            .get_applied_migrations()?
            .into_iter()
            .filter(|m| m.version != version)
            .collect::<Vec<_>>();

        if let Some(latest) = remaining.last() {
            batch.put(
                MIGRATION_CURRENT_SCHEMA.as_bytes(),
                latest.version.as_bytes(),
            );
        } else {
            batch.delete(MIGRATION_CURRENT_SCHEMA.as_bytes());
        }

        // Atomic write
        db.write(batch)
            .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

        Ok(())
    }

    /// Get the current schema version (latest applied migration)
    pub fn get_current_schema(&self) -> Result<Option<String>> {
        let db = self.store.get_db();

        match db.get(MIGRATION_CURRENT_SCHEMA.as_bytes()) {
            Ok(Some(bytes)) => {
                let version =
                    String::from_utf8(bytes.to_vec()).map_err(GoudChainError::Utf8Error)?;
                Ok(Some(version))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(GoudChainError::RocksDbError(e.to_string())),
        }
    }

    /// Clear all migration state (dangerous - for testing/reset only)
    pub fn clear_all_migrations(&self) -> Result<()> {
        let db = self.store.get_db();
        let mut batch = WriteBatch::default();

        // Delete all migration:applied:* keys
        let iter = db.prefix_iterator(MIGRATION_APPLIED_PREFIX.as_bytes());
        for item in iter {
            let (key, _) = item.map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;

            let key_str = String::from_utf8(key.to_vec()).map_err(GoudChainError::Utf8Error)?;

            if !key_str.starts_with(MIGRATION_APPLIED_PREFIX) {
                break;
            }

            batch.delete(&key);
        }

        // Delete current schema
        batch.delete(MIGRATION_CURRENT_SCHEMA.as_bytes());

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
    fn test_mark_and_get_applied_migration() {
        let (_temp_dir, store) = create_test_store();
        let migration_store = MigrationStore::new(&store);

        let metadata = MigrationMetadata {
            version: "20240101120000".to_string(),
            description: "test_migration".to_string(),
            applied_at: 1704110400,
            checksum: "abc123".to_string(),
        };

        // Mark as applied
        migration_store.mark_applied(&metadata).unwrap();

        // Verify it's applied
        assert!(migration_store.is_applied("20240101120000").unwrap());

        // Get metadata from applied migrations list
        let applied = migration_store.get_applied_migrations().unwrap();
        let retrieved = applied
            .iter()
            .find(|m| m.version == "20240101120000")
            .expect("Migration should be in applied list");
        assert_eq!(retrieved.version, metadata.version);
        assert_eq!(retrieved.description, metadata.description);
    }

    #[test]
    fn test_get_applied_migrations_sorted() {
        let (_temp_dir, store) = create_test_store();
        let migration_store = MigrationStore::new(&store);

        // Apply migrations out of order
        let metadata2 = MigrationMetadata {
            version: "20240102000000".to_string(),
            description: "second_migration".to_string(),
            applied_at: 1704153600,
            checksum: "def456".to_string(),
        };

        let metadata1 = MigrationMetadata {
            version: "20240101000000".to_string(),
            description: "first_migration".to_string(),
            applied_at: 1704067200,
            checksum: "abc123".to_string(),
        };

        migration_store.mark_applied(&metadata2).unwrap();
        migration_store.mark_applied(&metadata1).unwrap();

        // Should return sorted by version
        let applied = migration_store.get_applied_migrations().unwrap();
        assert_eq!(applied.len(), 2);
        assert_eq!(applied[0].version, "20240101000000");
        assert_eq!(applied[1].version, "20240102000000");
    }

    #[test]
    fn test_current_schema_tracking() {
        let (_temp_dir, store) = create_test_store();
        let migration_store = MigrationStore::new(&store);

        // No migrations yet
        assert_eq!(migration_store.get_current_schema().unwrap(), None);

        // Apply first migration
        let metadata1 = MigrationMetadata {
            version: "20240101000000".to_string(),
            description: "first".to_string(),
            applied_at: 1704067200,
            checksum: "abc123".to_string(),
        };
        migration_store.mark_applied(&metadata1).unwrap();
        assert_eq!(
            migration_store.get_current_schema().unwrap(),
            Some("20240101000000".to_string())
        );

        // Apply second migration
        let metadata2 = MigrationMetadata {
            version: "20240102000000".to_string(),
            description: "second".to_string(),
            applied_at: 1704153600,
            checksum: "def456".to_string(),
        };
        migration_store.mark_applied(&metadata2).unwrap();
        assert_eq!(
            migration_store.get_current_schema().unwrap(),
            Some("20240102000000".to_string())
        );
    }

    #[test]
    fn test_mark_unapplied_rollback() {
        let (_temp_dir, store) = create_test_store();
        let migration_store = MigrationStore::new(&store);

        // Apply two migrations
        let metadata1 = MigrationMetadata {
            version: "20240101000000".to_string(),
            description: "first".to_string(),
            applied_at: 1704067200,
            checksum: "abc123".to_string(),
        };
        let metadata2 = MigrationMetadata {
            version: "20240102000000".to_string(),
            description: "second".to_string(),
            applied_at: 1704153600,
            checksum: "def456".to_string(),
        };

        migration_store.mark_applied(&metadata1).unwrap();
        migration_store.mark_applied(&metadata2).unwrap();

        // Rollback second migration
        migration_store.mark_unapplied("20240102000000").unwrap();

        assert!(!migration_store.is_applied("20240102000000").unwrap());
        assert_eq!(
            migration_store.get_current_schema().unwrap(),
            Some("20240101000000".to_string())
        );

        // Rollback first migration
        migration_store.mark_unapplied("20240101000000").unwrap();

        assert_eq!(migration_store.get_current_schema().unwrap(), None);
    }

    #[test]
    fn test_clear_all_migrations() {
        let (_temp_dir, store) = create_test_store();
        let migration_store = MigrationStore::new(&store);

        // Apply migrations
        let metadata1 = MigrationMetadata {
            version: "20240101000000".to_string(),
            description: "first".to_string(),
            applied_at: 1704067200,
            checksum: "abc123".to_string(),
        };
        let metadata2 = MigrationMetadata {
            version: "20240102000000".to_string(),
            description: "second".to_string(),
            applied_at: 1704153600,
            checksum: "def456".to_string(),
        };

        migration_store.mark_applied(&metadata1).unwrap();
        migration_store.mark_applied(&metadata2).unwrap();

        // Clear all
        migration_store.clear_all_migrations().unwrap();

        assert_eq!(migration_store.get_applied_migrations().unwrap().len(), 0);
        assert_eq!(migration_store.get_current_schema().unwrap(), None);
    }
}

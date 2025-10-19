//! Migration execution engine with transaction safety.
//!
//! This module provides the `MigrationRunner` which orchestrates migration execution,
//! handles rollbacks on failure, and manages migration ordering.

use crate::storage::blockchain_store::BlockchainStore;
use crate::storage::migration::{validate_migration_version, Migration, MigrationMetadata};
use crate::storage::migration_store::MigrationStore;
use crate::types::{GoudChainError, Result};
use std::sync::Arc;
use tracing::{error, info, warn};

/// Executes migrations with transaction safety and rollback support
pub struct MigrationRunner {
    store: Arc<BlockchainStore>,
}

impl MigrationRunner {
    /// Create a new MigrationRunner
    pub fn new(store: Arc<BlockchainStore>) -> Self {
        Self { store }
    }

    /// Get list of pending migrations (not yet applied)
    ///
    /// Compares available migrations against applied migrations to determine
    /// which ones need to be run.
    pub fn get_pending_migrations<'a>(
        &self,
        available: &'a [Box<dyn Migration>],
    ) -> Result<Vec<&'a dyn Migration>> {
        let migration_store = MigrationStore::new(&self.store);
        let applied = migration_store.get_applied_migrations()?;
        let applied_versions: Vec<String> = applied.iter().map(|m| m.version.clone()).collect();

        let pending: Vec<&'a dyn Migration> = available
            .iter()
            .map(|b| b.as_ref())
            .filter(|m| !applied_versions.contains(&m.version().to_string()))
            .collect();

        Ok(pending)
    }

    /// Execute a single migration (up)
    ///
    /// Validates version format, executes the migration, and records metadata.
    /// If migration fails, the error is propagated but no state is saved.
    pub fn apply_migration(&self, migration: &dyn Migration) -> Result<()> {
        let version = migration.version();
        let description = migration.description();

        // Validate version format
        validate_migration_version(version)?;

        // Check if already applied
        let migration_store = MigrationStore::new(&self.store);
        if migration_store.is_applied(version)? {
            return Err(GoudChainError::MigrationAlreadyApplied(version.to_string()));
        }

        info!(
            version = %version,
            description = %description,
            "Applying migration"
        );

        // Execute migration up() - if this fails, RocksDB transaction is not committed
        migration.up(&self.store).map_err(|e| {
            error!(
                version = %version,
                description = %description,
                error = %e,
                "Migration failed"
            );
            GoudChainError::MigrationFailed(format!("{}: {}", version, e))
        })?;

        // Record migration as applied
        let metadata = MigrationMetadata {
            version: version.to_string(),
            description: description.to_string(),
            applied_at: chrono::Utc::now().timestamp(),
            checksum: migration.checksum(),
        };

        migration_store.mark_applied(&metadata)?;

        info!(
            version = %version,
            description = %description,
            "Migration applied successfully"
        );

        Ok(())
    }

    /// Execute all pending migrations in order
    ///
    /// Migrations are executed sequentially. If any migration fails,
    /// execution stops and the error is returned. Successfully applied
    /// migrations are not rolled back automatically.
    pub fn apply_pending(&self, available: &[Box<dyn Migration>]) -> Result<(usize, Vec<String>)> {
        let pending = self.get_pending_migrations(available)?;

        if pending.is_empty() {
            info!("No pending migrations");
            return Ok((0, Vec::new()));
        }

        info!(count = pending.len(), "Applying pending migrations");

        let mut applied_versions = Vec::new();

        for migration in pending {
            self.apply_migration(migration)?;
            applied_versions.push(migration.version().to_string());
        }

        info!(
            count = applied_versions.len(),
            "All pending migrations applied"
        );

        Ok((applied_versions.len(), applied_versions))
    }

    /// Rollback a single migration (down)
    ///
    /// Executes the migration's down() method and removes it from applied list.
    /// If rollback fails, the error is propagated.
    pub fn rollback_migration(&self, migration: &dyn Migration) -> Result<()> {
        let version = migration.version();
        let description = migration.description();

        // Check if migration is applied
        let migration_store = MigrationStore::new(&self.store);
        if !migration_store.is_applied(version)? {
            return Err(GoudChainError::MigrationNotFound(version.to_string()));
        }

        warn!(
            version = %version,
            description = %description,
            "Rolling back migration"
        );

        // Execute migration down()
        migration.down(&self.store).map_err(|e| {
            error!(
                version = %version,
                description = %description,
                error = %e,
                "Migration rollback failed"
            );
            GoudChainError::MigrationRollbackFailed(format!("{}: {}", version, e))
        })?;

        // Remove from applied migrations
        migration_store.mark_unapplied(version)?;

        warn!(
            version = %version,
            description = %description,
            "Migration rolled back successfully"
        );

        Ok(())
    }

    /// Rollback the last N applied migrations
    ///
    /// Rolls back migrations in reverse order (newest first).
    pub fn rollback_last(&self, count: usize, available: &[Box<dyn Migration>]) -> Result<usize> {
        let migration_store = MigrationStore::new(&self.store);
        let applied = migration_store.get_applied_migrations()?;

        if applied.is_empty() {
            return Err(GoudChainError::NoMigrationsToRollback);
        }

        let to_rollback = applied
            .iter()
            .rev()
            .take(count)
            .collect::<Vec<&MigrationMetadata>>();

        info!(
            count = to_rollback.len(),
            requested = count,
            "Rolling back migrations"
        );

        let mut rolled_back = 0;

        for metadata in to_rollback {
            // Find corresponding migration in available list
            let migration = available
                .iter()
                .find(|m| m.version() == metadata.version)
                .ok_or_else(|| {
                    GoudChainError::MigrationNotFound(format!(
                        "Migration {} not found in available migrations",
                        metadata.version
                    ))
                })?;

            self.rollback_migration(migration.as_ref())?;
            rolled_back += 1;
        }

        info!(count = rolled_back, "Migrations rolled back");

        Ok(rolled_back)
    }

    /// Reset migration state (clear all applied migrations)
    ///
    /// This is a dangerous operation that clears migration tracking without
    /// running down() methods. Use for development/testing only.
    pub fn reset(&self) -> Result<()> {
        warn!("Resetting migration state (clearing all migration records)");

        let migration_store = MigrationStore::new(&self.store);
        migration_store.clear_all_migrations()?;

        info!("Migration state reset complete");

        Ok(())
    }

    /// Get migration status (applied vs pending)
    pub fn get_status(&self, available: &[Box<dyn Migration>]) -> Result<MigrationStatus> {
        let migration_store = MigrationStore::new(&self.store);
        let applied = migration_store.get_applied_migrations()?;
        let current_schema = migration_store.get_current_schema()?;

        let pending = self.get_pending_migrations(available)?;
        let pending_versions: Vec<String> =
            pending.iter().map(|m| m.version().to_string()).collect();

        Ok(MigrationStatus {
            applied,
            pending: pending_versions,
            current_schema,
        })
    }
}

/// Migration status information
#[derive(Debug)]
pub struct MigrationStatus {
    pub applied: Vec<MigrationMetadata>,
    pub pending: Vec<String>,
    pub current_schema: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tempfile::TempDir;

    // Mock migration for testing
    struct TestMigration {
        version: String,
        description: String,
        should_fail: bool,
    }

    impl Migration for TestMigration {
        fn version(&self) -> &str {
            &self.version
        }

        fn description(&self) -> &str {
            &self.description
        }

        fn up(&self, _store: &BlockchainStore) -> Result<()> {
            if self.should_fail {
                Err(GoudChainError::Internal("test failure".to_string()))
            } else {
                Ok(())
            }
        }

        fn down(&self, _store: &BlockchainStore) -> Result<()> {
            Ok(())
        }
    }

    fn create_test_store() -> (TempDir, Arc<BlockchainStore>) {
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path().join("rocksdb");

        let store = BlockchainStore::new_with_path(&temp_path.to_string_lossy()).unwrap();
        (temp_dir, Arc::new(store))
    }

    #[test]
    fn test_apply_migration_success() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store.clone());

        let migration = TestMigration {
            version: "20240101000000".to_string(),
            description: "test_migration".to_string(),
            should_fail: false,
        };

        let result = runner.apply_migration(&migration);
        assert!(result.is_ok());

        // Verify it's marked as applied
        let migration_store = MigrationStore::new(&store);
        assert!(migration_store.is_applied("20240101000000").unwrap());
    }

    #[test]
    fn test_apply_migration_failure() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store.clone());

        let migration = TestMigration {
            version: "20240101000000".to_string(),
            description: "failing_migration".to_string(),
            should_fail: true,
        };

        let result = runner.apply_migration(&migration);
        assert!(result.is_err());

        // Should NOT be marked as applied
        let migration_store = MigrationStore::new(&store);
        assert!(!migration_store.is_applied("20240101000000").unwrap());
    }

    #[test]
    fn test_apply_pending_migrations() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store.clone());

        let migrations: Vec<Box<dyn Migration>> = vec![
            Box::new(TestMigration {
                version: "20240101000000".to_string(),
                description: "first".to_string(),
                should_fail: false,
            }),
            Box::new(TestMigration {
                version: "20240102000000".to_string(),
                description: "second".to_string(),
                should_fail: false,
            }),
        ];

        let (count, versions) = runner.apply_pending(&migrations).unwrap();
        assert_eq!(count, 2);
        assert_eq!(versions.len(), 2);

        // Verify both applied
        let migration_store = MigrationStore::new(&store);
        assert!(migration_store.is_applied("20240101000000").unwrap());
        assert!(migration_store.is_applied("20240102000000").unwrap());
    }

    #[test]
    fn test_rollback_migration() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store.clone());

        let migration = TestMigration {
            version: "20240101000000".to_string(),
            description: "test".to_string(),
            should_fail: false,
        };

        // Apply then rollback
        runner.apply_migration(&migration).unwrap();
        runner.rollback_migration(&migration).unwrap();

        // Should not be applied
        let migration_store = MigrationStore::new(&store);
        assert!(!migration_store.is_applied("20240101000000").unwrap());
    }

    #[test]
    fn test_rollback_last_multiple() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store.clone());

        let migrations: Vec<Box<dyn Migration>> = vec![
            Box::new(TestMigration {
                version: "20240101000000".to_string(),
                description: "first".to_string(),
                should_fail: false,
            }),
            Box::new(TestMigration {
                version: "20240102000000".to_string(),
                description: "second".to_string(),
                should_fail: false,
            }),
            Box::new(TestMigration {
                version: "20240103000000".to_string(),
                description: "third".to_string(),
                should_fail: false,
            }),
        ];

        // Apply all
        runner.apply_pending(&migrations).unwrap();

        // Rollback last 2
        let count = runner.rollback_last(2, &migrations).unwrap();
        assert_eq!(count, 2);

        // Verify state
        let migration_store = MigrationStore::new(&store);
        assert!(migration_store.is_applied("20240101000000").unwrap());
        assert!(!migration_store.is_applied("20240102000000").unwrap());
        assert!(!migration_store.is_applied("20240103000000").unwrap());
    }

    #[test]
    fn test_migration_status() {
        let (_temp_dir, store) = create_test_store();
        let runner = MigrationRunner::new(store);

        let migrations: Vec<Box<dyn Migration>> = vec![
            Box::new(TestMigration {
                version: "20240101000000".to_string(),
                description: "first".to_string(),
                should_fail: false,
            }),
            Box::new(TestMigration {
                version: "20240102000000".to_string(),
                description: "second".to_string(),
                should_fail: false,
            }),
        ];

        // Apply first only
        runner.apply_migration(migrations[0].as_ref()).unwrap();

        // Check status
        let status = runner.get_status(&migrations).unwrap();
        assert_eq!(status.applied.len(), 1);
        assert_eq!(status.pending.len(), 1);
        assert_eq!(status.current_schema, Some("20240101000000".to_string()));
    }
}

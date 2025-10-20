//! Schema migration framework for blockchain data model evolution.
//!
//! This module provides a trait-based migration system that allows non-destructive
//! schema changes to the blockchain storage layer. Migrations are versioned, tracked
//! in RocksDB, and support both forward (up) and backward (down) operations.

use crate::storage::blockchain_store::BlockchainStore;
use crate::types::{GoudChainError, Result};
use serde::{Deserialize, Serialize};

/// Metadata about an applied migration stored in RocksDB
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MigrationMetadata {
    /// Unique migration version (timestamp format: YYYYMMDDHHMMSS)
    pub version: String,
    /// Human-readable description of the migration
    pub description: String,
    /// Unix timestamp when migration was applied
    pub applied_at: i64,
    /// Hash of the migration file content for integrity verification
    pub checksum: String,
}

/// Trait that all migrations must implement
///
/// # Example
///
/// ```ignore
/// struct Migration20240101000000AddUserIndexes;
///
/// impl Migration for Migration20240101000000AddUserIndexes {
///     fn version(&self) -> &str {
///         "20240101000000"
///     }
///
///     fn description(&self) -> &str {
///         "add_user_indexes"
///     }
///
///     fn up(&self, store: &BlockchainStore) -> Result<()> {
///         // Apply schema changes
///         Ok(())
///     }
///
///     fn down(&self, store: &BlockchainStore) -> Result<()> {
///         // Revert schema changes
///         Ok(())
///     }
/// }
/// ```
pub trait Migration: Send + Sync {
    /// Returns the unique version identifier (timestamp: YYYYMMDDHHMMSS)
    fn version(&self) -> &str;

    /// Returns a human-readable description (snake_case, no spaces)
    fn description(&self) -> &str;

    /// Apply the migration (forward operation)
    ///
    /// This method has direct RocksDB access and can modify any key namespace.
    /// Changes are executed within a RocksDB transaction and will be rolled back
    /// automatically if an error is returned.
    ///
    /// # Arguments
    ///
    /// * `store` - Reference to BlockchainStore with full RocksDB access
    ///
    /// # Returns
    ///
    /// `Ok(())` if migration succeeds, `Err` if migration fails (triggers rollback)
    fn up(&self, store: &BlockchainStore) -> Result<()>;

    /// Revert the migration (backward operation)
    ///
    /// Must return the database to the exact state before `up()` was called.
    /// If `down()` is not implemented or fails, the migration cannot be rolled back.
    ///
    /// # Arguments
    ///
    /// * `store` - Reference to BlockchainStore with full RocksDB access
    ///
    /// # Returns
    ///
    /// `Ok(())` if rollback succeeds, `Err` if rollback fails
    fn down(&self, store: &BlockchainStore) -> Result<()>;

    /// Compute checksum of migration for integrity verification
    ///
    /// Default implementation combines version and description.
    /// Override if custom checksum logic is needed.
    fn checksum(&self) -> String {
        use sha2::{Digest, Sha256};
        let content = format!("{}_{}", self.version(), self.description());
        let hash = Sha256::digest(content.as_bytes());
        hex::encode(hash)
    }
}

/// Validates a migration version string
///
/// # Format Requirements
///
/// - Exactly 14 characters long
/// - All digits (0-9)
/// - Format: YYYYMMDDHHMMSS (year, month, day, hour, minute, second)
/// - Valid date/time ranges (e.g., month 01-12, day 01-31)
///
/// # Examples
///
/// ```ignore
/// assert!(validate_migration_version("20240101120000").is_ok());
/// assert!(validate_migration_version("2024").is_err()); // Too short
/// assert!(validate_migration_version("20241301000000").is_err()); // Invalid month
/// ```
pub fn validate_migration_version(version: &str) -> Result<()> {
    // Must be exactly 14 characters
    if version.len() != 14 {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "version must be 14 characters (YYYYMMDDHHMMSS), got {} characters",
            version.len()
        )));
    }

    // Must be all digits
    if !version.chars().all(|c| c.is_ascii_digit()) {
        return Err(GoudChainError::InvalidMigrationVersion(
            "version must contain only digits (0-9)".to_string(),
        ));
    }

    // Parse components
    let year: u32 = version[0..4].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid year component".to_string())
    })?;
    let month: u32 = version[4..6].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid month component".to_string())
    })?;
    let day: u32 = version[6..8].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid day component".to_string())
    })?;
    let hour: u32 = version[8..10].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid hour component".to_string())
    })?;
    let minute: u32 = version[10..12].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid minute component".to_string())
    })?;
    let second: u32 = version[12..14].parse().map_err(|_| {
        GoudChainError::InvalidMigrationVersion("invalid second component".to_string())
    })?;

    // Validate ranges
    if !(2020..=2100).contains(&year) {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "year must be between 2020 and 2100, got {}",
            year
        )));
    }

    if !(1..=12).contains(&month) {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "month must be between 01 and 12, got {:02}",
            month
        )));
    }

    if !(1..=31).contains(&day) {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "day must be between 01 and 31, got {:02}",
            day
        )));
    }

    if hour >= 24 {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "hour must be between 00 and 23, got {:02}",
            hour
        )));
    }

    if minute >= 60 {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "minute must be between 00 and 59, got {:02}",
            minute
        )));
    }

    if second >= 60 {
        return Err(GoudChainError::InvalidMigrationVersion(format!(
            "second must be between 00 and 59, got {:02}",
            second
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_migration_version_valid() {
        assert!(validate_migration_version("20240101120000").is_ok());
        assert!(validate_migration_version("20240615183045").is_ok());
        assert!(validate_migration_version("20241231235959").is_ok());
    }

    #[test]
    fn test_validate_migration_version_invalid_length() {
        assert!(validate_migration_version("2024").is_err());
        assert!(validate_migration_version("202401011200000").is_err());
    }

    #[test]
    fn test_validate_migration_version_invalid_characters() {
        assert!(validate_migration_version("2024010112000a").is_err());
        assert!(validate_migration_version("2024-01-01-12-00").is_err());
    }

    #[test]
    fn test_validate_migration_version_invalid_month() {
        assert!(validate_migration_version("20241301120000").is_err());
        assert!(validate_migration_version("20240001120000").is_err());
    }

    #[test]
    fn test_validate_migration_version_invalid_day() {
        assert!(validate_migration_version("20240132120000").is_err());
        assert!(validate_migration_version("20240100120000").is_err());
    }

    #[test]
    fn test_validate_migration_version_invalid_time() {
        assert!(validate_migration_version("20240101240000").is_err());
        assert!(validate_migration_version("20240101126000").is_err());
        assert!(validate_migration_version("20240101120060").is_err());
    }

    #[test]
    fn test_migration_metadata_serialization() {
        let metadata = MigrationMetadata {
            version: "20240101120000".to_string(),
            description: "test_migration".to_string(),
            applied_at: 1704110400,
            checksum: "abc123".to_string(),
        };

        let serialized = bincode::serialize(&metadata).unwrap();
        let deserialized: MigrationMetadata = bincode::deserialize(&serialized).unwrap();

        assert_eq!(metadata, deserialized);
    }
}

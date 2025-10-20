//! CLI commands for migration management.
//!
//! This module provides command-line interface for managing schema migrations:
//! - `migrate status` - Show applied and pending migrations
//! - `migrate up` - Apply all pending migrations
//! - `migrate down` - Rollback last N migrations
//! - `migrate create <description>` - Generate new migration template
//! - `migrate reset` - Clear all migration state (dangerous)

use crate::storage::{BlockchainStore, Migration, MigrationRunner, MigrationStore};
use crate::types::Result;
use clap::{Parser, Subcommand};
use std::sync::Arc;
use tracing::{error, info};

#[derive(Parser)]
#[command(name = "goud_chain")]
#[command(about = "Goud Chain - Encrypted Blockchain with PoA Consensus", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Manage database schema migrations
    #[command(subcommand)]
    Migrate(MigrateCommands),
}

#[derive(Subcommand)]
pub enum MigrateCommands {
    /// Show migration status (applied and pending)
    Status,

    /// Apply all pending migrations
    Up,

    /// Rollback the last N migrations (default: 1)
    Down {
        #[arg(default_value = "1")]
        count: usize,
    },

    /// Create a new migration file from template
    Create {
        /// Migration description (snake_case, no spaces)
        description: String,
    },

    /// Reset migration state (clears all migration records without running down())
    /// WARNING: This is a dangerous operation for development/testing only
    Reset {
        #[arg(long)]
        confirm: bool,
    },
}

/// Execute migration CLI command
pub fn handle_migrate_command(
    command: &MigrateCommands,
    store: Arc<BlockchainStore>,
    available_migrations: &[Box<dyn Migration>],
) -> Result<()> {
    match command {
        MigrateCommands::Status => handle_status(store, available_migrations),
        MigrateCommands::Up => handle_up(store, available_migrations),
        MigrateCommands::Down { count } => handle_down(store, *count, available_migrations),
        MigrateCommands::Create { description } => handle_create(description),
        MigrateCommands::Reset { confirm } => handle_reset(store, *confirm),
    }
}

fn handle_status(store: Arc<BlockchainStore>, available: &[Box<dyn Migration>]) -> Result<()> {
    let runner = MigrationRunner::new(store.clone());
    let status = runner.get_status(available)?;

    println!("\n📊 Migration Status\n");
    println!(
        "Current Schema: {}\n",
        status.current_schema.as_deref().unwrap_or("none")
    );

    if status.applied.is_empty() {
        println!("✅ Applied Migrations: none");
    } else {
        println!("✅ Applied Migrations ({}):", status.applied.len());
        for meta in &status.applied {
            println!("   - {} ({})", meta.version, meta.description);
        }
    }

    println!();

    if status.pending.is_empty() {
        println!("⏸️  Pending Migrations: none");
    } else {
        println!("⏸️  Pending Migrations ({}):", status.pending.len());
        for version in &status.pending {
            let migration = available.iter().find(|m| m.version() == version).unwrap();
            println!("   - {} ({})", migration.version(), migration.description());
        }
    }

    println!();
    Ok(())
}

fn handle_up(store: Arc<BlockchainStore>, available: &[Box<dyn Migration>]) -> Result<()> {
    let runner = MigrationRunner::new(store);

    info!("Applying pending migrations...");

    let (count, versions) = runner.apply_pending(available)?;

    if count == 0 {
        println!("\n[OK] No pending migrations to apply\n");
    } else {
        println!("\n[OK] Successfully applied {} migration(s):", count);
        for version in versions {
            let migration = available.iter().find(|m| m.version() == version)
                .expect("Migration version in applied list should exist in available migrations");
            println!("   - {} ({})", version, migration.description());
        }
        println!();
    }

    Ok(())
}

fn handle_down(
    store: Arc<BlockchainStore>,
    count: usize,
    available: &[Box<dyn Migration>],
) -> Result<()> {
    let runner = MigrationRunner::new(store.clone());
    let migration_store = MigrationStore::new(&store);
    let applied = migration_store.get_applied_migrations()?;

    if applied.is_empty() {
        println!("\n[WARN] No migrations to rollback\n");
        return Ok(());
    }

    let to_rollback_count = count.min(applied.len());
    let to_rollback: Vec<_> = applied.iter().rev().take(to_rollback_count).collect();

    println!("\n[WARN] Rolling back {} migration(s):", to_rollback_count);
    for meta in &to_rollback {
        println!("   - {} ({})", meta.version, meta.description);
    }

    println!("\nProceed? [y/N]: ");
    let mut input = String::new();
    std::io::stdin().read_line(&mut input)
        .expect("Failed to read user input from stdin");

    if input.trim().to_lowercase() != "y" {
        println!("[CANCEL] Rollback cancelled\n");
        return Ok(());
    }

    info!("Rolling back {} migration(s)...", to_rollback_count);

    let rolled_back = runner.rollback_last(count, available)?;

    println!(
        "\n[OK] Successfully rolled back {} migration(s)\n",
        rolled_back
    );

    Ok(())
}

fn handle_create(description: &str) -> Result<()> {
    use chrono::Utc;
    use std::fs;
    use std::path::Path;

    // Validate description format (snake_case, no spaces)
    if description.contains(' ') || !description.chars().all(|c| c.is_alphanumeric() || c == '_') {
        error!("Description must be snake_case (alphanumeric and underscores only, no spaces)");
        std::process::exit(1);
    }

    // Generate timestamp version (YYYYMMDDHHMMSS)
    let now = Utc::now();
    let version = now.format("%Y%m%d%H%M%S").to_string();

    // Create migrations directory if it doesn't exist
    let migrations_dir = Path::new("src/migrations");
    if !migrations_dir.exists() {
        fs::create_dir_all(migrations_dir).map_err(|e| {
            crate::types::GoudChainError::IoError(std::io::Error::other(
                format!("Failed to create migrations directory: {}", e),
            ))
        })?;
    }

    // Generate migration filename
    let filename = format!("{}_{}.rs", version, description);
    let filepath = migrations_dir.join(&filename);

    if filepath.exists() {
        error!("Migration file already exists: {}", filepath.display());
        std::process::exit(1);
    }

    // Generate migration template
    let template = generate_migration_template(&version, description);

    fs::write(&filepath, template).map_err(|e| {
        crate::types::GoudChainError::IoError(std::io::Error::other(
            format!("Failed to write migration file: {}", e),
        ))
    })?;

    println!("\n[OK] Created migration: {}\n", filepath.display());
    println!("Next steps:");
    println!("  1. Implement up() and down() methods in {}", filename);
    println!("  2. Register migration in src/migrations/mod.rs and src/main.rs");
    println!("  3. Run `cargo run -- migrate up` to apply\n");

    Ok(())
}

fn handle_reset(store: Arc<BlockchainStore>, confirm: bool) -> Result<()> {
    if !confirm {
        println!(
            "\n⚠️  WARNING: This will clear all migration records without running down() methods!"
        );
        println!("   This is a dangerous operation that should only be used in development.\n");
        println!("   To proceed, run: cargo run -- migrate reset --confirm\n");
        return Ok(());
    }

    let runner = MigrationRunner::new(store);

    info!("Resetting migration state...");

    runner.reset()?;

    println!("\n✅ Migration state reset (all migration records cleared)\n");

    Ok(())
}

fn generate_migration_template(version: &str, description: &str) -> String {
    let struct_name = format!(
        "Migration{}{}",
        version,
        description
            .split('_')
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<String>()
    );

    format!(
        r#"//! Migration: {}
//!
//! Description: [TODO: Add detailed description of what this migration does]
//!
//! Safety: This migration has direct RocksDB access and runs with full privileges.
//! Ensure all operations are idempotent and can be safely rolled back.

use crate::storage::{{BlockchainStore, Migration}};
use crate::types::Result;

pub struct {};

impl Migration for {} {{
    fn version(&self) -> &str {{
        "{}"
    }}

    fn description(&self) -> &str {{
        "{}"
    }}

    fn up(&self, store: &BlockchainStore) -> Result<()> {{
        // TODO: Implement migration up (apply schema changes)
        //
        // Example:
        // let db = store.db();
        // let mut batch = rocksdb::WriteBatch::default();
        // batch.put(b"new:key", b"value");
        // db.write(batch)?;

        Ok(())
    }}

    fn down(&self, store: &BlockchainStore) -> Result<()> {{
        // TODO: Implement migration down (revert schema changes)
        //
        // This MUST restore the database to its exact state before up() was called.
        // If down() is not implemented, the migration cannot be rolled back.

        Ok(())
    }}
}}

#[cfg(test)]
mod tests {{
    use super::*;
    use tempfile::TempDir;
    use std::sync::Arc;

    fn create_test_store() -> (TempDir, Arc<BlockchainStore>) {{
        let temp_dir = TempDir::new().unwrap();
        let temp_path = temp_dir.path().join("rocksdb");
        let store = BlockchainStore::new(&temp_path.to_string_lossy()).unwrap();
        (temp_dir, Arc::new(store))
    }}

    #[test]
    fn test_migration_up_down() {{
        let (_temp_dir, store) = create_test_store();
        let migration = {}::new();

        // Apply migration
        migration.up(&store).unwrap();

        // TODO: Assert expected state after up()

        // Rollback migration
        migration.down(&store).unwrap();

        // TODO: Assert state reverted to original
    }}
}}
"#,
        description, struct_name, struct_name, version, description, struct_name
    )
}

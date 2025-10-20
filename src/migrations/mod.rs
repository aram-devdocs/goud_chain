//! Schema migrations registry.
//!
//! All migration files should be added as modules here and registered
//! in the get_available_migrations() function in main.rs.
//!
//! Migration files follow the naming convention: YYYYMMDDHHMMSS_description.rs

// Example migrations (add new migrations as modules here)
pub mod example_20240101120000_add_metadata_index;

// Re-export migrations for easy registration
pub use example_20240101120000_add_metadata_index::Migration20240101120000AddMetadataIndex;

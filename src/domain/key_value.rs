//! Key-Value domain model for RocksDB hello world integration.
//! Layer 2: Business Logic - Pure domain model without storage concerns.

use serde::{Deserialize, Serialize};

/// Represents a key-value pair in the system.
/// This is a simple domain model that separates business logic from persistence.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValue {
    pub key: String,
    pub value: String,
}

impl KeyValue {
    /// Create a new key-value pair
    pub fn new(key: String, value: String) -> Self {
        Self { key, value }
    }
}

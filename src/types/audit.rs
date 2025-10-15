//! Audit logging types for operational security
//! Layer 0: Foundation - Pure data types for audit trails

use serde::{Deserialize, Serialize};

/// Audit event types (stored as u8 enum for size optimization)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[repr(u8)]
pub enum AuditEventType {
    /// Account created (POST /account/create)
    AccountCreated = 0,
    /// Data submitted to blockchain (POST /data/submit)
    DataSubmitted = 1,
    /// Data decrypted from blockchain (POST /data/decrypt/{id})
    DataDecrypted = 2,
    /// User listed their collections (GET /data/list)
    DataListed = 3,
    /// User logged in with API key (POST /account/login)
    AccountLogin = 4,
}

impl std::fmt::Display for AuditEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::AccountCreated => write!(f, "AccountCreated"),
            Self::DataSubmitted => write!(f, "DataSubmitted"),
            Self::DataDecrypted => write!(f, "DataDecrypted"),
            Self::DataListed => write!(f, "DataListed"),
            Self::AccountLogin => write!(f, "AccountLogin"),
        }
    }
}

/// Individual audit log entry (optimized for size)
/// Stored encrypted in blockchain as part of EncryptedCollection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
    /// Event type (1 byte enum)
    pub event_type: AuditEventType,

    /// Timestamp in milliseconds (8 bytes)
    pub timestamp: i64,

    /// Collection ID if applicable (UUID string)
    pub collection_id: Option<String>,

    /// Truncated SHA256(IP address) for privacy (8 bytes as hex string)
    /// Format: first 8 bytes of SHA256(ip_address)
    pub ip_hash: String,

    /// Additional metadata (JSON, varies by event type)
    /// Examples:
    /// - AccountCreated: {"account_id": "..."}
    /// - DataSubmitted: {"block": 42, "label": "My Data"}
    /// - DataDecrypted: {"success": true}
    pub metadata: serde_json::Value,

    /// Soft delete flag (set when retention policy triggers)
    /// NOTE: Blockchain data is immutable, this flag only affects UI visibility
    pub invalidated: bool,
}

/// Batch of audit log entries (stored as single EncryptedCollection)
/// Reduces blockchain bloat by grouping multiple events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogBatch {
    /// Array of audit events
    pub entries: Vec<AuditLogEntry>,

    /// Batch creation timestamp
    pub batch_timestamp: i64,

    /// Number of entries in batch (for quick reference)
    pub entry_count: usize,
}

impl AuditLogBatch {
    pub fn new(entries: Vec<AuditLogEntry>) -> Self {
        Self {
            entry_count: entries.len(),
            entries,
            batch_timestamp: chrono::Utc::now().timestamp(),
        }
    }
}

/// API response for audit log queries (GET /api/audit)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogResponse {
    /// Paginated audit log entries
    pub logs: Vec<AuditLogEntry>,

    /// Total number of logs matching filter (before pagination)
    pub total: usize,

    /// Current page number (0-indexed)
    pub page: usize,

    /// Page size
    pub page_size: usize,

    /// Total number of pages
    pub total_pages: usize,
}

/// Filters for audit log queries
#[derive(Debug, Clone, Default)]
pub struct AuditLogFilter {
    /// Filter by event type
    pub event_type: Option<AuditEventType>,

    /// Start timestamp (inclusive, milliseconds)
    pub start_ts: Option<i64>,

    /// End timestamp (inclusive, milliseconds)
    pub end_ts: Option<i64>,

    /// Include invalidated logs (default: false)
    pub include_invalidated: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audit_event_type_serialization() {
        let event = AuditEventType::DataSubmitted;
        let json = serde_json::to_string(&event).unwrap();
        let deserialized: AuditEventType = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_audit_log_entry_serialization() {
        let entry = AuditLogEntry {
            event_type: AuditEventType::AccountCreated,
            timestamp: 1234567890,
            collection_id: None,
            ip_hash: "1a2b3c4d".to_string(),
            metadata: serde_json::json!({"account_id": "test123"}),
            invalidated: false,
        };

        let json = serde_json::to_string(&entry).unwrap();
        let deserialized: AuditLogEntry = serde_json::from_str(&json).unwrap();
        assert_eq!(entry.event_type, deserialized.event_type);
        assert_eq!(entry.timestamp, deserialized.timestamp);
    }

    #[test]
    fn test_audit_log_batch() {
        let entries = vec![
            AuditLogEntry {
                event_type: AuditEventType::DataSubmitted,
                timestamp: 1000,
                collection_id: Some("abc".to_string()),
                ip_hash: "12345678".to_string(),
                metadata: serde_json::json!({}),
                invalidated: false,
            },
            AuditLogEntry {
                event_type: AuditEventType::DataDecrypted,
                timestamp: 2000,
                collection_id: Some("def".to_string()),
                ip_hash: "87654321".to_string(),
                metadata: serde_json::json!({}),
                invalidated: false,
            },
        ];

        let batch = AuditLogBatch::new(entries);
        assert_eq!(batch.entry_count, 2);
        assert_eq!(batch.entries.len(), 2);
    }
}

//! Audit logging storage layer for operational security
//! Layer 3: Persistence - Stores audit logs as encrypted collections on the blockchain
//!
//! **Architecture**:
//! - Audit logs are `EncryptedCollection` objects with "AUDIT:" label prefix
//! - Stored directly on blockchain (NOT separate database)
//! - Encrypted with user's API key (only they can decrypt their logs)
//! - Batched to reduce blockchain bloat (10s or 50 events)
//! - RocksDB index for fast queries (non-authoritative cache)

use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};

use chrono::Utc;
use sha2::{Digest, Sha256};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio::time::{interval, Duration};
use tracing::{error, info, warn};

use crate::constants::{
    AUDIT_BATCH_INTERVAL_SECONDS, AUDIT_BATCH_SIZE, AUDIT_IP_HASH_LENGTH, AUDIT_LABEL_PREFIX,
};
use crate::crypto::{generate_signing_key, hash_api_key_hex};
use crate::domain::{Block, Blockchain, EncryptedCollection};
use crate::storage::BlockchainStore;
use crate::types::{
    AuditEventType, AuditLogBatch, AuditLogEntry, AuditLogFilter, AuditLogResponse, GoudChainError,
    Result,
};

/// Callback function type for block broadcasting
/// This allows AuditLogger to remain independent of the network layer (Layer 3 doesn't depend on Layer 4)
pub type BroadcastCallback = Arc<dyn Fn(&Block) + Send + Sync>;

/// Callback function type for audit log event broadcasting (WebSocket)
/// This allows AuditLogger to remain independent of the presentation layer (Layer 3 doesn't depend on Layer 5)
/// Parameters: event_type, timestamp, collection_id, metadata
pub type AuditEventCallback =
    Arc<dyn Fn(AuditEventType, i64, Option<String>, serde_json::Value) + Send + Sync>;

/// Audit logger - manages audit log batching and storage on blockchain
pub struct AuditLogger {
    blockchain: Arc<RwLock<Blockchain>>,
    blockchain_store: Arc<BlockchainStore>,
    broadcast_callback: Option<BroadcastCallback>,

    /// Callback for real-time audit log event notifications (WebSocket)
    /// Allows immediate UI updates while batching for blockchain efficiency
    /// Layer 3 doesn't depend on Layer 5 (presentation) - uses callback pattern
    audit_event_callback: Option<AuditEventCallback>,

    /// Batching buffer: account_hash → Vec<AuditLogEntry>
    /// Events accumulate here until flush (10s or 50 events)
    /// Uses std::sync::Mutex for synchronous access from non-async contexts
    pending_logs: Arc<StdMutex<HashMap<String, Vec<AuditLogEntry>>>>,

    /// Background flush task handle (kept alive by Arc, runs in background)
    #[allow(dead_code)]
    flush_task: Option<JoinHandle<()>>,

    /// Cache: account_hash → API key bytes (for encryption)
    /// Note: In production, this should use secure memory (zeroization)
    /// Uses std::sync::Mutex for synchronous access from non-async contexts
    api_key_cache: Arc<StdMutex<HashMap<String, Vec<u8>>>>,
}

impl AuditLogger {
    /// Create new audit logger and start background flush task
    ///
    /// # Arguments
    /// * `blockchain` - Shared blockchain state
    /// * `blockchain_store` - RocksDB storage for blocks
    /// * `broadcast_callback` - Optional callback for broadcasting blocks to P2P network
    /// * `audit_event_callback` - Optional callback for real-time audit log notifications (WebSocket)
    pub fn new(
        blockchain: Arc<RwLock<Blockchain>>,
        blockchain_store: Arc<BlockchainStore>,
        broadcast_callback: Option<BroadcastCallback>,
        audit_event_callback: Option<AuditEventCallback>,
    ) -> Arc<Self> {
        let logger = Arc::new(Self {
            blockchain,
            blockchain_store,
            broadcast_callback,
            audit_event_callback,
            pending_logs: Arc::new(StdMutex::new(HashMap::new())),
            flush_task: None,
            api_key_cache: Arc::new(StdMutex::new(HashMap::new())),
        });

        // Start background flush task
        logger.clone().start_flush_task();
        logger
    }

    /// Log an audit event (non-blocking, buffered)
    /// Events are batched and flushed to blockchain every 10 seconds or 50 events
    pub fn log(
        &self,
        api_key: &[u8],
        event_type: AuditEventType,
        collection_id: Option<String>,
        client_ip: &str,
        metadata: serde_json::Value,
    ) -> Result<()> {
        let account_hash = hash_api_key_hex(api_key);

        // Cache API key for encryption during flush
        {
            let mut cache = self.api_key_cache.lock().unwrap();
            if !cache.contains_key(&account_hash) {
                cache.insert(account_hash.clone(), api_key.to_vec());
            }
        }

        let entry = AuditLogEntry {
            event_type,
            timestamp: Utc::now().timestamp_millis(),
            collection_id: collection_id.clone(),
            ip_hash: hash_ip_truncated(client_ip),
            metadata: metadata.clone(),
            invalidated: false,
        };

        let mut pending = self.pending_logs.lock().unwrap();
        let logs = pending.entry(account_hash.clone()).or_default();
        logs.push(entry.clone());

        // Check if batch is ready (50 events threshold)
        if logs.len() >= AUDIT_BATCH_SIZE {
            drop(pending); // Release lock before flush
            info!(
                account_hash = %account_hash,
                batch_size = AUDIT_BATCH_SIZE,
                "Audit log batch threshold reached, triggering immediate flush"
            );
            // Note: Actual flush happens in background task
        } else {
            drop(pending); // Release lock before async broadcast
        }

        // Broadcast audit log event immediately via callback (non-blocking)
        // This provides instant UI feedback while blockchain batching continues in background
        if let Some(ref callback) = self.audit_event_callback {
            let callback = Arc::clone(callback);
            let event_type = entry.event_type;
            let timestamp = entry.timestamp;
            let collection_id = entry.collection_id.clone();
            let metadata = entry.metadata.clone();

            // Execute callback in background (non-blocking)
            tokio::spawn(async move {
                callback(event_type, timestamp, collection_id, metadata);
            });
        }

        Ok(())
    }

    /// Start background task that flushes audit log batches
    /// Runs every AUDIT_BATCH_INTERVAL_SECONDS (10 seconds)
    fn start_flush_task(self: Arc<Self>) -> JoinHandle<()> {
        let logger = Arc::clone(&self);

        tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(AUDIT_BATCH_INTERVAL_SECONDS));
            info!(
                "Audit log flush task started (interval: {}s)",
                AUDIT_BATCH_INTERVAL_SECONDS
            );

            loop {
                ticker.tick().await;

                if let Err(e) = logger.flush_all_batches().await {
                    error!(error = %e, "Failed to flush audit log batches");
                }
            }
        })
    }

    /// Flush all pending audit log batches to blockchain
    /// Creates EncryptedCollection for each user's batch
    /// Can be called manually after auditable operations for immediate flushing
    pub async fn flush_all_batches(&self) -> Result<()> {
        // Collect all batches and API keys (drop locks before async work)
        let batches_to_flush: Vec<(String, Vec<AuditLogEntry>, Vec<u8>)> = {
            let mut pending = self.pending_logs.lock().unwrap();

            if pending.is_empty() {
                return Ok(()); // No logs to flush
            }

            let api_key_cache = self.api_key_cache.lock().unwrap();
            let mut result = Vec::new();

            for (account_hash, entries) in pending.drain() {
                if entries.is_empty() {
                    continue;
                }

                // Get cached API key for encryption
                let api_key = match api_key_cache.get(&account_hash) {
                    Some(key) => key.clone(),
                    None => {
                        warn!(
                            account_hash = %account_hash,
                            "API key not in cache, skipping audit log flush"
                        );
                        continue;
                    }
                };

                result.push((account_hash, entries, api_key));
            }

            result
        }; // Locks dropped here

        let mut flushed_count = 0;

        for (account_hash, entries, api_key) in batches_to_flush {
            // Create audit batch collection
            let batch = AuditLogBatch::new(entries.clone());
            let batch_json = serde_json::to_string(&batch).map_err(|e| {
                GoudChainError::AuditLogError(format!("Failed to serialize batch: {}", e))
            })?;

            // Get node signing key
            let signing_key = {
                let bc = self.blockchain.read().await;
                bc.node_signing_key
                    .clone()
                    .unwrap_or_else(generate_signing_key)
            };

            // Create encrypted collection with AUDIT: prefix
            let collection = EncryptedCollection::new(
                format!("{}Batch", AUDIT_LABEL_PREFIX),
                batch_json,
                &api_key,
                account_hash.clone(),
                &signing_key,
            )?;

            // Add to blockchain pending collections
            let mut bc = self.blockchain.write().await;
            bc.add_collection(collection)?;

            // Check if this node is the validator for the next block
            let next_block_number = bc.chain.len() as u64 + 1;
            let is_validator = crate::domain::blockchain::is_authorized_validator(
                &bc.node_id,
                next_block_number,
                &bc.validator_config,
            );

            if is_validator {
                // Only create block if this node is the current validator
                match bc.add_block() {
                    Ok(block) => {
                        let block_index = block.index;
                        drop(bc); // Release lock before I/O

                        // Save block to RocksDB
                        if let Err(e) = self.blockchain_store.save_block(&block) {
                            error!(error = %e, "Failed to save audit log block to RocksDB");
                        }

                        // Broadcast block to peers via callback (if provided)
                        if let Some(ref broadcast) = self.broadcast_callback {
                            broadcast(&block);
                        }

                        flushed_count += 1;
                        info!(
                            account_hash = %account_hash,
                            events = entries.len(),
                            block = block_index,
                            "Flushed audit log batch to blockchain (created block as validator)"
                        );
                    }
                    Err(crate::types::errors::GoudChainError::NotAuthorizedValidator {
                        ..
                    }) => {
                        // This is expected - validator rotated after we added to pending
                        drop(bc);
                        info!(
                            account_hash = %account_hash,
                            events = entries.len(),
                            "Audit log batch added to pending (validator rotated, will be included in next block)"
                        );
                    }
                    Err(e) => {
                        error!(error = %e, "Failed to create audit log block");
                        drop(bc);
                        // Don't fail the entire flush - continue with other users' logs
                    }
                }
            } else {
                // Not validator - audit logs stay in pending_collections
                drop(bc);
                info!(
                    account_hash = %account_hash,
                    events = entries.len(),
                    "Audit log batch added to pending collections (not validator, will sync from peers)"
                );
            }
        }

        if flushed_count > 0 {
            info!(
                batches_flushed = flushed_count,
                "Audit log flush cycle complete"
            );
        }

        Ok(())
    }

    /// Query audit logs for a user
    /// Supports filtering by timestamp, event type, and pagination
    pub async fn query_logs(
        &self,
        api_key: &[u8],
        filter: AuditLogFilter,
        page: usize,
        page_size: usize,
    ) -> Result<AuditLogResponse> {
        let account_hash = hash_api_key_hex(api_key);

        // Get block indexes containing user's audit logs (from RocksDB index)
        // If index is empty/missing, fall back to scanning entire blockchain
        let block_indexes = self.get_audit_block_indexes(&account_hash)?;

        let blockchain = self.blockchain.read().await;
        let indexes_to_scan: Vec<u64> = if block_indexes.is_empty() {
            // No index available, scan all blocks
            (0..blockchain.chain.len() as u64).collect()
        } else {
            block_indexes
        };

        // Load blocks and decrypt audit logs
        let mut all_entries = Vec::new();

        for block_index in indexes_to_scan {
            if let Some(block) = blockchain.chain.get(block_index as usize) {
                // Get collections owned by user
                match block.get_collections_by_owner(api_key) {
                    Ok(collections) => {
                        for collection in collections {
                            // Filter for audit collections only
                            if let Ok(metadata) = collection.decrypt_metadata(api_key) {
                                if let Some(label) = metadata["label"].as_str() {
                                    if !label.starts_with(AUDIT_LABEL_PREFIX) {
                                        continue;
                                    }

                                    // Decrypt audit batch
                                    match collection.decrypt_payload(api_key) {
                                        Ok(payload) => {
                                            match serde_json::from_str::<AuditLogBatch>(&payload) {
                                                Ok(batch) => all_entries.extend(batch.entries),
                                                Err(e) => warn!(
                                                    error = %e,
                                                    "Failed to parse audit batch"
                                                ),
                                            }
                                        }
                                        Err(e) => warn!(error = %e, "Failed to decrypt audit log"),
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => warn!(error = %e, block = block_index, "Failed to get collections"),
                }
            }
        }

        drop(blockchain);

        // Apply filters
        all_entries.retain(|entry| {
            // Filter invalidated logs
            if !filter.include_invalidated && entry.invalidated {
                return false;
            }

            // Filter by event type
            if let Some(event_type) = filter.event_type {
                if entry.event_type != event_type {
                    return false;
                }
            }

            // Filter by timestamp range
            if let Some(start_ts) = filter.start_ts {
                if entry.timestamp < start_ts {
                    return false;
                }
            }

            if let Some(end_ts) = filter.end_ts {
                if entry.timestamp > end_ts {
                    return false;
                }
            }

            true
        });

        // Sort by timestamp (newest first)
        all_entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Paginate
        let total = all_entries.len();
        let total_pages = total.div_ceil(page_size);
        let start_idx = page * page_size;
        let end_idx = (start_idx + page_size).min(total);
        let logs = if start_idx < total {
            all_entries[start_idx..end_idx].to_vec()
        } else {
            Vec::new()
        };

        Ok(AuditLogResponse {
            logs,
            total,
            page,
            page_size,
            total_pages,
        })
    }

    /// Get block indexes containing audit logs for a user (from RocksDB index)
    /// This is a performance optimization to avoid scanning entire blockchain
    fn get_audit_block_indexes(&self, account_hash: &str) -> Result<Vec<u64>> {
        let key = format!("audit_index:{}", account_hash);
        let db = self.blockchain_store.get_db();

        match db.get(key.as_bytes()) {
            Ok(Some(bytes)) => bincode::deserialize(&bytes).map_err(|e| {
                GoudChainError::AuditLogError(format!("Failed to deserialize index: {}", e))
            }),
            Ok(None) => Ok(Vec::new()), // No audit logs for this user
            Err(e) => Err(GoudChainError::RocksDbError(e.to_string())),
        }
    }

    /// Update RocksDB index: audit_index:{account_hash} → [block_numbers]
    /// This enables fast lookup of blocks containing user's audit logs
    /// NOTE: Currently unused, reserved for future performance optimization
    #[allow(dead_code)]
    fn update_audit_index(&self, account_hash: &str, block_index: u64) -> Result<()> {
        let key = format!("audit_index:{}", account_hash);
        let db = self.blockchain_store.get_db();

        // Read existing indexes
        let mut indexes: Vec<u64> = match db.get(key.as_bytes()) {
            Ok(Some(bytes)) => bincode::deserialize(&bytes).map_err(|e| {
                GoudChainError::AuditLogError(format!("Failed to deserialize index: {}", e))
            })?,
            Ok(None) => Vec::new(),
            Err(e) => return Err(GoudChainError::RocksDbError(e.to_string())),
        };

        // Add new block index
        if !indexes.contains(&block_index) {
            indexes.push(block_index);

            // Write back
            let serialized = bincode::serialize(&indexes).map_err(|e| {
                GoudChainError::AuditLogError(format!("Failed to serialize index: {}", e))
            })?;

            db.put(key.as_bytes(), serialized)
                .map_err(|e| GoudChainError::RocksDbError(e.to_string()))?;
        }

        Ok(())
    }
}

/// Hash IP address and truncate to 8 characters for privacy
/// Uses SHA256(ip) and takes first AUDIT_IP_HASH_LENGTH bytes
fn hash_ip_truncated(ip: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(ip.as_bytes());
    let hash = hasher.finalize();
    let hex = hex::encode(hash);
    hex[..AUDIT_IP_HASH_LENGTH].to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_ip_truncated() {
        let ip = "192.168.1.1";
        let hash = hash_ip_truncated(ip);
        assert_eq!(hash.len(), AUDIT_IP_HASH_LENGTH);

        // Verify determinism
        let hash2 = hash_ip_truncated(ip);
        assert_eq!(hash, hash2);

        // Verify different IPs produce different hashes
        let hash3 = hash_ip_truncated("192.168.1.2");
        assert_ne!(hash, hash3);
    }
}

//! Nonce storage layer using RocksDB for replay attack prevention.
//! Layer 3: Persistence - Handles nonce tracking with 5-minute expiration.
//!
//! **Storage Schema:**
//! - `nonce:{nonce}` → expiry timestamp (i64) with TTL
//!
//! **Performance Optimizations:**
//! - LRU cache for hot nonces (100,000 entries for high throughput)
//! - Automatic cleanup of expired nonces via RocksDB TTL
//! - Fast O(1) lookups for nonce validation

use chrono::Utc;
use lru::LruCache;
use rocksdb::DB;
use std::num::NonZeroUsize;
use std::sync::{Arc, Mutex};
use tracing::{debug, info};

use crate::types::{GoudChainError, Result};

/// Nonce expiration window (5 minutes as per security requirement)
pub const NONCE_EXPIRATION_SECONDS: i64 = 300;

/// Cache size for hot nonces (larger than rate limit cache for high-throughput scenarios)
const NONCE_CACHE_SIZE: usize = 100_000;

/// In-memory nonce cache entry
#[derive(Debug, Clone)]
struct NonceEntry {
    #[allow(dead_code)] // Used for cache validation
    expiry_timestamp: i64,
}

/// Nonce store with RocksDB persistence and LRU cache
pub struct NonceStore {
    db: Arc<DB>,
    /// LRU cache for hot nonces (O(1) lookups)
    cache: Arc<Mutex<LruCache<String, NonceEntry>>>,
}

impl NonceStore {
    /// Create a new nonce store
    pub fn new(db: Arc<DB>) -> Self {
        info!(
            "Initializing nonce store with {}-second expiration",
            NONCE_EXPIRATION_SECONDS
        );
        Self {
            db,
            cache: Arc::new(Mutex::new(LruCache::new(
                NonZeroUsize::new(NONCE_CACHE_SIZE).unwrap(),
            ))),
        }
    }

    /// Check if a nonce has been used (and is still valid)
    #[allow(dead_code)] // Used by SignedRequest validation (not yet integrated into endpoints)
    pub fn is_nonce_used(&self, nonce: &str) -> Result<bool> {
        let now = Utc::now().timestamp();

        // Check cache first (O(1) lookup)
        {
            let mut cache = self.cache.lock().unwrap();
            if let Some(entry) = cache.get(nonce) {
                // Check if nonce is expired
                if entry.expiry_timestamp > now {
                    debug!("Nonce found in cache: {}", nonce);
                    return Ok(true); // Nonce is still valid = replay attack
                } else {
                    // Remove expired entry from cache
                    cache.pop(nonce);
                }
            }
        }

        // Check RocksDB (cache miss)
        let key = format!("nonce:{}", nonce);
        let value = self
            .db
            .get(key.as_bytes())
            .map_err(|e| GoudChainError::RocksDbError(format!("Failed to check nonce: {}", e)))?;

        match value {
            Some(bytes) => {
                // Deserialize expiry timestamp
                let expiry_timestamp = i64::from_be_bytes(bytes.try_into().map_err(|_| {
                    GoudChainError::RocksDbError("Invalid nonce expiry format".to_string())
                })?);

                // Check if nonce is expired
                if expiry_timestamp > now {
                    // Add to cache for future lookups
                    let mut cache = self.cache.lock().unwrap();
                    cache.put(nonce.to_string(), NonceEntry { expiry_timestamp });

                    debug!("Nonce found in RocksDB: {}", nonce);
                    Ok(true) // Nonce is still valid = replay attack
                } else {
                    // Nonce expired, remove from RocksDB
                    self.db.delete(key.as_bytes()).ok();
                    debug!("Expired nonce removed: {}", nonce);
                    Ok(false) // Nonce expired = can be reused
                }
            }
            None => {
                debug!("Nonce not found (first use): {}", nonce);
                Ok(false) // Nonce not found = first use
            }
        }
    }

    /// Record a nonce as used (with expiration)
    #[allow(dead_code)] // Used by SignedRequest validation (not yet integrated into endpoints)
    pub fn record_nonce(&self, nonce: &str) -> Result<()> {
        let now = Utc::now().timestamp();
        let expiry_timestamp = now + NONCE_EXPIRATION_SECONDS;

        // Store in RocksDB
        let key = format!("nonce:{}", nonce);
        self.db
            .put(key.as_bytes(), expiry_timestamp.to_be_bytes())
            .map_err(|e| GoudChainError::RocksDbError(format!("Failed to record nonce: {}", e)))?;

        // Add to cache
        {
            let mut cache = self.cache.lock().unwrap();
            cache.put(nonce.to_string(), NonceEntry { expiry_timestamp });
        }

        debug!(
            "Nonce recorded (expires at {}): {}",
            expiry_timestamp, nonce
        );
        Ok(())
    }

    /// Clean up expired nonces from RocksDB (periodic maintenance)
    /// This is called periodically to prevent RocksDB from growing indefinitely
    pub fn cleanup_expired_nonces(&self) -> Result<u32> {
        let now = Utc::now().timestamp();
        let mut deleted_count = 0u32;

        // Iterate over all nonce keys
        let iter = self.db.prefix_iterator(b"nonce:");
        for item in iter {
            let (key, value) = item.map_err(|e| {
                GoudChainError::RocksDbError(format!("Failed to iterate nonces: {}", e))
            })?;

            // Check if key starts with "nonce:"
            if !key.starts_with(b"nonce:") {
                break; // Stop iteration when prefix changes
            }

            // Parse expiry timestamp
            if value.len() == 8 {
                if let Ok(expiry_bytes) = value.as_ref().try_into() {
                    let expiry_timestamp = i64::from_be_bytes(expiry_bytes);

                    // Delete if expired
                    if expiry_timestamp <= now {
                        self.db.delete(&key).ok();
                        deleted_count += 1;
                    }
                }
            }
        }

        if deleted_count > 0 {
            info!("Cleaned up {} expired nonces", deleted_count);
        }

        Ok(deleted_count)
    }

    /// Get cache statistics
    #[allow(dead_code)]
    pub fn cache_stats(&self) -> (usize, usize) {
        let cache = self.cache.lock().unwrap();
        (cache.len(), NONCE_CACHE_SIZE)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rocksdb::{Options, DB};

    fn create_test_db() -> Arc<DB> {
        let path = format!("/tmp/goud_nonce_test_{}", rand::random::<u64>());
        let mut opts = Options::default();
        opts.create_if_missing(true);
        Arc::new(DB::open(&opts, path).unwrap())
    }

    #[test]
    fn test_nonce_first_use() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        let nonce = "test-nonce-12345";
        assert!(!store.is_nonce_used(nonce).unwrap());

        store.record_nonce(nonce).unwrap();
        assert!(store.is_nonce_used(nonce).unwrap());
    }

    #[test]
    fn test_nonce_replay_detection() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        let nonce = "replay-test-nonce";

        // First use should succeed
        assert!(!store.is_nonce_used(nonce).unwrap());
        store.record_nonce(nonce).unwrap();

        // Second use should be detected as replay
        assert!(store.is_nonce_used(nonce).unwrap());
        assert!(store.is_nonce_used(nonce).unwrap());
    }

    #[test]
    fn test_multiple_unique_nonces() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        let nonces = vec!["nonce-1", "nonce-2", "nonce-3"];

        for nonce in &nonces {
            assert!(!store.is_nonce_used(nonce).unwrap());
            store.record_nonce(nonce).unwrap();
        }

        for nonce in &nonces {
            assert!(store.is_nonce_used(nonce).unwrap());
        }
    }

    #[test]
    fn test_nonce_expiration() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        // Override expiration for testing (this is just a conceptual test)
        let nonce = "expiring-nonce";

        // Record nonce with past expiry (simulate expired nonce)
        let past_timestamp = Utc::now().timestamp() - 600; // 10 minutes ago
        let key = format!("nonce:{}", nonce);
        store
            .db
            .put(key.as_bytes(), past_timestamp.to_be_bytes())
            .unwrap();

        // Should return false (expired)
        assert!(!store.is_nonce_used(nonce).unwrap());
    }

    #[test]
    fn test_cache_population() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        let nonce = "cache-test-nonce";

        // First check - cache miss
        store.record_nonce(nonce).unwrap();

        // Second check - cache hit
        assert!(store.is_nonce_used(nonce).unwrap());

        // Verify cache contains the nonce
        let (cache_size, _) = store.cache_stats();
        assert!(cache_size > 0);
    }

    #[test]
    fn test_cleanup_expired_nonces() {
        let db = create_test_db();
        let store = NonceStore::new(db);

        // Add expired nonce
        let expired_nonce = "expired-nonce";
        let past_timestamp = Utc::now().timestamp() - 600; // 10 minutes ago
        let key = format!("nonce:{}", expired_nonce);
        store
            .db
            .put(key.as_bytes(), past_timestamp.to_be_bytes())
            .unwrap();

        // Add valid nonce
        let valid_nonce = "valid-nonce";
        store.record_nonce(valid_nonce).unwrap();

        // Run cleanup
        let deleted = store.cleanup_expired_nonces().unwrap();
        assert_eq!(deleted, 1);

        // Verify expired nonce was deleted and valid nonce remains
        assert!(!store.is_nonce_used(expired_nonce).unwrap());
        assert!(store.is_nonce_used(valid_nonce).unwrap());
    }
}

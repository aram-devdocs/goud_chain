use std::num::NonZeroUsize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use lru::LruCache;
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::constants::AES_KEY_SIZE_BYTES;
use crate::crypto::hkdf::{
    derive_encryption_key as derive_encryption_key_slow, derive_mac_key as derive_mac_key_slow,
};

// Cache configuration constants
const CACHE_MAX_ENTRIES: usize = 1000;
const CACHE_TTL_SECONDS: u64 = 300; // 5 minutes

#[derive(Clone)]
pub struct KeyCache {
    cache: Arc<Mutex<LruCache<String, CachedKeysWithTTL>>>,
    stats: Arc<Mutex<CacheStats>>,
}

/// Cached encryption and MAC keys with automatic memory zeroization
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
struct CachedKeys {
    encryption_key: [u8; AES_KEY_SIZE_BYTES],
    mac_key: [u8; AES_KEY_SIZE_BYTES],
}

/// Cache entry with TTL tracking
struct CachedKeysWithTTL {
    keys: CachedKeys,
    inserted_at: Instant,
}

impl Default for KeyCache {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyCache {
    pub fn new() -> Self {
        KeyCache {
            cache: Arc::new(Mutex::new(LruCache::new(
                NonZeroUsize::new(CACHE_MAX_ENTRIES).unwrap(),
            ))),
            stats: Arc::new(Mutex::new(CacheStats::default())),
        }
    }

    pub fn get_encryption_key(&self, api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
        let cache_key = self.make_cache_key(api_key, salt);
        let now = Instant::now();

        // Try to get from cache
        {
            let mut cache = self.cache.lock().unwrap();
            if let Some(entry) = cache.get(&cache_key) {
                // Check if entry is still valid (within TTL)
                if now.duration_since(entry.inserted_at) < Duration::from_secs(CACHE_TTL_SECONDS) {
                    // Cache hit
                    self.stats.lock().unwrap().hits += 1;
                    return entry.keys.encryption_key;
                } else {
                    // Entry expired, remove it (will trigger zeroization)
                    cache.pop(&cache_key);
                    self.stats.lock().unwrap().evictions += 1;
                }
            }
        }

        // Cache miss - derive keys
        self.stats.lock().unwrap().misses += 1;
        let encryption_key = derive_encryption_key_slow(api_key, salt);
        let mac_key = derive_mac_key_slow(api_key, salt);

        // Store in cache
        {
            let mut cache = self.cache.lock().unwrap();
            let evicted = cache.push(
                cache_key,
                CachedKeysWithTTL {
                    keys: CachedKeys {
                        encryption_key,
                        mac_key,
                    },
                    inserted_at: now,
                },
            );
            if evicted.is_some() {
                // LRU eviction occurred (oldest entry was zeroized)
                self.stats.lock().unwrap().evictions += 1;
            }
        }

        encryption_key
    }

    pub fn get_mac_key(&self, api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
        let cache_key = self.make_cache_key(api_key, salt);
        let now = Instant::now();

        // Try to get from cache
        {
            let mut cache = self.cache.lock().unwrap();
            if let Some(entry) = cache.get(&cache_key) {
                // Check if entry is still valid (within TTL)
                if now.duration_since(entry.inserted_at) < Duration::from_secs(CACHE_TTL_SECONDS) {
                    // Cache hit
                    self.stats.lock().unwrap().hits += 1;
                    return entry.keys.mac_key;
                } else {
                    // Entry expired, remove it (will trigger zeroization)
                    cache.pop(&cache_key);
                    self.stats.lock().unwrap().evictions += 1;
                }
            }
        }

        // Cache miss - derive keys
        self.stats.lock().unwrap().misses += 1;
        let encryption_key = derive_encryption_key_slow(api_key, salt);
        let mac_key = derive_mac_key_slow(api_key, salt);

        // Store in cache
        {
            let mut cache = self.cache.lock().unwrap();
            let evicted = cache.push(
                cache_key,
                CachedKeysWithTTL {
                    keys: CachedKeys {
                        encryption_key,
                        mac_key,
                    },
                    inserted_at: now,
                },
            );
            if evicted.is_some() {
                // LRU eviction occurred (oldest entry was zeroized)
                self.stats.lock().unwrap().evictions += 1;
            }
        }

        mac_key
    }

    fn make_cache_key(&self, api_key: &[u8], salt: &[u8]) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(api_key);
        hasher.update(salt);
        format!("{:x}", hasher.finalize())
    }

    #[allow(dead_code)]
    pub fn clear(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.clear(); // All entries will be zeroized on drop
        let mut stats = self.stats.lock().unwrap();
        *stats = CacheStats::default();
    }

    pub fn stats(&self) -> CacheStats {
        let cache = self.cache.lock().unwrap();
        let mut stats = self.stats.lock().unwrap().clone();
        stats.size = cache.len();
        stats
    }

    /// Get Prometheus-formatted metrics
    pub fn prometheus_metrics(&self) -> String {
        let stats = self.stats();
        format!(
            "# HELP key_cache_hits_total Total number of cache hits\n\
             # TYPE key_cache_hits_total counter\n\
             key_cache_hits_total {}\n\
             # HELP key_cache_misses_total Total number of cache misses\n\
             # TYPE key_cache_misses_total counter\n\
             key_cache_misses_total {}\n\
             # HELP key_cache_hit_rate Cache hit rate (0.0 to 1.0)\n\
             # TYPE key_cache_hit_rate gauge\n\
             key_cache_hit_rate {:.4}\n\
             # HELP key_cache_size Current number of entries in cache\n\
             # TYPE key_cache_size gauge\n\
             key_cache_size {}\n\
             # HELP key_cache_evictions_total Total number of cache evictions (TTL + LRU)\n\
             # TYPE key_cache_evictions_total counter\n\
             key_cache_evictions_total {}\n",
            stats.hits,
            stats.misses,
            stats.hit_rate(),
            stats.size,
            stats.evictions
        )
    }
}

#[derive(Debug, Clone, Default)]
pub struct CacheStats {
    pub size: usize,
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
}

impl CacheStats {
    pub fn hit_rate(&self) -> f64 {
        let total = self.hits + self.misses;
        if total == 0 {
            0.0
        } else {
            self.hits as f64 / total as f64
        }
    }
}

static KEY_CACHE: once_cell::sync::Lazy<KeyCache> = once_cell::sync::Lazy::new(KeyCache::new);

pub fn global_key_cache() -> &'static KeyCache {
    &KEY_CACHE
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_cache_hit() {
        let cache = KeyCache::new();
        let api_key = b"test_api_key_32_bytes_long_here!";
        let salt = b"test_salt";

        let key1 = cache.get_encryption_key(api_key, salt);
        let key2 = cache.get_encryption_key(api_key, salt);

        assert_eq!(key1, key2);
        let stats = cache.stats();
        assert_eq!(stats.size, 1);
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
        assert_eq!(stats.hit_rate(), 0.5);
    }

    #[test]
    fn test_different_api_keys_cached_separately() {
        let cache = KeyCache::new();
        let api_key1 = b"api_key_1_32_bytes_long_here!!!!";
        let api_key2 = b"api_key_2_32_bytes_long_here!!!!";
        let salt = b"same_salt";

        let key1 = cache.get_encryption_key(api_key1, salt);
        let key2 = cache.get_encryption_key(api_key2, salt);

        assert_ne!(key1, key2);
        assert_eq!(cache.stats().size, 2);
        assert_eq!(cache.stats().misses, 2);
    }

    #[test]
    fn test_cache_ttl_expiration() {
        let cache = KeyCache::new();
        let api_key = b"test_api_key_32_bytes_long_here!";
        let salt = b"test_salt";

        // Override TTL for testing by directly manipulating the cache
        // First, insert with a past timestamp
        let cache_key = cache.make_cache_key(api_key, salt);
        let expired_time = Instant::now() - Duration::from_secs(CACHE_TTL_SECONDS + 1);

        {
            let mut cache_lock = cache.cache.lock().unwrap();
            cache_lock.push(
                cache_key.clone(),
                CachedKeysWithTTL {
                    keys: CachedKeys {
                        encryption_key: [1u8; AES_KEY_SIZE_BYTES],
                        mac_key: [2u8; AES_KEY_SIZE_BYTES],
                    },
                    inserted_at: expired_time,
                },
            );
        }

        // Try to retrieve - should be expired and re-derived
        let key = cache.get_encryption_key(api_key, salt);
        assert_ne!(key, [1u8; AES_KEY_SIZE_BYTES]); // Should be re-derived, not the expired value

        let stats = cache.stats();
        assert_eq!(stats.evictions, 1); // Entry was evicted due to TTL
        assert_eq!(stats.misses, 1); // Counted as a miss
    }

    #[test]
    fn test_lru_eviction() {
        let cache = KeyCache::new();

        // Fill cache to capacity (1000 entries)
        for i in 0..CACHE_MAX_ENTRIES {
            let api_key = format!("api_key_{:04}", i);
            let salt = b"test_salt";
            cache.get_encryption_key(api_key.as_bytes(), salt);
        }

        assert_eq!(cache.stats().size, CACHE_MAX_ENTRIES);
        assert_eq!(cache.stats().evictions, 0);

        // Add one more entry - should trigger LRU eviction
        let api_key = b"overflow_key_32_bytes_long_here!";
        cache.get_encryption_key(api_key, b"test_salt");

        let stats = cache.stats();
        assert_eq!(stats.size, CACHE_MAX_ENTRIES); // Still at capacity
        assert_eq!(stats.evictions, 1); // One entry was evicted
    }

    #[test]
    fn test_zeroization_on_clear() {
        let cache = KeyCache::new();
        let api_key = b"test_api_key_32_bytes_long_here!";
        let salt = b"test_salt";

        // Insert some entries
        cache.get_encryption_key(api_key, salt);
        assert_eq!(cache.stats().size, 1);

        // Clear cache - all entries should be zeroized
        cache.clear();

        let stats = cache.stats();
        assert_eq!(stats.size, 0);
        assert_eq!(stats.hits, 0);
        assert_eq!(stats.misses, 0);
        assert_eq!(stats.evictions, 0);
    }

    #[test]
    fn test_cache_hit_rate_calculation() {
        let cache = KeyCache::new();
        let api_key = b"test_api_key_32_bytes_long_here!";
        let salt = b"test_salt";

        // First access - miss
        cache.get_encryption_key(api_key, salt);
        assert_eq!(cache.stats().hit_rate(), 0.0);

        // Second access - hit
        cache.get_encryption_key(api_key, salt);
        assert_eq!(cache.stats().hit_rate(), 0.5);

        // Third access - hit
        cache.get_encryption_key(api_key, salt);
        assert!((cache.stats().hit_rate() - 0.6667).abs() < 0.001);
    }

    #[test]
    fn test_prometheus_metrics_format() {
        let cache = KeyCache::new();
        let api_key = b"test_api_key_32_bytes_long_here!";
        let salt = b"test_salt";

        cache.get_encryption_key(api_key, salt);
        cache.get_encryption_key(api_key, salt);

        let metrics = cache.prometheus_metrics();
        assert!(metrics.contains("key_cache_hits_total 1"));
        assert!(metrics.contains("key_cache_misses_total 1"));
        assert!(metrics.contains("key_cache_hit_rate 0.5000"));
        assert!(metrics.contains("key_cache_size 1"));
    }
}

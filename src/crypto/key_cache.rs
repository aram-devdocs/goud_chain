use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::constants::AES_KEY_SIZE_BYTES;
use crate::crypto::hkdf::{
    derive_encryption_key as derive_encryption_key_slow, derive_mac_key as derive_mac_key_slow,
};

#[derive(Clone)]
pub struct KeyCache {
    cache: Arc<Mutex<HashMap<String, CachedKeys>>>,
}

#[derive(Clone)]
struct CachedKeys {
    encryption_key: [u8; AES_KEY_SIZE_BYTES],
    mac_key: [u8; AES_KEY_SIZE_BYTES],
}

impl Default for KeyCache {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyCache {
    pub fn new() -> Self {
        KeyCache {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_encryption_key(&self, api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
        let cache_key = self.make_cache_key(api_key, salt);

        {
            let cache = self.cache.lock().unwrap();
            if let Some(keys) = cache.get(&cache_key) {
                return keys.encryption_key;
            }
        }

        let encryption_key = derive_encryption_key_slow(api_key, salt);
        let mac_key = derive_mac_key_slow(api_key, salt);

        {
            let mut cache = self.cache.lock().unwrap();
            cache.insert(
                cache_key,
                CachedKeys {
                    encryption_key,
                    mac_key,
                },
            );
        }

        encryption_key
    }

    pub fn get_mac_key(&self, api_key: &[u8], salt: &[u8]) -> [u8; AES_KEY_SIZE_BYTES] {
        let cache_key = self.make_cache_key(api_key, salt);

        {
            let cache = self.cache.lock().unwrap();
            if let Some(keys) = cache.get(&cache_key) {
                return keys.mac_key;
            }
        }

        let encryption_key = derive_encryption_key_slow(api_key, salt);
        let mac_key = derive_mac_key_slow(api_key, salt);

        {
            let mut cache = self.cache.lock().unwrap();
            cache.insert(
                cache_key,
                CachedKeys {
                    encryption_key,
                    mac_key,
                },
            );
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
        cache.clear();
    }

    #[allow(dead_code)]
    pub fn stats(&self) -> CacheStats {
        let cache = self.cache.lock().unwrap();
        CacheStats { size: cache.len() }
    }
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct CacheStats {
    pub size: usize,
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
        assert_eq!(cache.stats().size, 1);
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
    }
}

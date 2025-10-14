use chrono::Utc;
use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::constants::ENCRYPTION_SALT;
use crate::crypto::{
    encrypt_data_with_key, get_public_key_hex, global_key_cache, hash_api_key, sign_message,
};
use crate::types::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAccount {
    pub account_id: String,
    pub api_key_hash: String,
    pub public_key: String,
    pub created_at: i64,
    pub metadata_encrypted: Option<String>, // Optional encrypted metadata (e.g., email, username)
    pub signature: String,
}

impl UserAccount {
    /// Create a new user account with an API key
    pub fn new(api_key: &[u8], signing_key: &SigningKey, metadata: Option<String>) -> Result<Self> {
        let account_id = Uuid::new_v4().to_string();
        let api_key_hash = hash_api_key(api_key);
        let public_key = get_public_key_hex(signing_key);
        let created_at = Utc::now().timestamp();

        // Encrypt metadata if provided
        let metadata_encrypted = if let Some(meta) = metadata {
            let key_cache = global_key_cache();
            let encryption_key = key_cache.get_encryption_key(api_key, ENCRYPTION_SALT);
            let (encrypted, _nonce) = encrypt_data_with_key(&meta, &encryption_key)?;
            Some(encrypted)
        } else {
            None
        };

        // Sign the account data
        let message = format!(
            "{}{}{}{}",
            account_id,
            api_key_hash,
            created_at,
            metadata_encrypted.as_deref().unwrap_or("")
        );
        let signature = sign_message(message.as_bytes(), signing_key);

        Ok(UserAccount {
            account_id,
            api_key_hash,
            public_key,
            created_at,
            metadata_encrypted,
            signature,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::generate_signing_key;

    #[test]
    fn test_create_account() {
        let api_key = b"test_api_key_12345678901234567890";
        let signing_key = generate_signing_key();

        let account = UserAccount::new(api_key, &signing_key, None).unwrap();

        assert!(!account.account_id.is_empty());
        assert!(!account.api_key_hash.is_empty());
        assert!(!account.public_key.is_empty());
        assert!(account.metadata_encrypted.is_none());
    }

    #[test]
    fn test_create_account_with_metadata() {
        let api_key = b"test_api_key_12345678901234567890";
        let signing_key = generate_signing_key();
        let metadata = r#"{"email": "user@example.com"}"#.to_string();

        let account = UserAccount::new(api_key, &signing_key, Some(metadata)).unwrap();

        assert!(account.metadata_encrypted.is_some());
    }
}

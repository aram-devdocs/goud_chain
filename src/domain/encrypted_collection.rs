use chrono::Utc;
use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::constants::ENCRYPTION_SALT;
use crate::crypto::{
    compute_mac, decrypt_data_with_key, encrypt_data_with_key, get_public_key_hex,
    global_key_cache, sign_message, verify_mac, verify_signature,
};
use crate::types::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedCollection {
    pub collection_id: String,
    pub owner_api_key_hash: String,
    pub encrypted_metadata: String, // JSON: {label, tags, created_at}
    pub encrypted_payload: String,  // JSON array of data items
    pub mac: String,                // HMAC for integrity
    pub nonce: String,              // Nonce used for encryption (hex)
    pub signature: String,
    pub public_key: String,
}

impl EncryptedCollection {
    /// Create a new encrypted collection
    /// Note: Size validation happens at API layer (P3-002) before reaching this function
    /// Encryption adds ~1.33x overhead (base64 encoding + nonce + MAC)
    pub fn new(
        label: String,
        data: String,
        api_key: &[u8],
        api_key_hash: String,
        signing_key: &SigningKey,
    ) -> Result<Self> {
        let collection_id = Uuid::new_v4().to_string();
        let public_key = get_public_key_hex(signing_key);

        let key_cache = global_key_cache();
        let encryption_key = key_cache.get_encryption_key(api_key, ENCRYPTION_SALT);
        let mac_key = key_cache.get_mac_key(api_key, ENCRYPTION_SALT);

        let metadata = serde_json::json!({
            "label": label,
            "created_at": Utc::now().timestamp(),
        });
        let metadata_str = serde_json::to_string(&metadata)
            .map_err(|e| crate::types::GoudChainError::Internal(e.to_string()))?;
        let (encrypted_metadata, _meta_nonce) =
            encrypt_data_with_key(&metadata_str, &encryption_key)?;
        let (encrypted_payload, nonce) = encrypt_data_with_key(&data, &encryption_key)?;

        // Compute MAC over collection_id + encrypted data for integrity
        let mac_message = format!(
            "{}{}{}",
            collection_id, encrypted_metadata, encrypted_payload
        );
        let mac = compute_mac(&mac_key, mac_message.as_bytes());

        // Sign the collection
        let signature_message = format!(
            "{}{}{}{}{}",
            collection_id, api_key_hash, encrypted_metadata, encrypted_payload, mac
        );
        let signature = sign_message(signature_message.as_bytes(), signing_key);

        Ok(EncryptedCollection {
            collection_id,
            owner_api_key_hash: api_key_hash,
            encrypted_metadata,
            encrypted_payload,
            mac,
            nonce,
            signature,
            public_key,
        })
    }

    /// Verify the signature and MAC of this collection
    pub fn verify(&self, api_key: Option<&[u8]>) -> Result<()> {
        // Verify signature first
        let signature_message = format!(
            "{}{}{}{}{}",
            self.collection_id,
            self.owner_api_key_hash,
            self.encrypted_metadata,
            self.encrypted_payload,
            self.mac
        );
        verify_signature(
            signature_message.as_bytes(),
            &self.signature,
            &self.public_key,
        )?;

        // If API key provided, verify MAC
        if let Some(key) = api_key {
            let key_cache = global_key_cache();
            let mac_key = key_cache.get_mac_key(key, ENCRYPTION_SALT);
            let mac_message = format!(
                "{}{}{}",
                self.collection_id, self.encrypted_metadata, self.encrypted_payload
            );
            verify_mac(&mac_key, mac_message.as_bytes(), &self.mac)?;
        }

        Ok(())
    }

    /// Decrypt the metadata with the API key
    pub fn decrypt_metadata(&self, api_key: &[u8]) -> Result<serde_json::Value> {
        let key_cache = global_key_cache();
        let encryption_key = key_cache.get_encryption_key(api_key, ENCRYPTION_SALT);
        let decrypted = decrypt_data_with_key(&self.encrypted_metadata, &encryption_key)?;

        serde_json::from_str(&decrypted)
            .map_err(|e| crate::types::GoudChainError::Internal(e.to_string()))
    }

    /// Decrypt the payload with the API key
    pub fn decrypt_payload(&self, api_key: &[u8]) -> Result<String> {
        let key_cache = global_key_cache();
        let encryption_key = key_cache.get_encryption_key(api_key, ENCRYPTION_SALT);
        decrypt_data_with_key(&self.encrypted_payload, &encryption_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{generate_api_key, generate_signing_key, hash_api_key_hex};

    #[test]
    fn test_create_collection() {
        let api_key = generate_api_key();
        let api_key_hash = hash_api_key_hex(&api_key);
        let signing_key = generate_signing_key();

        let collection = EncryptedCollection::new(
            "Test Collection".to_string(),
            r#"{"value": 42}"#.to_string(),
            &api_key,
            api_key_hash,
            &signing_key,
        )
        .unwrap();

        assert!(!collection.collection_id.is_empty());
        assert!(!collection.encrypted_metadata.is_empty());
        assert!(!collection.encrypted_payload.is_empty());
    }

    #[test]
    fn test_verify_collection() {
        let api_key = generate_api_key();
        let api_key_hash = hash_api_key_hex(&api_key);
        let signing_key = generate_signing_key();

        let collection = EncryptedCollection::new(
            "Test".to_string(),
            r#"{"value": 42}"#.to_string(),
            &api_key,
            api_key_hash,
            &signing_key,
        )
        .unwrap();

        assert!(collection.verify(Some(&api_key)).is_ok());
        assert!(collection.verify(None).is_ok()); // Signature-only verification
    }

    #[test]
    fn test_decrypt_collection() {
        let api_key = generate_api_key();
        let api_key_hash = hash_api_key_hex(&api_key);
        let signing_key = generate_signing_key();
        let original_data = r#"{"value": 42}"#;

        let collection = EncryptedCollection::new(
            "Test".to_string(),
            original_data.to_string(),
            &api_key,
            api_key_hash,
            &signing_key,
        )
        .unwrap();

        let decrypted = collection.decrypt_payload(&api_key).unwrap();
        assert_eq!(original_data, decrypted);

        let metadata = collection.decrypt_metadata(&api_key).unwrap();
        assert_eq!(metadata["label"], "Test");
    }
}

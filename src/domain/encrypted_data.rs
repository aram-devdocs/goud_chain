use chrono::Utc;
use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::crypto::{
    decrypt_data, encrypt_data, get_public_key_hex, hash_pin, sign_message, verify_signature,
};
use crate::types::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub data_id: String,
    pub label: String,
    pub encrypted_payload: String,
    pub encryption_hint: String,
    pub timestamp: i64,
    pub signature: String,
    pub public_key: String,
}

impl EncryptedData {
    /// Create a new encrypted data entry
    pub fn new(
        label: String,
        json_data: String,
        pin: &str,
        signing_key: &SigningKey,
    ) -> Result<Self> {
        let data_id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();
        let public_key = get_public_key_hex(signing_key);

        // Encrypt the JSON data
        let encrypted_payload = encrypt_data(&json_data, pin)?;
        let encryption_hint = hash_pin(pin);

        // Create message to sign
        let message = format!("{}{}{}{}", data_id, label, encrypted_payload, timestamp);
        let signature = sign_message(message.as_bytes(), signing_key);

        Ok(EncryptedData {
            data_id,
            label,
            encrypted_payload,
            encryption_hint,
            timestamp,
            signature,
            public_key,
        })
    }

    /// Verify the signature of this encrypted data
    pub fn verify(&self) -> Result<()> {
        let message = format!(
            "{}{}{}{}",
            self.data_id, self.label, self.encrypted_payload, self.timestamp
        );

        verify_signature(message.as_bytes(), &self.signature, &self.public_key)
    }

    /// Decrypt the data with the provided PIN
    pub fn decrypt(&self, pin: &str) -> Result<String> {
        decrypt_data(&self.encrypted_payload, pin, &self.encryption_hint)
    }

    /// Calculate hash for merkle tree
    pub fn hash(&self) -> String {
        let content = format!(
            "{}{}{}",
            self.data_id, self.encrypted_payload, self.timestamp
        );
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::generate_signing_key;

    #[test]
    fn test_create_and_verify() {
        let signing_key = generate_signing_key();
        let data = EncryptedData::new(
            "Test".to_string(),
            r#"{"value": 42}"#.to_string(),
            "1234",
            &signing_key,
        )
        .unwrap();

        assert!(data.verify().is_ok());
    }

    #[test]
    fn test_encrypt_decrypt() {
        let signing_key = generate_signing_key();
        let original_data = r#"{"value": 42}"#;

        let data = EncryptedData::new(
            "Test".to_string(),
            original_data.to_string(),
            "1234",
            &signing_key,
        )
        .unwrap();

        let decrypted = data.decrypt("1234").unwrap();
        assert_eq!(original_data, decrypted);
    }
}

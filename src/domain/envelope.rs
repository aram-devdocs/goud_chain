use serde::{Deserialize, Serialize};

use crate::constants::AES_KEY_SIZE_BYTES;
use crate::crypto::{decrypt_data_with_key, encrypt_data_with_key, global_key_cache, hash_api_key};
use crate::types::{GoudChainError, Result};

use super::encrypted_collection::EncryptedCollection;
use super::user_account::UserAccount;

/// Envelope containing encrypted user account data
/// Only decryptable by user with matching API key
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountEnvelope {
    pub encrypted_data: String, // Base64(AES-GCM(UserAccount JSON))
    pub api_key_hash: String,   // SHA-256 hash for lookup (NOT the encrypted content)
    pub nonce: String,          // Hex-encoded nonce (12 bytes)
}

/// Envelope for collections (collections already encrypted with user's API key)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionEnvelope {
    pub collection: EncryptedCollection,
}

/// Container for all encrypted envelopes in a block
/// This entire structure is Base64-encoded and stored in Block.encrypted_block_data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockEnvelopeContainer {
    pub account_envelopes: Vec<AccountEnvelope>,
    pub collection_envelopes: Vec<CollectionEnvelope>,
    pub validator: String, // Plaintext (needed for PoA consensus validation)
}

/// Derive envelope-specific encryption key using HKDF
/// Domain separation: "envelope_v1:{block_salt}" prevents key reuse attacks
pub fn derive_envelope_key(api_key: &[u8], block_salt: &str) -> [u8; AES_KEY_SIZE_BYTES] {
    let key_cache = global_key_cache();
    let salt = format!("envelope_v1:{}", block_salt);
    key_cache.get_encryption_key(api_key, salt.as_bytes())
}

/// Encrypt a UserAccount into an AccountEnvelope
/// The account is serialized to JSON, then encrypted with a key derived from the user's API key
pub fn encrypt_account_envelope(
    account: &UserAccount,
    api_key: &[u8],
    block_salt: &str,
) -> Result<AccountEnvelope> {
    let envelope_key = derive_envelope_key(api_key, block_salt);
    let account_json = serde_json::to_string(account)
        .map_err(|e| GoudChainError::Internal(format!("Failed to serialize account: {}", e)))?;

    let (encrypted_data, nonce) = encrypt_data_with_key(&account_json, &envelope_key)?;

    Ok(AccountEnvelope {
        encrypted_data,
        api_key_hash: hash_api_key(api_key),
        nonce,
    })
}

/// Decrypt an AccountEnvelope back to UserAccount
/// Requires the user's API key and the block's salt
pub fn decrypt_account_envelope(
    envelope: &AccountEnvelope,
    api_key: &[u8],
    block_salt: &str,
) -> Result<UserAccount> {
    let envelope_key = derive_envelope_key(api_key, block_salt);
    let decrypted_json = decrypt_data_with_key(&envelope.encrypted_data, &envelope_key)?;

    serde_json::from_str(&decrypted_json)
        .map_err(|e| GoudChainError::Internal(format!("Failed to deserialize account: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{generate_api_key, generate_signing_key};

    fn create_test_account(api_key: &[u8]) -> UserAccount {
        let signing_key = generate_signing_key();
        UserAccount::new(api_key, &signing_key, None).unwrap()
    }

    #[test]
    fn test_envelope_encryption_roundtrip() {
        let api_key = generate_api_key();
        let account = create_test_account(&api_key);
        let block_salt = "test_salt_12345";

        let envelope = encrypt_account_envelope(&account, &api_key, block_salt).unwrap();
        let decrypted = decrypt_account_envelope(&envelope, &api_key, block_salt).unwrap();

        assert_eq!(account.account_id, decrypted.account_id);
        assert_eq!(account.api_key_hash, decrypted.api_key_hash);
        assert_eq!(account.public_key, decrypted.public_key);
    }

    #[test]
    fn test_wrong_api_key_fails_decryption() {
        let api_key1 = generate_api_key();
        let api_key2 = generate_api_key();
        let account = create_test_account(&api_key1);
        let block_salt = "test_salt";

        let envelope = encrypt_account_envelope(&account, &api_key1, block_salt).unwrap();
        let result = decrypt_account_envelope(&envelope, &api_key2, block_salt);

        assert!(result.is_err());
    }

    #[test]
    fn test_wrong_block_salt_fails_decryption() {
        let api_key = generate_api_key();
        let account = create_test_account(&api_key);

        let envelope = encrypt_account_envelope(&account, &api_key, "salt1").unwrap();
        let result = decrypt_account_envelope(&envelope, &api_key, "salt2");

        assert!(result.is_err());
    }

    #[test]
    fn test_envelope_api_key_hash_matches_account() {
        let api_key = generate_api_key();
        let account = create_test_account(&api_key);
        let block_salt = "test_salt";

        let envelope = encrypt_account_envelope(&account, &api_key, block_salt).unwrap();

        // Envelope's api_key_hash should match the account's api_key_hash
        assert_eq!(envelope.api_key_hash, account.api_key_hash);
    }

    #[test]
    fn test_different_salts_produce_different_ciphertext() {
        let api_key = generate_api_key();
        let account = create_test_account(&api_key);

        let envelope1 = encrypt_account_envelope(&account, &api_key, "salt1").unwrap();
        let envelope2 = encrypt_account_envelope(&account, &api_key, "salt2").unwrap();

        // Different salts should produce different ciphertext (different derived keys)
        assert_ne!(envelope1.encrypted_data, envelope2.encrypted_data);
    }
}

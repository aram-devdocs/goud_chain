use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};

use crate::constants::{ED25519_PUBLIC_KEY_SIZE, ED25519_SIGNATURE_SIZE};
use crate::types::{GoudChainError, Result};

/// Sign a message with the provided signing key
pub fn sign_message(message: &[u8], signing_key: &SigningKey) -> String {
    let signature = signing_key.sign(message);
    hex::encode(signature.to_bytes())
}

/// Verify a signature against a message and public key
pub fn verify_signature(message: &[u8], signature_hex: &str, public_key_hex: &str) -> Result<()> {
    // Decode public key
    let pk_bytes = hex::decode(public_key_hex).map_err(GoudChainError::HexDecodingError)?;

    if pk_bytes.len() != ED25519_PUBLIC_KEY_SIZE {
        return Err(GoudChainError::InvalidSignature);
    }

    let pk_array: [u8; ED25519_PUBLIC_KEY_SIZE] = pk_bytes
        .try_into()
        .map_err(|_| GoudChainError::InvalidSignature)?;

    let verifying_key =
        VerifyingKey::from_bytes(&pk_array).map_err(|_| GoudChainError::InvalidSignature)?;

    // Decode signature
    let sig_bytes = hex::decode(signature_hex).map_err(GoudChainError::HexDecodingError)?;

    if sig_bytes.len() != ED25519_SIGNATURE_SIZE {
        return Err(GoudChainError::InvalidSignature);
    }

    let sig_array: [u8; ED25519_SIGNATURE_SIZE] = sig_bytes
        .try_into()
        .map_err(|_| GoudChainError::InvalidSignature)?;

    let signature = Signature::from_bytes(&sig_array);

    // Verify
    verifying_key
        .verify(message, &signature)
        .map_err(|_| GoudChainError::InvalidSignature)
}

/// Get the public key (hex encoded) from a signing key
pub fn get_public_key_hex(signing_key: &SigningKey) -> String {
    hex::encode(signing_key.verifying_key().to_bytes())
}

/// Generate a new random signing key
pub fn generate_signing_key() -> SigningKey {
    SigningKey::from_bytes(&rand::random::<[u8; 32]>())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sign_and_verify() {
        let signing_key = generate_signing_key();
        let message = b"Hello, blockchain!";

        let signature = sign_message(message, &signing_key);
        let public_key = get_public_key_hex(&signing_key);

        let result = verify_signature(message, &signature, &public_key);
        assert!(result.is_ok());
    }

    #[test]
    fn test_verify_invalid_signature() {
        let signing_key = generate_signing_key();
        let message = b"Hello, blockchain!";

        let signature = sign_message(message, &signing_key);
        let public_key = get_public_key_hex(&signing_key);

        // Try to verify with wrong message
        let wrong_message = b"Wrong message";
        let result = verify_signature(wrong_message, &signature, &public_key);
        assert!(result.is_err());
    }
}

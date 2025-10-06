pub mod encryption;
pub mod signature;

// Re-export commonly used functions
pub use encryption::{decrypt_data, encrypt_data, hash_pin};
pub use signature::{generate_signing_key, get_public_key_hex, sign_message, verify_signature};

pub mod api_key;
pub mod blind_index;
pub mod encryption;
pub mod hkdf;
pub mod key_cache;
pub mod mac;
pub mod signature;

// Re-export commonly used functions
pub use api_key::{decode_api_key, encode_api_key, generate_api_key, validate_api_key};
pub use blind_index::generate_account_blind_index_with_salt;
pub use encryption::{decrypt_data_with_key, encrypt_data_with_key};
pub use hkdf::{
    constant_time_compare_bytes, derive_session_encryption_key, hash_api_key, hash_api_key_hex,
};
pub use key_cache::global_key_cache;
pub use mac::{compute_mac, verify_mac};
pub use signature::{generate_signing_key, get_public_key_hex, sign_message, verify_signature};

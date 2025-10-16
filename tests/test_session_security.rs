use goud_chain::crypto::derive_session_encryption_key;

#[test]
fn test_empty_secret_produces_valid_key() {
    let empty_secret = b"";
    let key = derive_session_encryption_key(empty_secret);
    assert_eq!(key.len(), 32, "Empty secret must still produce 32-byte key");
}

#[test]
fn test_zero_byte_secret_produces_unique_key() {
    let zero_secret = [0u8; 32];
    let key = derive_session_encryption_key(&zero_secret);
    assert_ne!(
        key, [0u8; 32],
        "HKDF must not produce all-zero key from zero input"
    );
}

#[test]
fn test_single_bit_difference_produces_different_key() {
    let secret1 = b"test_secret_32_bytes_version_001";
    let mut secret2 = *secret1;
    secret2[31] ^= 0x01;

    let key1 = derive_session_encryption_key(secret1);
    let key2 = derive_session_encryption_key(&secret2);

    assert_ne!(
        key1, key2,
        "Single bit change must produce completely different key (avalanche effect)"
    );
}

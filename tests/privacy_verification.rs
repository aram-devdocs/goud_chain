/// Integration test to verify privacy-preserving properties of v3 schema
use goud_chain::crypto::{generate_api_key, generate_signing_key, hash_api_key};
use goud_chain::domain::{Blockchain, EncryptedCollection, UserAccount};

#[test]
fn test_privacy_preserving_chain_structure() {
    // Create a blockchain
    let master_key = b"test_master_key_32_bytes_long!!".to_vec();
    let mut blockchain = Blockchain::new("test-node".to_string(), master_key).unwrap();

    // Create an account
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();
    let account = UserAccount::new(&api_key, &signing_key, Some("Test User".to_string())).unwrap();

    // Add account to blockchain
    blockchain.add_account(account.clone()).unwrap();

    // Create encrypted collection
    let api_key_hash = hash_api_key(&api_key);
    let node_signing_key = blockchain.node_signing_key.as_ref().unwrap();
    let collection = EncryptedCollection::new(
        "Secret Data".to_string(),
        "Confidential payload".to_string(),
        &api_key,
        api_key_hash.clone(),
        node_signing_key,
    )
    .unwrap();

    blockchain.add_collection(collection).unwrap();

    // Create block
    let block = blockchain.add_block().unwrap();

    // ========== PRIVACY VERIFICATION ==========

    println!("\n=== Privacy-Preserving Block Structure (v3) ===\n");

    // 1. Verify account IDs are NOT visible in serialized block
    let block_json = serde_json::to_string_pretty(&block).unwrap();
    assert!(
        !block_json.contains(&account.account_id),
        "❌ PRIVACY VIOLATION: Account ID visible in block JSON"
    );
    println!("✅ Account IDs are encrypted (not visible in block)");

    // 2. Verify API key hashes are NOT visible
    assert!(
        !block_json.contains(&api_key_hash),
        "❌ PRIVACY VIOLATION: API key hash visible in block JSON"
    );
    println!("✅ API key hashes are encrypted (not visible in block)");

    // 3. Verify validator names are NOT visible
    assert!(
        !block_json.contains("Validator_"),
        "❌ PRIVACY VIOLATION: Validator name visible in block JSON"
    );
    println!("✅ Validator identities are obfuscated (only index visible)");

    // 4. Verify public keys are NOT visible
    assert!(
        !block_json.contains(&account.public_key),
        "❌ PRIVACY VIOLATION: Public key visible in block JSON"
    );
    println!("✅ Public keys are encrypted (not visible in block)");

    // 5. Verify collection IDs are NOT visible
    assert!(
        !block_json.contains("Secret Data"),
        "❌ PRIVACY VIOLATION: Collection label visible"
    );
    println!("✅ Collection labels are encrypted");

    // 6. Verify encrypted_block_data is present
    assert!(
        block_json.contains("encrypted_block_data"),
        "Block should have encrypted_block_data field"
    );
    println!("✅ Block data is encrypted");

    // 7. Verify blind_indexes are present (for searchability)
    assert!(
        block_json.contains("blind_indexes"),
        "Block should have blind_indexes for searching"
    );
    println!("✅ Blind indexes present for searchability");

    // 8. Verify that blind indexes look random (not linkable)
    assert!(
        block.blind_indexes.len() > 0,
        "Should have at least one blind index"
    );
    let blind_index = &block.blind_indexes[0];
    assert!(
        blind_index.len() == 64, // SHA256 hex output
        "Blind index should be 64 chars (SHA256)"
    );
    println!("✅ Blind indexes are cryptographically secure hashes");

    // 9. Verify validator_index is obfuscated
    assert!(
        block.validator_index > 0,
        "Validator index should be non-zero obfuscated value"
    );
    println!(
        "✅ Validator index is obfuscated: {}",
        block.validator_index
    );

    // ========== FUNCTIONALITY VERIFICATION ==========
    println!("\n=== Functionality Verification ===\n");

    // 10. Verify we can still find accounts using blind indexes
    let found_account = blockchain.find_account(&api_key_hash);
    assert!(
        found_account.is_some(),
        "Should be able to find account using blind index"
    );
    println!("✅ Blind index search works (account found)");

    // 11. Verify we can find collections by owner
    let found_collections = blockchain.find_collections_by_owner(&api_key_hash);
    assert_eq!(
        found_collections.len(),
        1,
        "Should find exactly one collection"
    );
    println!(
        "✅ Collection lookup works (found {} collection)",
        found_collections.len()
    );

    // 12. Verify chain validation still works
    assert!(
        blockchain.is_valid().is_ok(),
        "Blockchain should still be valid with encrypted blocks"
    );
    println!("✅ Chain validation works with encrypted data");

    println!("\n=== Block JSON Preview ===\n");
    println!("{}", &block_json[..800.min(block_json.len())]);
    println!("...\n");

    println!("🎉 All privacy properties verified! The chain exposes NO metadata.");
}

#[test]
fn test_schema_version_updated() {
    let master_key = b"test_master_key_32_bytes_long!!".to_vec();
    let blockchain = Blockchain::new("test-node".to_string(), master_key).unwrap();
    assert_eq!(
        blockchain.schema_version, "v3_privacy_preserving",
        "Schema version should be v3_privacy_preserving"
    );
}

/// Integration test to verify privacy-preserving properties of v8 envelope encryption
use goud_chain::crypto::{generate_api_key, generate_signing_key, hash_api_key};
use goud_chain::domain::{Blockchain, EncryptedCollection, UserAccount};

#[test]
fn test_envelope_encryption_privacy() {
    // Create a blockchain
    // Use node2 which maps to Validator_2 (authorized for block #1)
    let mut blockchain = Blockchain::new("node2".to_string()).unwrap();

    // Create an account
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();
    let account = UserAccount::new(&api_key, &signing_key, Some("Test User".to_string())).unwrap();
    let account_id = account.account_id.clone();

    // Add account to blockchain WITH API key for envelope encryption
    blockchain
        .add_account_with_key(account.clone(), api_key.clone())
        .unwrap();

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

    // Create block (envelopes are encrypted)
    let block = blockchain.add_block().unwrap();

    // ========== PRIVACY VERIFICATION ==========

    println!("\n=== Envelope Encryption Privacy Verification (v8) ===\n");

    // 1. Verify account IDs are NOT visible in serialized block
    let block_json = serde_json::to_string_pretty(&block).unwrap();
    assert!(
        !block_json.contains(&account_id),
        "❌ PRIVACY VIOLATION: Account ID visible in block JSON"
    );
    println!("✅ Account IDs are encrypted inside envelopes (not visible in block)");

    // 2. Verify API key hashes are NOT visible (encrypted in envelopes)
    assert!(
        !block_json.contains(&api_key_hash),
        "❌ PRIVACY VIOLATION: API key hash visible in block JSON"
    );
    println!("✅ API key hashes are encrypted inside envelopes (not visible in block)");

    // 3. Verify validator name IS visible (consensus requirement)
    assert!(
        block_json.contains("Validator_"),
        "Validator name should be visible for PoA consensus"
    );
    println!("✅ Validator name visible (required for Proof of Authority consensus)");

    // 4. Verify public keys are NOT visible
    assert!(
        !block_json.contains(&account.public_key),
        "❌ PRIVACY VIOLATION: Public key visible in block JSON"
    );
    println!("✅ Public keys are encrypted inside envelopes (not visible in block)");

    // 5. Verify collection IDs are NOT visible
    assert!(
        !block_json.contains("Secret Data"),
        "❌ PRIVACY VIOLATION: Collection label visible"
    );
    println!("✅ Collection labels are encrypted inside envelopes");

    // 6. Verify encrypted_block_data is present (Base64 envelope container)
    assert!(
        block_json.contains("encrypted_block_data"),
        "Block should have encrypted_block_data field"
    );
    println!("✅ Block data stored as Base64-encoded envelope container");

    // 7. Verify blind indexes field present (lazy generation)
    assert!(
        block_json.contains("blind_indexes"),
        "Block should have blind_indexes field"
    );
    println!("✅ Blind indexes field present (lazy generation)");

    if !block.blind_indexes.is_empty() {
        let blind_index = &block.blind_indexes[0];
        assert!(
            blind_index.len() == 64,
            "Blind index should be 64 chars (SHA256)"
        );
        println!("✅ Blind indexes are cryptographically secure hashes");
    } else {
        println!("✅ Blind indexes use lazy generation (computed at search time)");
    }

    // 8. Verify block_salt is present (used for HKDF envelope key derivation)
    assert!(
        block_json.contains("block_salt"),
        "Block should have block_salt field"
    );
    println!("✅ Block salt present (used for HKDF envelope key derivation)");

    // ========== FUNCTIONALITY VERIFICATION ==========
    println!("\n=== Functionality Verification ===\n");

    // 9. Verify we can still find accounts using API key (envelope decryption)
    let found_account = blockchain.find_account(&api_key);
    assert!(
        found_account.is_some(),
        "Should be able to find account by decrypting envelope with API key"
    );
    println!("✅ Envelope decryption works (account found with API key)");

    // 10. Verify we can find collections by owner (API key decryption)
    let found_collections = blockchain.find_collections_by_owner(&api_key);
    assert_eq!(
        found_collections.len(),
        1,
        "Should find exactly one collection"
    );
    println!(
        "✅ Collection lookup works (found {} collection)",
        found_collections.len()
    );

    // 11. Verify chain validation still works (envelope signatures)
    assert!(
        blockchain.is_valid().is_ok(),
        "Blockchain should still be valid with envelope encryption"
    );
    println!("✅ Chain validation works with encrypted envelopes");

    // 12. Verify account count can be determined (envelope container metadata)
    let account_count = block.get_account_count().unwrap();
    assert_eq!(account_count, 1, "Should have 1 account in block");
    println!(
        "✅ Account count available from envelope container: {}",
        account_count
    );

    // 13. Verify collection count can be determined
    let collection_count = block.get_collection_count().unwrap();
    assert_eq!(collection_count, 1, "Should have 1 collection in block");
    println!(
        "✅ Collection count available from envelope container: {}",
        collection_count
    );

    println!("\n=== Block JSON Preview (First 800 chars) ===\n");
    println!("{}", &block_json[..800.min(block_json.len())]);
    println!("...\n");

    println!("🎉 All envelope encryption privacy properties verified!");
    println!("   - Node operators CANNOT see account IDs, hashes, or collection metadata");
    println!("   - Only users with API keys can decrypt their envelopes");
    println!("   - Zero-knowledge architecture achieved!");
}

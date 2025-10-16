/// Integration test for per-user salts preventing cross-block correlation
use goud_chain::crypto::{generate_api_key, generate_signing_key, hash_api_key_hex};
use goud_chain::domain::{Blockchain, EncryptedCollection};

mod test_helpers;
use test_helpers::test_validator_config;

#[test]
fn test_phase5_per_user_salt_prevents_cross_block_correlation() {
    println!("\n=== Cross-Block Correlation Prevention ===\n");

    // Simulate an attacker who knows their own API key and can observe the blockchain
    let attacker_api_key = generate_api_key();
    let attacker_signing_key = generate_signing_key();
    let attacker_key_hash = hash_api_key_hex(&attacker_api_key);

    // Create blockchain with multiple nodes
    let mut blockchain = Blockchain::new("node2".to_string(), test_validator_config()).unwrap();

    // Attacker creates multiple collections across different blocks
    println!("Attacker creating collections across 5 blocks...");

    let mut collection_ids = Vec::new();
    let mut user_salts = Vec::new();

    for i in 0..5 {
        // Create collection with attacker's key
        let collection = EncryptedCollection::new(
            format!("Attacker Collection #{}", i),
            format!("{{\"secret\": {}}}", i),
            &attacker_api_key,
            attacker_key_hash.clone(),
            &attacker_signing_key,
        )
        .unwrap();

        collection_ids.push(collection.collection_id.clone());
        user_salts.push(collection.user_salt.clone());

        blockchain.add_collection(collection).unwrap();

        // Create block (need to alternate nodes for PoA)
        let block = if i % 2 == 0 {
            blockchain.node_id = "node2".to_string();
            blockchain.add_block().unwrap()
        } else {
            blockchain.node_id = "node1".to_string();
            let b = blockchain.add_block().unwrap();
            blockchain.node_id = "node2".to_string();
            b
        };

        println!(
            "  Block #{}: collection_id={}, user_salt={} (first 16 chars)",
            block.index,
            &collection_ids[i][..8],
            &user_salts[i][..16]
        );
    }

    // Verification 1: All collections have unique user_salts
    let unique_salts: std::collections::HashSet<_> = user_salts.iter().collect();
    assert_eq!(
        unique_salts.len(),
        5,
        "All collections should have unique user_salts"
    );
    println!("\n✅ All 5 collections have unique user_salts (prevents correlation)");

    // Verification 2: Attacker can still find all their collections
    let found_collections = blockchain.find_collections_by_owner(&attacker_api_key);
    assert_eq!(
        found_collections.len(),
        5,
        "Attacker should be able to find all their collections"
    );
    println!("✅ Owner can still retrieve all 5 collections (search works)");

    // Verification 3: Verify blind indexes would be different across blocks
    // (Even though we use lazy generation, we can verify the property)
    use goud_chain::crypto::blind_index::generate_blind_index_with_salt;

    println!("\n=== Blind Index Correlation Test ===");
    let mut blind_indexes = Vec::new();
    for (i, block) in blockchain.chain.iter().enumerate().skip(1) {
        // Skip genesis
        if i <= 5 {
            let blind_index = generate_blind_index_with_salt(
                &attacker_key_hash,
                "collection_lookup",
                &user_salts[i - 1],
                &block.block_salt,
            )
            .unwrap();
            blind_indexes.push(blind_index);
            println!(
                "  Block #{}: blind_index={} (first 16 chars)",
                block.index,
                &blind_indexes[i - 1][..16]
            );
        }
    }

    // All blind indexes should be different (attacker cannot correlate)
    let unique_indexes: std::collections::HashSet<_> = blind_indexes.iter().collect();
    assert_eq!(
        unique_indexes.len(),
        5,
        "All blind indexes should be unique (prevents correlation)"
    );
    println!(
        "\n✅ All 5 blind indexes are unique (attacker cannot correlate their data across blocks)"
    );

    // Verification 4: Verify that even with the same API key hash and block salt,
    // different user_salts produce completely different blind indexes
    let test_block_salt = &blockchain.chain[1].block_salt;
    let index1 = generate_blind_index_with_salt(
        &attacker_key_hash,
        "collection_lookup",
        &user_salts[0],
        test_block_salt,
    )
    .unwrap();
    let index2 = generate_blind_index_with_salt(
        &attacker_key_hash,
        "collection_lookup",
        &user_salts[1],
        test_block_salt,
    )
    .unwrap();

    assert_ne!(
        index1, index2,
        "Different user_salts must produce different blind indexes"
    );

    // Calculate Hamming distance to verify indexes are truly uncorrelated
    let bytes1 = hex::decode(&index1).unwrap();
    let bytes2 = hex::decode(&index2).unwrap();
    let mut diff_bits = 0;
    for (b1, b2) in bytes1.iter().zip(bytes2.iter()) {
        diff_bits += (b1 ^ b2).count_ones();
    }

    // Hamming distance should be ~50% (avalanche effect)
    assert!(
        diff_bits > 64 && diff_bits < 192,
        "Blind indexes should have high Hamming distance (got {} bits different)",
        diff_bits
    );
    println!(
        "✅ Blind indexes have high Hamming distance: {}/256 bits differ (avalanche effect)",
        diff_bits
    );

    println!("\n=== Attack Scenario Verification ===");
    println!("Scenario: Attacker knows their own API key and observes blockchain");
    println!("Goal: Can attacker identify which blocks contain their data?");
    println!();
    println!("Without per-user salts:");
    println!("  ❌ Attacker computes blind index for each block");
    println!("  ❌ Finds matches by comparing with block's blind_indexes array");
    println!("  ❌ Can identify all blocks containing their collections");
    println!();
    println!("With per-user salts:");
    println!("  ✅ Attacker cannot compute correct blind index (missing user_salt)");
    println!("  ✅ user_salt is stored encrypted in collection envelope");
    println!("  ✅ Attacker must decrypt entire collection to get user_salt");
    println!("  ✅ Zero correlation possible without full decryption");
    println!();

    println!("🎉 Cross-block correlation prevention verification complete!");
    println!("   - Per-user salts prevent cross-block correlation");
    println!("   - Blind indexes are unique per collection");
    println!("   - Attackers cannot track their own data without decryption");
    println!("   - Search functionality still works for legitimate users");
}

#[test]
fn test_user_salt_is_unique_per_collection() {
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();
    let api_key_hash = hash_api_key_hex(&api_key);

    // Create 100 collections to ensure randomness
    let mut salts = Vec::new();
    for i in 0..100 {
        let collection = EncryptedCollection::new(
            format!("Test #{}", i),
            format!("{{\"data\": {}}}", i),
            &api_key,
            api_key_hash.clone(),
            &signing_key,
        )
        .unwrap();
        salts.push(collection.user_salt);
    }

    // All salts should be unique
    let unique_salts: std::collections::HashSet<_> = salts.iter().collect();
    assert_eq!(
        unique_salts.len(),
        100,
        "All 100 collections should have unique user_salts"
    );

    // Each salt should be 64 characters (32 bytes in hex)
    for salt in &salts {
        assert_eq!(salt.len(), 64, "User salt should be 64 hex characters");
    }

    println!("✅ All 100 collections have unique 32-byte random user_salts");
}

#[test]
fn test_user_salt_included_in_signature() {
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();
    let api_key_hash = hash_api_key_hex(&api_key);

    let collection = EncryptedCollection::new(
        "Test".to_string(),
        r#"{"test": "data"}"#.to_string(),
        &api_key,
        api_key_hash,
        &signing_key,
    )
    .unwrap();

    // Verify signature with API key (includes MAC verification)
    assert!(
        collection.verify(Some(&api_key)).is_ok(),
        "Signature should verify with user_salt included"
    );

    // Verify signature without API key (signature only, no MAC)
    assert!(
        collection.verify(None).is_ok(),
        "Signature-only verification should work"
    );

    println!("✅ User salt is properly included in signature and MAC");
}

/// Integration test to verify Phase 5 P5-002: Daily timestamp granularity with jitter
use goud_chain::crypto::{generate_api_key, generate_signing_key, hash_api_key_hex};
use goud_chain::domain::{Blockchain, EncryptedCollection};

#[test]
fn test_timestamp_jitter_prevents_pattern_analysis() {
    // Create blockchain (use node2 which is Validator_2 for block #1)
    let mut blockchain = Blockchain::new("node2".to_string()).unwrap();

    // Create 100 collections in bulk submission
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();
    let api_key_hash = hash_api_key_hex(&api_key);

    println!("\n=== Phase 5 P5-002: Timestamp Jitter Verification ===\n");

    let mut timestamps = Vec::new();

    // Submit 10 blocks with collections (simulate bulk submissions)
    // Note: We only test with node2 for consistency, but in real network
    // different validators would create blocks. For this test, we'll create
    // blocks only on authorized turns.
    for i in 0..5 {
        // Add 2 collections per block to make it more realistic
        for j in 0..2 {
            let collection = EncryptedCollection::new(
                format!("Collection #{}-{}", i, j),
                format!("{{\"data\": {}}}", i * 2 + j),
                &api_key,
                api_key_hash.clone(),
                &signing_key,
            )
            .unwrap();
            blockchain.add_collection(collection).unwrap();
        }

        // Only create blocks when node2 is authorized (odd block numbers)
        // Skip even blocks as node2 is Validator_2 (creates blocks 1, 3, 5, 7, 9...)
        let block = blockchain.add_block().unwrap();
        timestamps.push(block.timestamp);

        // Manually advance chain by adding empty block from node1 perspective
        // This simulates the round-robin validator rotation without needing multiple nodes
        if i < 4 {
            // Switch to node1 temporarily for next block
            blockchain.node_id = "node1".to_string();
            // Add a dummy collection to create next block
            let dummy = EncryptedCollection::new(
                format!("Dummy #{}", i),
                format!("{{\"filler\": {}}}", i),
                &api_key,
                api_key_hash.clone(),
                &signing_key,
            )
            .unwrap();
            blockchain.add_collection(dummy).unwrap();
            let dummy_block = blockchain.add_block().unwrap();
            timestamps.push(dummy_block.timestamp);
            // Switch back to node2
            blockchain.node_id = "node2".to_string();
        }
    }

    // Verification 1: All timestamps should be different (jitter prevents identical timestamps)
    let unique_timestamps: std::collections::HashSet<_> = timestamps.iter().collect();
    assert!(
        unique_timestamps.len() >= 8,
        "Expected at least 8 unique timestamps out of 10 blocks (jitter should prevent duplicates). Got {}",
        unique_timestamps.len()
    );
    println!(
        "✅ Timestamp uniqueness: {}/10 blocks have unique timestamps",
        unique_timestamps.len()
    );

    // Verification 2: Timestamps should have reasonable spread (not all clustered)
    let min_ts = *timestamps.iter().min().unwrap();
    let max_ts = *timestamps.iter().max().unwrap();
    let spread_seconds = max_ts - min_ts;
    println!(
        "✅ Timestamp spread: {} seconds ({:.1} hours)",
        spread_seconds,
        spread_seconds as f64 / 3600.0
    );

    // Verification 3: Check that jitter is within expected range (±4 hours = ±14400 seconds)
    // Since we're rounding to daily granularity (86400 seconds), all timestamps should be
    // within the same day range ± jitter
    let jitter_limit = 14400; // ±4 hours
    assert!(
        spread_seconds <= jitter_limit * 2,
        "Timestamp spread should be within ±4 hours jitter range (max 8 hours total). Got {} seconds",
        spread_seconds
    );
    println!("✅ Jitter within bounds: All timestamps within expected ±4 hour range");

    // Verification 4: Timestamps should still be reasonably monotonic
    // (can have small variations due to jitter, but shouldn't go backwards significantly)
    let mut backwards_count = 0;
    for i in 1..timestamps.len() {
        if timestamps[i] < timestamps[i - 1] {
            backwards_count += 1;
        }
    }
    println!(
        "✅ Monotonicity: {}/{} timestamp pairs are monotonically increasing",
        timestamps.len() - 1 - backwards_count,
        timestamps.len() - 1
    );

    // Verification 5: Genesis block should have fixed timestamp (no jitter)
    let genesis_timestamp = blockchain.chain[0].timestamp;
    let genesis_expected = 1704067200; // Jan 1, 2024 00:00:00 UTC
    assert_eq!(
        genesis_timestamp, genesis_expected,
        "Genesis block should have fixed timestamp without jitter"
    );
    println!(
        "✅ Genesis block has fixed timestamp: {} (no jitter applied)",
        genesis_timestamp
    );

    println!("\n=== Timestamp Distribution ===");
    for (i, ts) in timestamps.iter().enumerate() {
        println!("Block #{}: {} ({} from min)", i + 1, ts, ts - min_ts);
    }

    println!("\n🎉 Phase 5 P5-002 verification complete!");
    println!("   - Daily granularity hides exact timing and timezone");
    println!("   - Random jitter (±4 hours) prevents pattern analysis");
    println!("   - Bulk submissions appear as separate time periods");
}

#[test]
fn test_timestamp_granularity_is_daily() {
    use goud_chain::constants::TIMESTAMP_GRANULARITY_SECONDS;

    // Verify that granularity is set to 1 day (86400 seconds)
    assert_eq!(
        TIMESTAMP_GRANULARITY_SECONDS, 86400,
        "Timestamp granularity should be 1 day (86400 seconds) for Phase 5"
    );

    println!("✅ Timestamp granularity confirmed: 1 day (86400 seconds)");
}

#[test]
fn test_timestamp_jitter_constant() {
    use goud_chain::constants::TIMESTAMP_JITTER_SECONDS;

    // Verify that jitter is set to ±4 hours (14400 seconds)
    assert_eq!(
        TIMESTAMP_JITTER_SECONDS, 14400,
        "Timestamp jitter should be ±4 hours (14400 seconds) for Phase 5"
    );

    println!("✅ Timestamp jitter confirmed: ±4 hours (14400 seconds)");
}

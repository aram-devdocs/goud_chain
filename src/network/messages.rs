use serde::{Deserialize, Serialize};

use crate::domain::{Block, EncryptedCollection, UserAccount};

/// P2P network message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PMessage {
    // Existing messages
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewAccount(UserAccount),
    NewCollection(EncryptedCollection),

    // Authentication messages (Phase 4)
    Hello {
        node_id: String,
        signature: String, // Ed25519 signature of node_id using node's signing key
    },
    Challenge {
        nonce: Vec<u8>, // Random challenge for mutual authentication
    },
    ChallengeResponse {
        signature: String, // Signature of the nonce
    },
}

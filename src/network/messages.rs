use serde::{Deserialize, Serialize};

use crate::domain::{Block, EncryptedData};

/// P2P network message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PMessage {
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewData(EncryptedData),
}

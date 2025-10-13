use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tracing::{error, info, warn};

use crate::constants::{
    CHECKPOINT_INTERVAL, PEER_SYNC_DELAY_SECONDS, REPUTATION_PENALTY_INVALID_BLOCK,
    REPUTATION_REWARD_VALID_BLOCK,
};
use crate::domain::{Block, Blockchain};
use crate::network::messages::P2PMessage;
use crate::storage::BlockchainStore;
use crate::types::{GoudChainError, Result};

pub struct P2PNode {
    pub peers: Arc<Mutex<Vec<String>>>,
    pub blockchain: Arc<Mutex<Blockchain>>,
    pub blockchain_store: Arc<BlockchainStore>,
    pub peer_reputation: Arc<Mutex<HashMap<String, i32>>>,
}

impl P2PNode {
    /// Create a new P2P node with configured peers
    pub fn new(
        blockchain: Arc<Mutex<Blockchain>>,
        blockchain_store: Arc<BlockchainStore>,
        peers: Vec<String>,
    ) -> Self {
        if !peers.is_empty() {
            info!(peers = ?peers, "Configured peers");
        }

        P2PNode {
            peers: Arc::new(Mutex::new(peers)),
            blockchain,
            blockchain_store,
            peer_reputation: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Broadcast a new block to all peers
    pub fn broadcast_block(&self, block: &Block) {
        let message = P2PMessage::NewBlock(block.clone());
        let peers = self.peers.lock().unwrap().clone();

        for peer in peers {
            let msg = message.clone();
            thread::spawn(move || {
                if let Err(e) = Self::send_message(&peer, &msg) {
                    warn!(peer = %peer, error = %e, "Failed to broadcast block");
                } else {
                    info!(peer = %peer, "Broadcast block");
                }
            });
        }
    }

    /// Request the blockchain from all peers (async, spawns threads)
    pub fn request_chain_from_peers(&self) {
        let peers = self.peers.lock().unwrap().clone();
        let blockchain = Arc::clone(&self.blockchain);
        let reputation = Arc::clone(&self.peer_reputation);

        for peer in peers {
            let bc = Arc::clone(&blockchain);
            let rep = Arc::clone(&reputation);
            thread::spawn(move || {
                let message = P2PMessage::RequestChain;
                match Self::send_and_receive(&peer, &message) {
                    Ok(response) => {
                        if let P2PMessage::ResponseChain(chain) = response {
                            let mut bc = bc.lock().unwrap();
                            match bc.replace_chain(chain) {
                                Ok(true) => {
                                    info!(peer = %peer, "Successfully synced chain from peer");
                                    // Note: Chain replacement means we need to save the entire chain
                                    // This is a rare operation (only during sync/reorg)
                                    // For normal block addition, we use incremental saves
                                    // TODO: Optimize this to only save new blocks
                                    warn!("Chain replaced - full chain sync to RocksDB not yet implemented");
                                    // Good peer - increase reputation
                                    let mut r = rep.lock().unwrap();
                                    *r.entry(peer.clone()).or_insert(0) +=
                                        REPUTATION_REWARD_VALID_BLOCK;
                                }
                                Err(e) => {
                                    warn!(peer = %peer, error = %e, "Failed to replace chain");
                                }
                                _ => {}
                            }
                        }
                    }
                    Err(e) => {
                        warn!(peer = %peer, error = %e, "Failed to request chain");
                    }
                }
            });
        }
    }

    /// Start the P2P server to listen for incoming connections
    pub fn start_p2p_server(&self, port: u16) {
        let blockchain = Arc::clone(&self.blockchain);
        let blockchain_store = Arc::clone(&self.blockchain_store);
        let reputation = Arc::clone(&self.peer_reputation);

        thread::spawn(
            move || match TcpListener::bind(format!("0.0.0.0:{}", port)) {
                Ok(listener) => {
                    info!(port = port, "P2P server listening");

                    for stream in listener.incoming().flatten() {
                        let bc = Arc::clone(&blockchain);
                        let store = Arc::clone(&blockchain_store);
                        let rep = Arc::clone(&reputation);
                        let peer_addr = stream
                            .peer_addr()
                            .ok()
                            .map(|a| a.to_string())
                            .unwrap_or_default();

                        thread::spawn(move || {
                            if let Err(e) =
                                Self::handle_connection(stream, bc, store, rep, &peer_addr)
                            {
                                warn!(peer = %peer_addr, error = %e, "Connection handling failed");
                            }
                        });
                    }
                }
                Err(e) => {
                    error!(port = port, error = %e, "Failed to bind P2P server");
                }
            },
        );
    }

    /// Start a background sync task that runs continuously
    pub fn start_sync_task(self: Arc<Self>) {
        thread::spawn(move || loop {
            thread::sleep(Duration::from_secs(PEER_SYNC_DELAY_SECONDS));
            info!("Running periodic chain sync with peers");
            self.request_chain_from_peers();
        });
    }

    /// Handle incoming P2P connection
    fn handle_connection(
        mut stream: TcpStream,
        blockchain: Arc<Mutex<Blockchain>>,
        blockchain_store: Arc<BlockchainStore>,
        reputation: Arc<Mutex<HashMap<String, i32>>>,
        peer_addr: &str,
    ) -> Result<()> {
        // Note: We can't trigger sync from here as this is a static method
        // Chain divergence will be caught by periodic sync task
        let mut buffer = Vec::new();
        stream
            .read_to_end(&mut buffer)
            .map_err(GoudChainError::IoError)?;

        let message: P2PMessage = bincode::deserialize(&buffer)
            .map_err(|e| GoudChainError::DeserializationError(e.to_string()))?;

        match message {
            P2PMessage::NewBlock(block) => {
                let mut blockchain = blockchain.lock().unwrap();
                let latest = blockchain.get_latest_block()?;

                // Check if block already exists (idempotency)
                if blockchain.chain.iter().any(|b| b.hash == block.hash) {
                    info!(
                        block_index = block.index,
                        block_hash = %block.hash,
                        "Block already exists, skipping"
                    );
                    return Ok(());
                }

                // Validate block index is sequential
                if block.index != latest.index + 1 {
                    warn!(
                        peer = %peer_addr,
                        block_index = block.index,
                        expected_index = latest.index + 1,
                        "Rejected block: non-sequential index"
                    );
                    return Ok(()); // Don't penalize - might be a timing issue
                }

                // Validate previous_hash links to our latest block
                if block.previous_hash != latest.hash {
                    warn!(
                        peer = %peer_addr,
                        block_index = block.index,
                        block_previous_hash = %block.previous_hash,
                        our_latest_hash = %latest.hash,
                        "Rejected block: previous_hash mismatch - chain has diverged"
                    );
                    // Chain has diverged - periodic sync will resolve this
                    return Ok(());
                }

                // Validate block hash is correct
                let calculated_hash = block.calculate_hash();
                if block.hash != calculated_hash {
                    warn!(
                        peer = %peer_addr,
                        block_index = block.index,
                        claimed_hash = %block.hash,
                        calculated_hash = %calculated_hash,
                        "Rejected block: invalid hash"
                    );
                    // Bad peer - decrease reputation
                    let mut r = reputation.lock().unwrap();
                    *r.entry(peer_addr.to_string()).or_insert(0) +=
                        REPUTATION_PENALTY_INVALID_BLOCK;
                    return Ok(());
                }

                // Validate merkle root
                let calculated_merkle =
                    Block::calculate_merkle_root(&block.encrypted_block_data, &block.blind_indexes);
                if block.merkle_root != calculated_merkle {
                    warn!(
                        peer = %peer_addr,
                        block_index = block.index,
                        claimed_merkle = %block.merkle_root,
                        calculated_merkle = %calculated_merkle,
                        "Rejected block: invalid merkle root"
                    );
                    // Bad peer - decrease reputation
                    let mut r = reputation.lock().unwrap();
                    *r.entry(peer_addr.to_string()).or_insert(0) +=
                        REPUTATION_PENALTY_INVALID_BLOCK;
                    return Ok(());
                }

                // All validations passed - add block
                blockchain.chain.push(block.clone());

                // Save block to RocksDB (incremental write)
                if let Err(e) = blockchain_store.save_block(&block) {
                    error!(error = %e, "Failed to save received block to RocksDB");
                }

                // Save checkpoint if needed
                #[allow(unknown_lints)]
                #[allow(clippy::manual_is_multiple_of)]
                if block.index % CHECKPOINT_INTERVAL == 0 {
                    if let Err(e) = blockchain_store.save_checkpoint(block.index, &block.hash) {
                        error!(error = %e, "Failed to save checkpoint");
                    }
                }

                info!(
                    block_index = block.index,
                    block_hash = %block.hash,
                    peer = %peer_addr,
                    "Received and added valid block from network"
                );

                // Good peer
                let mut r = reputation.lock().unwrap();
                *r.entry(peer_addr.to_string()).or_insert(0) += REPUTATION_REWARD_VALID_BLOCK;
            }
            P2PMessage::NewAccount(account) => {
                let mut blockchain = blockchain.lock().unwrap();
                blockchain.add_account(account)?;
                info!("Received valid account");
            }
            P2PMessage::NewCollection(collection) => {
                let mut blockchain = blockchain.lock().unwrap();
                blockchain.add_collection(collection)?;
                info!("Received valid collection");
            }
            P2PMessage::RequestChain => {
                let blockchain = blockchain.lock().unwrap();
                let response = P2PMessage::ResponseChain(blockchain.chain.clone());
                Self::send_response(&mut stream, &response)?;
            }
            _ => {}
        }

        Ok(())
    }

    /// Send a message to a peer
    fn send_message(peer: &str, message: &P2PMessage) -> Result<()> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        let mut stream = TcpStream::connect(peer)
            .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        Ok(())
    }

    /// Send a message and receive a response
    fn send_and_receive(peer: &str, message: &P2PMessage) -> Result<P2PMessage> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        let mut stream = TcpStream::connect(peer)
            .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        let mut buffer = Vec::new();
        stream
            .read_to_end(&mut buffer)
            .map_err(GoudChainError::IoError)?;

        bincode::deserialize(&buffer)
            .map_err(|e| GoudChainError::DeserializationError(e.to_string()))
    }

    /// Send a response message through an existing stream
    fn send_response(stream: &mut TcpStream, message: &P2PMessage) -> Result<()> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        Ok(())
    }
}

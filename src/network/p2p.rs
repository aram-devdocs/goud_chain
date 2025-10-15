use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream, ToSocketAddrs};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tracing::{error, info, warn};

use crate::constants::{
    CHECKPOINT_INTERVAL, MAX_CONCURRENT_CONNECTIONS, MAX_MESSAGES_PER_MINUTE,
    MIN_REPUTATION_THRESHOLD, P2P_CONNECT_TIMEOUT_SECONDS, P2P_READ_TIMEOUT_SECONDS,
    P2P_WRITE_TIMEOUT_SECONDS, PEER_SYNC_DELAY_SECONDS, REPUTATION_PENALTY_INVALID_BLOCK,
    REPUTATION_REWARD_VALID_BLOCK,
};
use crate::domain::{Block, Blockchain};
use crate::network::messages::P2PMessage;
use crate::storage::BlockchainStore;
use crate::types::{GoudChainError, Result};

/// Connection guard - automatically decrements active connection count on drop
/// Ensures connections are always released, even on errors or panics
struct ConnectionGuard {
    active_connections: Arc<Mutex<usize>>,
}

impl ConnectionGuard {
    fn new(active_connections: Arc<Mutex<usize>>) -> Option<Self> {
        {
            let mut count = active_connections.lock().unwrap();
            if *count >= MAX_CONCURRENT_CONNECTIONS {
                return None; // Connection limit reached
            }
            *count += 1;
        } // Release lock before moving active_connections
        Some(Self { active_connections })
    }
}

impl Drop for ConnectionGuard {
    fn drop(&mut self) {
        let mut count = self.active_connections.lock().unwrap();
        if *count > 0 {
            *count -= 1;
        }
    }
}

/// Rate limiting tracker for a single peer
#[derive(Debug, Clone)]
pub struct RateLimitTracker {
    message_count: u32,
    window_start: u64, // Unix timestamp in seconds
}

impl RateLimitTracker {
    fn new() -> Self {
        Self {
            message_count: 0,
            window_start: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    fn check_and_increment(&mut self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Reset window if 60 seconds have passed
        if now - self.window_start >= 60 {
            self.message_count = 0;
            self.window_start = now;
        }

        // Check if under limit
        if self.message_count < MAX_MESSAGES_PER_MINUTE {
            self.message_count += 1;
            true
        } else {
            false
        }
    }
}

pub struct P2PNode {
    pub peers: Arc<Mutex<Vec<String>>>,
    pub blockchain: Arc<Mutex<Blockchain>>,
    pub blockchain_store: Arc<BlockchainStore>,
    pub peer_reputation: Arc<Mutex<HashMap<String, i32>>>,
    pub rate_limiters: Arc<Mutex<HashMap<String, RateLimitTracker>>>,
    pub blacklist: Arc<Mutex<Vec<String>>>, // Permanently banned peer addresses
    pub active_connections: Arc<Mutex<usize>>,
    last_chain_length: Arc<Mutex<usize>>, // Track chain length to detect if sync is needed
    last_successful_sync: Arc<Mutex<u64>>, // Unix timestamp of last successful sync
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

        let initial_chain_length = blockchain.lock().unwrap().chain.len();

        P2PNode {
            peers: Arc::new(Mutex::new(peers)),
            blockchain,
            blockchain_store,
            peer_reputation: Arc::new(Mutex::new(HashMap::new())),
            rate_limiters: Arc::new(Mutex::new(HashMap::new())),
            blacklist: Arc::new(Mutex::new(Vec::new())),
            active_connections: Arc::new(Mutex::new(0)),
            last_chain_length: Arc::new(Mutex::new(initial_chain_length)),
            last_successful_sync: Arc::new(Mutex::new(0)),
        }
    }

    /// Broadcast a new block to all peers
    pub fn broadcast_block(&self, block: &Block) {
        let message = P2PMessage::NewBlock(block.clone());
        let peers = self.peers.lock().unwrap().clone();
        let active_connections = Arc::clone(&self.active_connections);

        for peer in peers {
            let msg = message.clone();
            let active = Arc::clone(&active_connections);

            thread::spawn(move || {
                // Acquire connection guard for outbound connection
                let _guard = match ConnectionGuard::new(Arc::clone(&active)) {
                    Some(guard) => guard,
                    None => {
                        warn!(peer = %peer, "Skipped broadcast: max concurrent connections reached");
                        return;
                    }
                };

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
        let active_connections = Arc::clone(&self.active_connections);

        for peer in peers {
            let bc = Arc::clone(&blockchain);
            let rep = Arc::clone(&reputation);
            let active = Arc::clone(&active_connections);

            thread::spawn(move || {
                // Acquire connection guard for outbound connection
                let _guard = match ConnectionGuard::new(Arc::clone(&active)) {
                    Some(guard) => guard,
                    None => {
                        warn!(peer = %peer, "Skipped sync: max concurrent connections reached");
                        return;
                    }
                };

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
        let rate_limiters = Arc::clone(&self.rate_limiters);
        let blacklist = Arc::clone(&self.blacklist);
        let active_connections = Arc::clone(&self.active_connections);

        thread::spawn(
            move || match TcpListener::bind(format!("0.0.0.0:{}", port)) {
                Ok(listener) => {
                    info!(port = port, "P2P server listening");

                    for stream in listener.incoming().flatten() {
                        let bc = Arc::clone(&blockchain);
                        let store = Arc::clone(&blockchain_store);
                        let rep = Arc::clone(&reputation);
                        let limiters = Arc::clone(&rate_limiters);
                        let bl = Arc::clone(&blacklist);
                        let active = Arc::clone(&active_connections);

                        let peer_addr = stream
                            .peer_addr()
                            .ok()
                            .map(|a| a.to_string())
                            .unwrap_or_default();

                        thread::spawn(move || {
                            // Check blacklist BEFORE acquiring connection guard
                            if bl.lock().unwrap().contains(&peer_addr) {
                                warn!(peer = %peer_addr, "Rejected blacklisted peer");
                                return;
                            }

                            // Acquire connection guard (automatically releases on drop)
                            let _guard = match ConnectionGuard::new(Arc::clone(&active)) {
                                Some(guard) => guard,
                                None => {
                                    warn!(peer = %peer_addr, "Rejected: max concurrent connections reached");
                                    return;
                                }
                            };

                            // Handle connection (guard ensures cleanup on all exit paths)
                            if let Err(e) = Self::handle_connection(
                                stream, bc, store, rep, limiters, &peer_addr,
                            ) {
                                warn!(peer = %peer_addr, error = %e, "Connection handling failed");
                            }
                            // _guard dropped here, automatically decrements counter
                        });
                    }
                }
                Err(e) => {
                    error!(port = port, error = %e, "Failed to bind P2P server");
                }
            },
        );
    }

    /// Start a background sync task with smart sync logic
    /// Only syncs when chain length changes or after exponential backoff
    pub fn start_sync_task(self: Arc<Self>) {
        thread::spawn(move || {
            let mut backoff_multiplier = 1;
            let base_delay = PEER_SYNC_DELAY_SECONDS;

            loop {
                thread::sleep(Duration::from_secs(base_delay * backoff_multiplier));

                // Check if chain has grown since last sync (indicates activity)
                let current_chain_length = self.blockchain.lock().unwrap().chain.len();
                let last_chain_length = *self.last_chain_length.lock().unwrap();

                // Check time since last successful sync
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                let last_sync = *self.last_successful_sync.lock().unwrap();
                let seconds_since_sync = now.saturating_sub(last_sync);

                // Smart sync decision:
                // 1. Chain grew → immediate sync (broadcast may have failed)
                // 2. No change for 30+ seconds → try sync anyway (could be behind)
                // 3. Otherwise → backoff (reduce sync frequency)
                let should_sync = current_chain_length != last_chain_length
                    || seconds_since_sync >= 30
                    || last_sync == 0; // First run

                if should_sync {
                    info!(
                        chain_length = current_chain_length,
                        seconds_since_sync = seconds_since_sync,
                        "Running chain sync with peers"
                    );
                    self.request_chain_from_peers();

                    // Reset backoff on activity
                    if current_chain_length != last_chain_length {
                        backoff_multiplier = 1;
                        *self.last_chain_length.lock().unwrap() = current_chain_length;
                        *self.last_successful_sync.lock().unwrap() = now;
                    } else {
                        // Exponential backoff (10s → 20s → 40s → max 60s)
                        backoff_multiplier = (backoff_multiplier * 2).min(6);
                    }
                } else {
                    // Exponential backoff when no activity (10s → 20s → 40s → max 60s)
                    backoff_multiplier = (backoff_multiplier * 2).min(6);
                }
            }
        });
    }

    /// Handle incoming P2P connection
    fn handle_connection(
        mut stream: TcpStream,
        blockchain: Arc<Mutex<Blockchain>>,
        blockchain_store: Arc<BlockchainStore>,
        reputation: Arc<Mutex<HashMap<String, i32>>>,
        rate_limiters: Arc<Mutex<HashMap<String, RateLimitTracker>>>,
        peer_addr: &str,
    ) -> Result<()> {
        // Check reputation threshold
        {
            let rep = reputation.lock().unwrap();
            let peer_rep = rep.get(peer_addr).unwrap_or(&0);
            if *peer_rep < MIN_REPUTATION_THRESHOLD {
                warn!(peer = %peer_addr, reputation = *peer_rep, "Rejected peer with low reputation");
                return Err(GoudChainError::Unauthorized(
                    "Peer reputation below threshold".to_string(),
                ));
            }
        }

        // Check rate limit
        {
            let mut limiters = rate_limiters.lock().unwrap();
            let tracker = limiters
                .entry(peer_addr.to_string())
                .or_insert_with(RateLimitTracker::new);
            if !tracker.check_and_increment() {
                warn!(peer = %peer_addr, "Rate limit exceeded");
                return Err(GoudChainError::Unauthorized(
                    "Rate limit exceeded".to_string(),
                ));
            }
        }

        // Note: We can't trigger sync from here as this is a static method
        // Chain divergence will be caught by periodic sync task

        // Read length-prefixed message: [4 bytes length][N bytes payload]
        let mut len_bytes = [0u8; 4];
        stream
            .read_exact(&mut len_bytes)
            .map_err(GoudChainError::IoError)?;
        let len = u32::from_be_bytes(len_bytes) as usize;

        let mut buffer = vec![0u8; len];
        stream
            .read_exact(&mut buffer)
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
            // Note: Individual account/collection sync removed in v8_envelope_encryption
            // All data is synced as complete blocks with encrypted envelopes
            // Nodes cannot extract individual accounts without API keys
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

        // Resolve peer address (handles both DNS names like "node1:9000" and IPs)
        let addrs: Vec<_> = peer
            .to_socket_addrs()
            .map_err(|e| {
                GoudChainError::PeerConnectionFailed(format!(
                    "Failed to resolve peer address {}: {}",
                    peer, e
                ))
            })?
            .collect();

        let first_addr = addrs.first().ok_or_else(|| {
            GoudChainError::PeerConnectionFailed(format!("No addresses found for peer {}", peer))
        })?;

        let mut stream = TcpStream::connect_timeout(
            first_addr,
            Duration::from_secs(P2P_CONNECT_TIMEOUT_SECONDS),
        )
        .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        // Set read/write timeouts to prevent hung connections
        stream
            .set_read_timeout(Some(Duration::from_secs(P2P_READ_TIMEOUT_SECONDS)))
            .map_err(GoudChainError::IoError)?;
        stream
            .set_write_timeout(Some(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS)))
            .map_err(GoudChainError::IoError)?;

        // Write length-prefixed message: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        stream
            .write_all(&len.to_be_bytes())
            .map_err(GoudChainError::IoError)?;
        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        Ok(())
    }

    /// Send a message and receive a response
    fn send_and_receive(peer: &str, message: &P2PMessage) -> Result<P2PMessage> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Resolve peer address (handles both DNS names like "node1:9000" and IPs)
        let addrs: Vec<_> = peer
            .to_socket_addrs()
            .map_err(|e| {
                GoudChainError::PeerConnectionFailed(format!(
                    "Failed to resolve peer address {}: {}",
                    peer, e
                ))
            })?
            .collect();

        let first_addr = addrs.first().ok_or_else(|| {
            GoudChainError::PeerConnectionFailed(format!("No addresses found for peer {}", peer))
        })?;

        let mut stream = TcpStream::connect_timeout(
            first_addr,
            Duration::from_secs(P2P_CONNECT_TIMEOUT_SECONDS),
        )
        .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        // Set read/write timeouts to prevent hung connections
        stream
            .set_read_timeout(Some(Duration::from_secs(P2P_READ_TIMEOUT_SECONDS)))
            .map_err(GoudChainError::IoError)?;
        stream
            .set_write_timeout(Some(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS)))
            .map_err(GoudChainError::IoError)?;

        // Write length-prefixed message: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        stream
            .write_all(&len.to_be_bytes())
            .map_err(GoudChainError::IoError)?;
        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        // Read length-prefixed response: [4 bytes length][N bytes payload]
        let mut len_bytes = [0u8; 4];
        stream
            .read_exact(&mut len_bytes)
            .map_err(GoudChainError::IoError)?;
        let len = u32::from_be_bytes(len_bytes) as usize;

        let mut buffer = vec![0u8; len];
        stream
            .read_exact(&mut buffer)
            .map_err(GoudChainError::IoError)?;

        bincode::deserialize(&buffer)
            .map_err(|e| GoudChainError::DeserializationError(e.to_string()))
    }

    /// Send a response message through an existing stream
    fn send_response(stream: &mut TcpStream, message: &P2PMessage) -> Result<()> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Write length-prefixed message: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        stream
            .write_all(&len.to_be_bytes())
            .map_err(GoudChainError::IoError)?;
        stream
            .write_all(&encoded)
            .map_err(GoudChainError::IoError)?;

        Ok(())
    }
}

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{Mutex, RwLock};
use tokio::time::{timeout, Duration};
use tracing::{error, info, warn};

use crate::constants::{
    CHECKPOINT_INTERVAL, MAX_MESSAGES_PER_MINUTE, MIN_REPUTATION_THRESHOLD,
    P2P_CONNECT_TIMEOUT_SECONDS, P2P_READ_TIMEOUT_SECONDS, P2P_WRITE_TIMEOUT_SECONDS,
    REPUTATION_PENALTY_INVALID_BLOCK, REPUTATION_REWARD_VALID_BLOCK,
};
use crate::domain::{Block, Blockchain};
use crate::network::messages::P2PMessage;
use crate::storage::BlockchainStore;
use crate::types::{GoudChainError, Result};

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
    pub blockchain: Arc<RwLock<Blockchain>>,
    pub blockchain_store: Arc<BlockchainStore>,
    pub peer_reputation: Arc<Mutex<HashMap<String, i32>>>,
    pub rate_limiters: Arc<Mutex<HashMap<String, RateLimitTracker>>>,
    pub blacklist: Arc<Mutex<Vec<String>>>, // Permanently banned peer addresses
}

impl P2PNode {
    /// Create a new P2P node with configured peers
    pub fn new(
        blockchain: Arc<RwLock<Blockchain>>,
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
            rate_limiters: Arc::new(Mutex::new(HashMap::new())),
            blacklist: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Broadcast a new block to all peers (async)
    pub async fn broadcast_block(&self, block: &Block) {
        let message = P2PMessage::NewBlock(block.clone());
        let peers = self.peers.lock().await.clone();
        let mut handles = vec![];

        for peer in peers {
            let msg = message.clone();
            let peer_clone = peer.clone();

            let handle = tokio::spawn(async move {
                match Self::send_message(&peer_clone, &msg).await {
                    Ok(_) => {
                        info!(peer = %peer_clone, "Broadcast block");
                    }
                    Err(e) => {
                        warn!(peer = %peer_clone, error = %e, "Failed to broadcast block");
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all broadcasts to complete (with timeout per task)
        for handle in handles {
            let _ = timeout(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS + 2), handle).await;
        }
    }

    /// Request the blockchain from all peers (manual sync only - no periodic calls)
    pub async fn request_chain_from_peers(&self) {
        let peers = self.peers.lock().await.clone();
        let mut handles = vec![];

        for peer in peers {
            let blockchain = Arc::clone(&self.blockchain);
            let reputation = Arc::clone(&self.peer_reputation);
            let peer_clone = peer.clone();

            let handle = tokio::spawn(async move {
                let message = P2PMessage::RequestChain;
                match Self::send_and_receive(&peer_clone, &message).await {
                    Ok(response) => {
                        if let P2PMessage::ResponseChain(chain) = response {
                            let mut bc = blockchain.write().await;
                            match bc.replace_chain(chain) {
                                Ok(true) => {
                                    info!(peer = %peer_clone, "Successfully synced chain from peer");
                                    // Note: Chain replacement means we need to save the entire chain
                                    // This is a rare operation (only during sync/reorg)
                                    // For normal block addition, we use incremental saves
                                    // TODO: Optimize this to only save new blocks
                                    warn!("Chain replaced - full chain sync to RocksDB not yet implemented");
                                    // Good peer - increase reputation
                                    let mut r = reputation.lock().await;
                                    *r.entry(peer_clone.clone()).or_insert(0) +=
                                        REPUTATION_REWARD_VALID_BLOCK;
                                }
                                Err(e) => {
                                    warn!(peer = %peer_clone, error = %e, "Failed to replace chain");
                                }
                                _ => {}
                            }
                        }
                    }
                    Err(e) => {
                        warn!(peer = %peer_clone, error = %e, "Failed to request chain");
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all sync attempts to complete
        for handle in handles {
            let _ = handle.await;
        }
    }

    /// Start the P2P server to listen for incoming connections (async)
    pub async fn start_p2p_server(self: Arc<Self>, port: u16) {
        let bind_addr = format!("0.0.0.0:{}", port);
        let listener = match TcpListener::bind(&bind_addr).await {
            Ok(listener) => {
                info!(port = port, "P2P server listening");
                listener
            }
            Err(e) => {
                error!(port = port, error = %e, "Failed to bind P2P server");
                return;
            }
        };

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    let peer_addr = addr.to_string();
                    let node = Arc::clone(&self);

                    tokio::spawn(async move {
                        // Check blacklist BEFORE processing
                        if node.blacklist.lock().await.contains(&peer_addr) {
                            warn!(peer = %peer_addr, "Rejected blacklisted peer");
                            return;
                        }

                        // Handle connection
                        if let Err(e) = node.handle_connection(stream, &peer_addr).await {
                            warn!(peer = %peer_addr, error = %e, "Connection handling failed");
                        }
                    });
                }
                Err(e) => {
                    error!(error = %e, "Failed to accept connection");
                }
            }
        }
    }

    /// Handle incoming P2P connection (async)
    async fn handle_connection(&self, mut stream: TcpStream, peer_addr: &str) -> Result<()> {
        // Check reputation threshold
        {
            let rep = self.peer_reputation.lock().await;
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
            let mut limiters = self.rate_limiters.lock().await;
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

        // Read length-prefixed message with timeout: [4 bytes length][N bytes payload]
        let mut len_bytes = [0u8; 4];
        timeout(
            Duration::from_secs(P2P_READ_TIMEOUT_SECONDS),
            stream.read_exact(&mut len_bytes),
        )
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Read timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        let len = u32::from_be_bytes(len_bytes) as usize;

        // Sanity check: reject messages larger than 100MB
        if len > 100_000_000 {
            return Err(GoudChainError::InvalidRequestBody(
                "Message too large".to_string(),
            ));
        }

        let mut buffer = vec![0u8; len];
        timeout(
            Duration::from_secs(P2P_READ_TIMEOUT_SECONDS),
            stream.read_exact(&mut buffer),
        )
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Read timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        let message: P2PMessage = bincode::deserialize(&buffer)
            .map_err(|e| GoudChainError::DeserializationError(e.to_string()))?;

        match message {
            P2PMessage::NewBlock(block) => {
                let mut blockchain = self.blockchain.write().await;
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
                    // Chain has diverged - manual sync needed
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
                    let mut r = self.peer_reputation.lock().await;
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
                    let mut r = self.peer_reputation.lock().await;
                    *r.entry(peer_addr.to_string()).or_insert(0) +=
                        REPUTATION_PENALTY_INVALID_BLOCK;
                    return Ok(());
                }

                // All validations passed - add block
                blockchain.chain.push(block.clone());

                // Save block to RocksDB (incremental write)
                if let Err(e) = self.blockchain_store.save_block(&block) {
                    error!(error = %e, "Failed to save received block to RocksDB");
                }

                // Save checkpoint if needed
                #[allow(unknown_lints)]
                #[allow(clippy::manual_is_multiple_of)]
                if block.index % CHECKPOINT_INTERVAL == 0 {
                    if let Err(e) = self
                        .blockchain_store
                        .save_checkpoint(block.index, &block.hash)
                    {
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
                let mut r = self.peer_reputation.lock().await;
                *r.entry(peer_addr.to_string()).or_insert(0) += REPUTATION_REWARD_VALID_BLOCK;
            }
            // Note: Individual account/collection sync removed in v8_envelope_encryption
            // All data is synced as complete blocks with encrypted envelopes
            // Nodes cannot extract individual accounts without API keys
            P2PMessage::RequestChain => {
                let blockchain = self.blockchain.read().await;
                let response = P2PMessage::ResponseChain(blockchain.chain.clone());
                Self::send_response(&mut stream, &response).await?;
            }
            _ => {}
        }

        Ok(())
    }

    /// Send a message to a peer (async)
    async fn send_message(peer: &str, message: &P2PMessage) -> Result<()> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Resolve peer address (handles both DNS names like "node1:9000" and IPs)
        let addrs: Vec<_> = tokio::net::lookup_host(peer)
            .await
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

        // Connect with timeout
        let mut stream = timeout(
            Duration::from_secs(P2P_CONNECT_TIMEOUT_SECONDS),
            TcpStream::connect(first_addr),
        )
        .await
        .map_err(|_| {
            GoudChainError::PeerConnectionFailed(format!("Connection timeout to {}", peer))
        })?
        .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        // Write length-prefixed message with timeout: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        timeout(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS), async {
            stream.write_all(&len.to_be_bytes()).await?;
            stream.write_all(&encoded).await?;
            Ok::<_, std::io::Error>(())
        })
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Write timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        Ok(())
    }

    /// Send a message and receive a response (async)
    async fn send_and_receive(peer: &str, message: &P2PMessage) -> Result<P2PMessage> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Resolve peer address (handles both DNS names like "node1:9000" and IPs)
        let addrs: Vec<_> = tokio::net::lookup_host(peer)
            .await
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

        // Connect with timeout
        let mut stream = timeout(
            Duration::from_secs(P2P_CONNECT_TIMEOUT_SECONDS),
            TcpStream::connect(first_addr),
        )
        .await
        .map_err(|_| {
            GoudChainError::PeerConnectionFailed(format!("Connection timeout to {}", peer))
        })?
        .map_err(|e| GoudChainError::PeerConnectionFailed(e.to_string()))?;

        // Write length-prefixed message with timeout: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        timeout(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS), async {
            stream.write_all(&len.to_be_bytes()).await?;
            stream.write_all(&encoded).await?;
            Ok::<_, std::io::Error>(())
        })
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Write timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        // Read length-prefixed response with timeout: [4 bytes length][N bytes payload]
        let mut len_bytes = [0u8; 4];
        timeout(
            Duration::from_secs(P2P_READ_TIMEOUT_SECONDS),
            stream.read_exact(&mut len_bytes),
        )
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Read timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        let len = u32::from_be_bytes(len_bytes) as usize;

        // Sanity check: reject messages larger than 100MB
        if len > 100_000_000 {
            return Err(GoudChainError::InvalidRequestBody(
                "Response too large".to_string(),
            ));
        }

        let mut buffer = vec![0u8; len];
        timeout(
            Duration::from_secs(P2P_READ_TIMEOUT_SECONDS),
            stream.read_exact(&mut buffer),
        )
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Read timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        bincode::deserialize(&buffer)
            .map_err(|e| GoudChainError::DeserializationError(e.to_string()))
    }

    /// Send a response message through an existing stream (async)
    async fn send_response(stream: &mut TcpStream, message: &P2PMessage) -> Result<()> {
        let encoded = bincode::serialize(message)
            .map_err(|e| GoudChainError::SerializationError(e.to_string()))?;

        // Write length-prefixed message with timeout: [4 bytes length][N bytes payload]
        let len = encoded.len() as u32;
        timeout(Duration::from_secs(P2P_WRITE_TIMEOUT_SECONDS), async {
            stream.write_all(&len.to_be_bytes()).await?;
            stream.write_all(&encoded).await?;
            Ok::<_, std::io::Error>(())
        })
        .await
        .map_err(|_| {
            GoudChainError::IoError(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Write timeout",
            ))
        })?
        .map_err(GoudChainError::IoError)?;

        Ok(())
    }
}

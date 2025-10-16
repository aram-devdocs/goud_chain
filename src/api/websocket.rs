use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, WebSocketUpgrade,
    },
    response::Response,
    Extension,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::config::Config;
use crate::crypto::decode_api_key;
use crate::types::Result;

// ========== EVENT TYPES ==========

/// Types of events that clients can subscribe to
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[allow(clippy::enum_variant_names)]
pub enum EventType {
    /// New block added to blockchain
    BlockchainUpdate,
    /// New collection created
    CollectionUpdate,
    /// Peer network changes
    PeerUpdate,
    /// System metrics updated
    MetricsUpdate,
    /// New audit log entry
    AuditLogUpdate,
}

// ========== MESSAGE TYPES ==========

/// Messages sent from client to server
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    /// Subscribe to an event type
    Subscribe { event: EventType },
    /// Unsubscribe from an event type
    Unsubscribe { event: EventType },
    /// Ping to keep connection alive
    Ping,
}

/// Messages sent from server to client
#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    /// Event notification
    Event {
        event: EventType,
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Pong response to ping
    Pong,
    /// Error message
    #[allow(dead_code)]
    Error { message: String },
    /// Subscription confirmed
    Subscribed { event: EventType },
    /// Unsubscription confirmed
    Unsubscribed { event: EventType },
}

// ========== CONNECTION STATE ==========

/// Represents a single WebSocket connection
struct Connection {
    /// Channel to send messages to this connection
    tx: mpsc::UnboundedSender<ServerMessage>,
    /// Set of event types this connection is subscribed to
    subscriptions: HashSet<EventType>,
    /// API key for authorization (optional, can be None for unauthenticated connections)
    _api_key: Option<Vec<u8>>,
}

// ========== WEBSOCKET BROADCASTER ==========

/// Central broadcaster service for WebSocket events
/// Thread-safe, shared across all handlers
pub struct WebSocketBroadcaster {
    /// Map of connection_id -> Connection
    connections: Arc<RwLock<HashMap<String, Connection>>>,
}

impl Default for WebSocketBroadcaster {
    fn default() -> Self {
        Self::new()
    }
}

impl WebSocketBroadcaster {
    /// Create a new WebSocket broadcaster
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a new connection
    async fn add_connection(
        &self,
        id: String,
        tx: mpsc::UnboundedSender<ServerMessage>,
        api_key: Option<Vec<u8>>,
    ) {
        let connection = Connection {
            tx,
            subscriptions: HashSet::new(),
            _api_key: api_key,
        };

        let mut connections = self.connections.write().await;
        connections.insert(id.clone(), connection);
        info!(connection_id = %id, "WebSocket connection registered");
    }

    /// Remove a connection
    async fn remove_connection(&self, id: &str) {
        let mut connections = self.connections.write().await;
        connections.remove(id);
        info!(connection_id = %id, "WebSocket connection removed");
    }

    /// Subscribe a connection to an event type
    async fn subscribe(&self, connection_id: &str, event: EventType) -> Result<()> {
        let mut connections = self.connections.write().await;

        if let Some(conn) = connections.get_mut(connection_id) {
            conn.subscriptions.insert(event);
            debug!(
                connection_id = %connection_id,
                event = ?event,
                "Subscribed to event"
            );
            Ok(())
        } else {
            Err(crate::types::GoudChainError::Internal(
                "Connection not found".to_string(),
            ))
        }
    }

    /// Unsubscribe a connection from an event type
    async fn unsubscribe(&self, connection_id: &str, event: EventType) -> Result<()> {
        let mut connections = self.connections.write().await;

        if let Some(conn) = connections.get_mut(connection_id) {
            conn.subscriptions.remove(&event);
            debug!(
                connection_id = %connection_id,
                event = ?event,
                "Unsubscribed from event"
            );
            Ok(())
        } else {
            Err(crate::types::GoudChainError::Internal(
                "Connection not found".to_string(),
            ))
        }
    }

    /// Broadcast an event to all subscribed connections
    async fn broadcast(&self, event: EventType, data: serde_json::Value) {
        let connections = self.connections.read().await;
        let mut failed_connections = Vec::new();

        for (id, conn) in connections.iter() {
            if conn.subscriptions.contains(&event) {
                let message = ServerMessage::Event {
                    event,
                    data: data.clone(),
                };

                if let Err(e) = conn.tx.send(message) {
                    error!(
                        connection_id = %id,
                        error = %e,
                        "Failed to send message to connection"
                    );
                    failed_connections.push(id.clone());
                }
            }
        }

        // Clean up failed connections
        drop(connections);
        if !failed_connections.is_empty() {
            let mut connections = self.connections.write().await;
            for id in failed_connections {
                connections.remove(&id);
                warn!(connection_id = %id, "Removed failed connection");
            }
        }
    }

    /// Broadcast a blockchain update event
    pub async fn broadcast_blockchain_update(&self, block_index: u64, block_hash: String) {
        let data = serde_json::json!({
            "block_index": block_index,
            "block_hash": block_hash,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        self.broadcast(EventType::BlockchainUpdate, data).await;
        debug!(block_index = %block_index, "Broadcasted blockchain update");
    }

    /// Broadcast a collection update event
    pub async fn broadcast_collection_update(&self, collection_id: String, block_index: u64) {
        let data = serde_json::json!({
            "collection_id": collection_id,
            "block_index": block_index,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        self.broadcast(EventType::CollectionUpdate, data).await;
        debug!(collection_id = %collection_id, "Broadcasted collection update");
    }

    /// Broadcast a peer network update event
    #[allow(dead_code)]
    pub async fn broadcast_peer_update(&self, peer_count: usize) {
        let data = serde_json::json!({
            "peer_count": peer_count,
            "timestamp": chrono::Utc::now().timestamp(),
        });

        self.broadcast(EventType::PeerUpdate, data).await;
        debug!(peer_count = %peer_count, "Broadcasted peer update");
    }

    /// Broadcast an audit log update event
    /// Called immediately when audit events are logged (before blockchain flush)
    /// Provides instant feedback to users while batching continues in background
    pub async fn broadcast_audit_log_update(
        &self,
        event_type: crate::types::AuditEventType,
        timestamp: i64,
        collection_id: Option<String>,
        metadata: serde_json::Value,
    ) {
        let data = serde_json::json!({
            "event_type": event_type.to_string(),
            "timestamp": timestamp,
            "collection_id": collection_id,
            "metadata": metadata,
            "confirmed": false, // Not yet committed to blockchain
        });

        self.broadcast(EventType::AuditLogUpdate, data).await;
        debug!(event_type = %event_type, "Broadcasted audit log update");
    }

    /// Get current connection count
    #[allow(dead_code)]
    pub async fn connection_count(&self) -> usize {
        self.connections.read().await.len()
    }
}

// ========== WEBSOCKET HANDLER ==========

/// Query parameters for WebSocket connection
#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    /// JWT session token or API key for authentication
    pub token: Option<String>,
}

/// Handle WebSocket upgrade request
pub async fn handle_websocket_upgrade(
    ws: WebSocketUpgrade,
    Query(params): Query<WebSocketQuery>,
    Extension(broadcaster): Extension<Arc<WebSocketBroadcaster>>,
    Extension(config): Extension<Arc<Config>>,
) -> Response {
    // Extract and validate API key from query parameter
    let api_key = if let Some(token) = params.token {
        // Try to decode as API key
        match decode_api_key(&token) {
            Ok(key) => Some(key),
            Err(_) => {
                // Could also try to decode as JWT session token here
                // For now, we'll just accept API keys
                warn!("Invalid token provided for WebSocket connection");
                None
            }
        }
    } else {
        None
    };

    // For now, allow unauthenticated connections but track API key if provided
    // In production, you might want to reject unauthenticated connections
    let connection_id = Uuid::new_v4().to_string();

    ws.on_upgrade(move |socket| handle_socket(socket, connection_id, api_key, broadcaster, config))
}

/// Handle an individual WebSocket connection
async fn handle_socket(
    socket: WebSocket,
    connection_id: String,
    api_key: Option<Vec<u8>>,
    broadcaster: Arc<WebSocketBroadcaster>,
    _config: Arc<Config>,
) {
    let (mut sender, mut receiver) = socket.split();

    // Create channel for sending messages to this connection
    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

    // Register connection
    broadcaster
        .add_connection(connection_id.clone(), tx, api_key)
        .await;

    // Spawn task to forward messages from channel to WebSocket
    let connection_id_clone = connection_id.clone();
    let mut send_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            let json = match serde_json::to_string(&message) {
                Ok(j) => j,
                Err(e) => {
                    error!(error = %e, "Failed to serialize message");
                    continue;
                }
            };

            if sender.send(Message::Text(json)).await.is_err() {
                error!(
                    connection_id = %connection_id_clone,
                    "Failed to send message, connection likely closed"
                );
                break;
            }
        }
    });

    // Handle incoming messages from client
    let broadcaster_clone = broadcaster.clone();
    let connection_id_clone = connection_id.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(message)) = receiver.next().await {
            match message {
                Message::Text(text) => {
                    // Parse client message
                    match serde_json::from_str::<ClientMessage>(&text) {
                        Ok(client_msg) => {
                            handle_client_message(
                                &connection_id_clone,
                                client_msg,
                                &broadcaster_clone,
                            )
                            .await;
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to parse client message: {}", text);
                        }
                    }
                }
                Message::Close(_) => {
                    debug!(connection_id = %connection_id_clone, "Client closed connection");
                    break;
                }
                Message::Ping(_) => {
                    // Axum handles pong automatically
                }
                _ => {
                    // Ignore other message types
                }
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = &mut send_task => {
            recv_task.abort();
        },
        _ = &mut recv_task => {
            send_task.abort();
        },
    }

    // Clean up connection
    broadcaster.remove_connection(&connection_id).await;
    info!(connection_id = %connection_id, "WebSocket connection closed");
}

/// Handle a client message (subscribe, unsubscribe, ping)
async fn handle_client_message(
    connection_id: &str,
    message: ClientMessage,
    broadcaster: &Arc<WebSocketBroadcaster>,
) {
    match message {
        ClientMessage::Subscribe { event } => {
            if let Err(e) = broadcaster.subscribe(connection_id, event).await {
                error!(error = %e, "Failed to subscribe");
            } else {
                // Send confirmation
                let connections = broadcaster.connections.read().await;
                if let Some(conn) = connections.get(connection_id) {
                    let _ = conn.tx.send(ServerMessage::Subscribed { event });
                }
            }
        }
        ClientMessage::Unsubscribe { event } => {
            if let Err(e) = broadcaster.unsubscribe(connection_id, event).await {
                error!(error = %e, "Failed to unsubscribe");
            } else {
                // Send confirmation
                let connections = broadcaster.connections.read().await;
                if let Some(conn) = connections.get(connection_id) {
                    let _ = conn.tx.send(ServerMessage::Unsubscribed { event });
                }
            }
        }
        ClientMessage::Ping => {
            // Send pong
            let connections = broadcaster.connections.read().await;
            if let Some(conn) = connections.get(connection_id) {
                let _ = conn.tx.send(ServerMessage::Pong);
            }
        }
    }
}

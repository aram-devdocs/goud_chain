use axum::{extract::Extension, response::IntoResponse, Json};
use std::sync::Arc;
use tokio::sync::RwLock;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::schemas::{ErrorResponse, HealthCheckResponse, MessageResponse, PeerInfoResponse};
use crate::domain::Blockchain;
use crate::network::P2PNode;
use crate::types::*;

use super::HEALTH_TAG;

/// Health and status routes
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(handle_health))
        .routes(routes!(handle_get_chain))
        .routes(routes!(handle_get_peers))
        .routes(routes!(handle_sync))
        .routes(routes!(handle_get_current_validator))
}

/// Health check endpoint
///
/// Returns the current health status of the blockchain node.
/// Used by load balancers and monitoring systems to verify node availability.
#[utoipa::path(
    get,
    path = "/health",
    tag = HEALTH_TAG,
    responses(
        (status = 200, description = "Node is healthy", body = HealthCheckResponse),
        (status = 503, description = "Node is unhealthy", body = ErrorResponse)
    )
)]
async fn handle_health(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<Json<HealthCheckResponse>> {
    let blockchain = blockchain.read().await;
    let peers = p2p.peers.lock().await;

    let health_response = HealthCheckResponse {
        status: "healthy".to_string(),
        node_id: blockchain.node_id.clone(),
        chain_length: blockchain.chain.len(),
        peer_count: peers.len(),
        latest_block: blockchain.chain.last().map(|b| b.index).unwrap_or(0),
    };

    Ok(Json(health_response))
}

/// Get blockchain
///
/// Returns the complete blockchain. Use with caution on large chains as this endpoint
/// returns the entire chain history.
#[utoipa::path(
    get,
    path = "/chain",
    tag = HEALTH_TAG,
    responses(
        (status = 200, description = "Blockchain retrieved successfully", body = serde_json::Value),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_chain(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<impl IntoResponse> {
    let chain = blockchain.read().await;
    Ok(Json((*chain).clone()).into_response())
}

/// Get connected peers
///
/// Returns information about all P2P peers currently connected to this node,
/// including their addresses and reputation scores.
#[utoipa::path(
    get,
    path = "/peers",
    tag = HEALTH_TAG,
    responses(
        (status = 200, description = "Peer list retrieved successfully", body = PeerInfoResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_peers(
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<Json<PeerInfoResponse>> {
    let peers = p2p.peers.lock().await.clone();
    let reputation = p2p.peer_reputation.lock().await.clone();

    let response = PeerInfoResponse {
        peers: peers.clone(),
        count: peers.len(),
        reputation,
    };

    Ok(Json(response))
}

/// Trigger blockchain sync
///
/// Initiates synchronization with peer nodes to ensure blockchain consistency.
/// This endpoint requests the full chain from all connected peers and updates
/// the local chain if a longer valid chain is found.
#[utoipa::path(
    get,
    path = "/sync",
    tag = HEALTH_TAG,
    responses(
        (status = 200, description = "Sync initiated successfully", body = MessageResponse),
        (status = 500, description = "Sync failed", body = ErrorResponse)
    )
)]
async fn handle_sync(Extension(p2p): Extension<Arc<P2PNode>>) -> Result<Json<MessageResponse>> {
    p2p.request_chain_from_peers().await;
    Ok(Json(MessageResponse {
        message: "Syncing with peers...".to_string(),
    }))
}

/// Get current validator
///
/// Returns information about the current validator responsible for creating the next block.
/// Used by load balancers to route write requests to the correct validator node.
#[utoipa::path(
    get,
    path = "/validator/current",
    tag = HEALTH_TAG,
    responses(
        (status = 200, description = "Current validator retrieved", body = serde_json::Value),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_current_validator(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<Json<serde_json::Value>> {
    use crate::domain::blockchain::{get_current_validator, is_authorized_validator};

    let chain = blockchain.read().await;
    let latest_block = chain.chain.last();
    let next_block_number = latest_block.map(|b| b.index + 1).unwrap_or(1);
    let expected_validator =
        get_current_validator(&chain.validator_config.validators, next_block_number);
    let is_this_node =
        is_authorized_validator(&chain.node_id, next_block_number, &chain.validator_config);

    let validator_address = chain
        .validator_config
        .get_validator_address(&expected_validator)
        .unwrap_or_else(|| "unknown".to_string());

    let response = serde_json::json!({
        "next_block_number": next_block_number,
        "expected_validator": expected_validator,
        "validator_address": validator_address,
        "is_this_node_validator": is_this_node,
        "current_node_id": chain.node_id,
    });

    Ok(Json(response))
}

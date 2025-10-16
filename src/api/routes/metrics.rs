use axum::{extract::Extension, http::StatusCode, Json};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::schemas::{ChainStatsResponse, ErrorResponse, NodeMetricsResponse};
use crate::domain::Blockchain;
use crate::network::P2PNode;
use crate::types::*;

use super::METRICS_TAG;

/// Metrics and statistics routes
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(handle_get_stats))
        .routes(routes!(handle_get_metrics))
        .routes(routes!(handle_get_prometheus_metrics))
}

/// Get blockchain statistics
///
/// Returns comprehensive statistics about the blockchain including block counts,
/// collection counts, account counts, and validator distribution.
#[utoipa::path(
    get,
    path = "/stats",
    tag = METRICS_TAG,
    responses(
        (status = 200, description = "Statistics retrieved successfully", body = ChainStatsResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_stats(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<Json<ChainStatsResponse>> {
    let chain = blockchain.read().await;

    let total_blocks = chain.chain.len() as u64;
    let mut total_collections = 0u64;
    let mut total_accounts = 0u64;
    let mut validator_distribution: HashMap<String, u64> = HashMap::new();

    for block in &chain.chain {
        total_collections += block.get_collection_count().unwrap_or(0) as u64;
        total_accounts += block.get_account_count().unwrap_or(0) as u64;

        *validator_distribution
            .entry(block.validator.clone())
            .or_insert(0) += 1;
    }

    let avg_block_time = if chain.chain.len() > 1 {
        let mut total_time = 0.0;
        for i in 1..chain.chain.len() {
            total_time += (chain.chain[i].timestamp - chain.chain[i - 1].timestamp) as f64;
        }
        total_time / (chain.chain.len() - 1) as f64
    } else {
        0.0
    };

    let stats = ChainStatsResponse {
        total_blocks,
        total_collections,
        total_accounts,
        avg_block_time_seconds: avg_block_time,
        validator_distribution,
    };

    Ok(Json(stats))
}

/// Get system metrics
///
/// Returns real-time system metrics including blockchain statistics, network health,
/// and performance data. JSON format suitable for dashboards and monitoring tools.
#[utoipa::path(
    get,
    path = "/metrics",
    tag = METRICS_TAG,
    responses(
        (status = 200, description = "Metrics retrieved successfully", body = NodeMetricsResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_metrics(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<Json<NodeMetricsResponse>> {
    use crate::crypto::global_key_cache;

    let chain = blockchain.read().await;
    let peers = p2p.peers.lock().await;

    let latest_block = chain.chain.last();

    let mut total_operations = 0u64;
    for block in &chain.chain {
        if let Ok(count) = block.get_account_count() {
            total_operations += count as u64;
        }
        if let Ok(count) = block.get_collection_count() {
            total_operations += count as u64;
        }
    }

    let cache = global_key_cache();
    let cache_stats = cache.stats();
    let cache_hit_rate = cache_stats.hit_rate();

    let metrics = NodeMetricsResponse {
        node_id: chain.node_id.clone(),
        chain_length: chain.chain.len() as u64,
        peer_count: peers.len(),
        latest_block_index: latest_block.map(|b| b.index).unwrap_or(0),
        latest_block_timestamp: latest_block.map(|b| b.timestamp).unwrap_or(0),
        status: "healthy".to_string(),
        total_operations,
        cache_hit_rate,
        operations_per_second: 0.0,
    };

    Ok(Json(metrics))
}

/// Get Prometheus metrics
///
/// Returns metrics in Prometheus text format for monitoring and alerting.
/// Includes blockchain metrics, network metrics, and key cache performance statistics.
#[utoipa::path(
    get,
    path = "/metrics/prometheus",
    tag = METRICS_TAG,
    responses(
        (status = 200, description = "Prometheus metrics in text format", content_type = "text/plain"),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_prometheus_metrics(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<(
    StatusCode,
    [(axum::http::HeaderName, &'static str); 1],
    String,
)> {
    use crate::crypto::global_key_cache;

    let chain = blockchain.read().await;
    let peers = p2p.peers.lock().await;
    let latest_block = chain.chain.last();

    let node_metrics = format!(
        "# HELP goud_chain_length Total number of blocks in the chain\n\
         # TYPE goud_chain_length gauge\n\
         goud_chain_length {}\n\
         # HELP goud_peer_count Number of connected P2P peers\n\
         # TYPE goud_peer_count gauge\n\
         goud_peer_count {}\n\
         # HELP goud_latest_block_index Index of the latest block\n\
         # TYPE goud_latest_block_index gauge\n\
         goud_latest_block_index {}\n\
         # HELP goud_latest_block_timestamp Timestamp of the latest block\n\
         # TYPE goud_latest_block_timestamp gauge\n\
         goud_latest_block_timestamp {}\n",
        chain.chain.len(),
        peers.len(),
        latest_block.map(|b| b.index).unwrap_or(0),
        latest_block.map(|b| b.timestamp).unwrap_or(0)
    );

    let cache_metrics = global_key_cache().prometheus_metrics();
    let all_metrics = format!("{}\n{}", node_metrics, cache_metrics);

    Ok((
        StatusCode::OK,
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4",
        )],
        all_metrics,
    ))
}

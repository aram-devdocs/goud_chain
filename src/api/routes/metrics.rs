use axum::{extract::Extension, http::StatusCode, Json};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::schemas::{ChainStatsResponse, ErrorResponse, NodeMetricsResponse, VolumeMetrics};
use crate::constants::DATA_DIRECTORY;
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

/// Collect volume metrics from filesystem
fn collect_volume_metrics() -> Option<VolumeMetrics> {
    let data_path = Path::new(DATA_DIRECTORY);

    // Check if data directory exists
    if !data_path.exists() {
        return None;
    }

    // Calculate disk usage
    let disk_used_bytes = calculate_directory_size(data_path).unwrap_or(0);
    let disk_used_mb = disk_used_bytes / (1024 * 1024);

    // Check if RocksDB is present
    let rocksdb_path = data_path.join("rocksdb");
    let rocksdb_present = rocksdb_path.exists() && rocksdb_path.is_dir();

    // Count SST files if RocksDB exists
    let sst_file_count = if rocksdb_present {
        count_sst_files(&rocksdb_path)
    } else {
        None
    };

    Some(VolumeMetrics {
        disk_used_bytes,
        disk_used_mb,
        mount_path: DATA_DIRECTORY.to_string(),
        rocksdb_present,
        sst_file_count,
    })
}

/// Calculate total size of a directory recursively
fn calculate_directory_size(path: &Path) -> std::io::Result<u64> {
    let mut total_size = 0u64;

    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let metadata = entry.metadata()?;

            if metadata.is_file() {
                total_size += metadata.len();
            } else if metadata.is_dir() {
                total_size += calculate_directory_size(&entry.path())?;
            }
        }
    }

    Ok(total_size)
}

/// Count SST files in RocksDB directory (indicator of data volume)
fn count_sst_files(rocksdb_path: &Path) -> Option<u64> {
    let mut count = 0u64;

    fn count_recursive(path: &Path, count: &mut u64) -> std::io::Result<()> {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "sst" {
                        *count += 1;
                    }
                }
            } else if path.is_dir() {
                count_recursive(&path, count)?;
            }
        }
        Ok(())
    }

    count_recursive(rocksdb_path, &mut count).ok()?;
    Some(count)
}

/// Get system metrics
///
/// Returns real-time system metrics including blockchain statistics, network health,
/// performance data, and volume storage metrics. JSON format suitable for dashboards and monitoring tools.
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

    // Collect volume metrics
    let volume_metrics = collect_volume_metrics();

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
        volume_metrics,
    };

    Ok(Json(metrics))
}

/// Get Prometheus metrics
///
/// Returns metrics in Prometheus text format for monitoring and alerting.
/// Includes blockchain metrics, network metrics, key cache performance statistics, and volume metrics.
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

    // Collect volume metrics
    let volume_metrics = if let Some(vm) = collect_volume_metrics() {
        format!(
            "# HELP goud_volume_disk_used_bytes Disk space used by blockchain data in bytes\n\
             # TYPE goud_volume_disk_used_bytes gauge\n\
             goud_volume_disk_used_bytes {}\n\
             # HELP goud_volume_disk_used_mb Disk space used by blockchain data in megabytes\n\
             # TYPE goud_volume_disk_used_mb gauge\n\
             goud_volume_disk_used_mb {}\n\
             # HELP goud_volume_rocksdb_present Whether RocksDB database is present (1=present, 0=absent)\n\
             # TYPE goud_volume_rocksdb_present gauge\n\
             goud_volume_rocksdb_present {}\n\
             # HELP goud_volume_sst_files Number of RocksDB SST files\n\
             # TYPE goud_volume_sst_files gauge\n\
             goud_volume_sst_files {}\n",
            vm.disk_used_bytes,
            vm.disk_used_mb,
            if vm.rocksdb_present { 1 } else { 0 },
            vm.sst_file_count.unwrap_or(0)
        )
    } else {
        String::new()
    };

    let cache_metrics = global_key_cache().prometheus_metrics();
    let all_metrics = format!("{}\n{}\n{}", node_metrics, volume_metrics, cache_metrics);

    Ok((
        StatusCode::OK,
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4",
        )],
        all_metrics,
    ))
}

use std::sync::{Arc, Mutex};
use tiny_http::{Method, Request, Response};

use super::account_handlers::{handle_create_account, handle_login};
use super::data_handlers::{handle_decrypt_data, handle_list_data, handle_submit_data};
use super::middleware::{error_response, json_response};
use crate::domain::Blockchain;
use crate::network::P2PNode;
use crate::types::*;

/// Handle GET /chain - View full blockchain
pub fn handle_get_chain(blockchain: Arc<Mutex<Blockchain>>) -> Response<std::io::Cursor<Vec<u8>>> {
    let chain = blockchain.lock().unwrap();
    let json = serde_json::to_string_pretty(&*chain).unwrap();
    json_response(json)
}

/// Handle GET /peers - View peers
pub fn handle_get_peers(p2p: Arc<P2PNode>) -> Response<std::io::Cursor<Vec<u8>>> {
    let peers = p2p.peers.lock().unwrap().clone();
    let reputation = p2p.peer_reputation.lock().unwrap().clone();

    let response = PeerInfoResponse {
        peers: peers.clone(),
        count: peers.len(),
        reputation,
    };

    json_response(serde_json::to_string(&response).unwrap())
}

/// Handle GET /sync - Sync with peers
pub fn handle_sync(p2p: Arc<P2PNode>) -> Response<std::io::Cursor<Vec<u8>>> {
    p2p.request_chain_from_peers();
    let response = MessageResponse {
        message: "Syncing with peers...".to_string(),
    };
    json_response(serde_json::to_string(&response).unwrap())
}

/// Handle GET /health - Health check endpoint for load balancer
pub fn handle_health(
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let blockchain = blockchain.lock().unwrap();
    let peers = p2p.peers.lock().unwrap();

    let health_info = serde_json::json!({
        "status": "healthy",
        "node_id": blockchain.node_id,
        "chain_length": blockchain.chain.len(),
        "peer_count": peers.len(),
        "latest_block": blockchain.chain.last().map(|b| b.index).unwrap_or(0),
    });

    json_response(serde_json::to_string(&health_info).unwrap())
}

/// Handle GET /stats - Chain analytics and statistics
pub fn handle_get_stats(blockchain: Arc<Mutex<Blockchain>>) -> Response<std::io::Cursor<Vec<u8>>> {
    use crate::types::api::ChainStatsResponse;
    use std::collections::HashMap;

    let chain = blockchain.lock().unwrap();

    // Calculate statistics (requires decrypting blocks)
    let total_blocks = chain.chain.len() as u64;

    let mut total_collections = 0u64;
    let mut total_accounts = 0u64;
    let mut validator_distribution: HashMap<String, u64> = HashMap::new();

    for block in &chain.chain {
        // Get counts without decrypting envelopes (zero-knowledge)
        total_collections += block.get_collection_count().unwrap_or(0) as u64;
        total_accounts += block.get_account_count().unwrap_or(0) as u64;

        // Validator is plaintext field
        *validator_distribution
            .entry(block.validator.clone())
            .or_insert(0) += 1;
    }

    // Calculate average block time
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

    json_response(serde_json::to_string(&stats).unwrap())
}

/// Handle GET /metrics - Node performance metrics (JSON format)
pub fn handle_get_metrics(
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    use crate::crypto::global_key_cache;
    use crate::types::api::NodeMetricsResponse;

    let chain = blockchain.lock().unwrap();
    let peers = p2p.peers.lock().unwrap();

    let latest_block = chain.chain.last();

    // Calculate total operations (accounts + collections across all blocks)
    let mut total_operations = 0u64;
    for block in &chain.chain {
        if let Ok(count) = block.get_account_count() {
            total_operations += count as u64;
        }
        if let Ok(count) = block.get_collection_count() {
            total_operations += count as u64;
        }
    }

    // Get cache stats from global key cache
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
        operations_per_second: 0.0, // Placeholder - would need time-series tracking
    };

    json_response(serde_json::to_string(&metrics).unwrap())
}

/// Handle GET /metrics/prometheus - Prometheus-formatted metrics including key cache stats
pub fn handle_get_prometheus_metrics(
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    use crate::crypto::global_key_cache;

    let chain = blockchain.lock().unwrap();
    let peers = p2p.peers.lock().unwrap();
    let latest_block = chain.chain.last();

    // Node metrics
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

    // Key cache metrics
    let cache_metrics = global_key_cache().prometheus_metrics();

    // Combine all metrics
    let all_metrics = format!("{}\n{}", node_metrics, cache_metrics);

    // Return plain text response for Prometheus scraping
    Response::from_data(all_metrics.into_bytes()).with_header(
        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/plain; version=0.0.4"[..])
            .unwrap(),
    )
}

/// Handle GET /api/audit - Query audit logs for operational security
/// Returns paginated audit logs for authenticated user
/// Query params: start_ts, end_ts, event_type, page, page_size
pub fn handle_get_audit_logs(
    request: &Request,
    audit_logger: Arc<crate::storage::AuditLogger>,
    config: Arc<crate::config::Config>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    use super::auth::{decrypt_api_key_from_jwt, extract_auth, AuthMethod};
    use crate::types::{AuditEventType, AuditLogFilter};

    // Extract authentication
    let auth = match extract_auth(request, &config) {
        Ok(a) => a,
        Err(e) => return error_response(e.to_json(), e.status_code()),
    };

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(key) => key,
                Err(e) => {
                    return error_response(
                        GoudChainError::Unauthorized(format!(
                            "Failed to decrypt API key from session token: {}",
                            e
                        ))
                        .to_json(),
                        403,
                    );
                }
            }
        }
    };

    // Parse query parameters
    let url_params = parse_query_params(request.url());
    let start_ts = url_params
        .get("start_ts")
        .and_then(|s| s.parse::<i64>().ok());
    let end_ts = url_params.get("end_ts").and_then(|s| s.parse::<i64>().ok());
    let event_type_str = url_params.get("event_type");
    let page = url_params
        .get("page")
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(0);
    let page_size = url_params
        .get("page_size")
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(50)
        .min(100); // Max 100 per page

    // Parse event type filter
    let event_type = event_type_str.and_then(|s| match s.as_str() {
        "AccountCreated" => Some(AuditEventType::AccountCreated),
        "DataSubmitted" => Some(AuditEventType::DataSubmitted),
        "DataDecrypted" => Some(AuditEventType::DataDecrypted),
        "DataListed" => Some(AuditEventType::DataListed),
        "AccountLogin" => Some(AuditEventType::AccountLogin),
        _ => None,
    });

    let filter = AuditLogFilter {
        event_type,
        start_ts,
        end_ts,
        include_invalidated: false,
    };

    // Query audit logs
    match audit_logger.query_logs(&api_key, filter, page, page_size) {
        Ok(response) => json_response(serde_json::to_string(&response).unwrap()),
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

/// Parse URL query parameters into HashMap
fn parse_query_params(url: &str) -> std::collections::HashMap<String, String> {
    url.split('?')
        .nth(1)
        .map(|query| {
            query
                .split('&')
                .filter_map(|pair| {
                    let mut parts = pair.split('=');
                    match (parts.next(), parts.next()) {
                        (Some(k), Some(v)) => Some((k.to_string(), v.to_string())),
                        _ => None,
                    }
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Handle GET /validator/current - Get current validator for next block
/// Used by load balancer to route write requests to the correct node
pub fn handle_get_current_validator(
    blockchain: Arc<Mutex<Blockchain>>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    use crate::domain::blockchain::{get_current_validator, is_authorized_validator};

    let chain = blockchain.lock().unwrap();
    let latest_block = chain.chain.last();
    let next_block_number = latest_block.map(|b| b.index + 1).unwrap_or(1);
    let expected_validator = get_current_validator(next_block_number);
    let is_this_node = is_authorized_validator(&chain.node_id, next_block_number);

    // Map validator to node name for routing
    let validator_node = match expected_validator.as_str() {
        "Validator_1" => "node1",
        "Validator_2" => "node2",
        "Validator_3" => "node3",
        _ => "unknown",
    };

    let response = serde_json::json!({
        "next_block_number": next_block_number,
        "expected_validator": expected_validator,
        "validator_node": validator_node,
        "is_this_node_validator": is_this_node,
        "current_node_id": chain.node_id,
    });

    json_response(serde_json::to_string(&response).unwrap())
}

/// Route and handle HTTP requests
pub fn route_request(
    request: Request,
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
    config: Arc<crate::config::Config>,
    rate_limiter: Arc<crate::api::RateLimiter>,
    audit_logger: Arc<crate::storage::AuditLogger>,
) {
    let method = request.method().clone();
    let url = request.url().to_string();

    // Extract path from URL (strip query parameters for matching)
    let path = url.split('?').next().unwrap_or(&url);

    match (method, path) {
        // ========== Account Management ==========
        (Method::Post, "/account/create") => {
            handle_create_account(
                request,
                blockchain,
                p2p,
                Arc::clone(&rate_limiter),
                Arc::clone(&audit_logger),
            );
        }
        (Method::Post, "/account/login") => {
            handle_login(
                request,
                blockchain,
                Arc::clone(&config),
                Arc::clone(&audit_logger),
            );
        }

        // ========== Data Operations ==========
        (Method::Post, "/data/submit") => {
            handle_submit_data(
                request,
                blockchain,
                p2p,
                Arc::clone(&config),
                Arc::clone(&rate_limiter),
                Arc::clone(&audit_logger),
            );
        }
        (Method::Get, "/data/list") => {
            let response = handle_list_data(
                &request,
                blockchain,
                Arc::clone(&config),
                Arc::clone(&rate_limiter),
                Arc::clone(&audit_logger),
            );
            let _ = request.respond(response);
        }

        // ========== Decryption (with path param) ==========
        (Method::Post, url) if url.starts_with("/data/decrypt/") => {
            let collection_id = url.trim_start_matches("/data/decrypt/");
            let response = handle_decrypt_data(
                &request,
                blockchain,
                collection_id,
                Arc::clone(&config),
                Arc::clone(&rate_limiter),
                Arc::clone(&audit_logger),
            );
            let _ = request.respond(response);
        }

        // ========== Blockchain Explorer ==========
        (Method::Get, "/chain") => {
            let _ = request.respond(handle_get_chain(blockchain));
        }
        (Method::Get, "/peers") => {
            let _ = request.respond(handle_get_peers(p2p));
        }
        (Method::Get, "/sync") => {
            let _ = request.respond(handle_sync(p2p));
        }
        (Method::Get, "/health") => {
            let _ = request.respond(handle_health(blockchain, p2p));
        }

        // ========== Analytics & Metrics ==========
        (Method::Get, "/stats") => {
            let _ = request.respond(handle_get_stats(blockchain));
        }
        (Method::Get, "/metrics") => {
            let _ = request.respond(handle_get_metrics(blockchain, Arc::clone(&p2p)));
        }
        (Method::Get, "/metrics/prometheus") => {
            let _ = request.respond(handle_get_prometheus_metrics(blockchain, p2p));
        }

        // ========== Audit Logging ==========
        (Method::Get, "/api/audit") => {
            let response =
                handle_get_audit_logs(&request, Arc::clone(&audit_logger), Arc::clone(&config));
            let _ = request.respond(response);
        }

        // ========== Validator Info (for load balancer routing) ==========
        (Method::Get, "/validator/current") => {
            let _ = request.respond(handle_get_current_validator(blockchain));
        }

        _ => {
            let _ = request.respond(error_response(
                ErrorResponse::new("Not found").to_json(),
                404,
            ));
        }
    }
}

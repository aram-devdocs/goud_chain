use axum::{
    extract::{Extension, Path, Query},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response as AxumResponse},
    Json,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

use crate::config::Config;
use crate::constants::{CHECKPOINT_INTERVAL, SESSION_EXPIRY_SECONDS};
use crate::crypto::{encode_api_key, generate_api_key, generate_signing_key, hash_api_key_hex};
use crate::domain::blockchain::{get_current_validator, is_authorized_validator};
use crate::domain::{Blockchain, EncryptedCollection, UserAccount};
use crate::network::P2PNode;
use crate::storage::AuditLogger;
use crate::types::*;

use super::auth::{
    decrypt_api_key_from_jwt, extract_auth_from_headers, generate_session_token, AuthMethod,
};
use super::internal_client::{
    forward_request_to_node, forward_request_with_headers, get_validator_node_address,
};
use super::{RateLimitResult, RateLimiter};

// ========== HELPER TYPES ==========

/// Error response wrapper for axum
#[derive(serde::Serialize)]
struct ApiError {
    error: String,
}

impl IntoResponse for GoudChainError {
    fn into_response(self) -> AxumResponse {
        let status =
            StatusCode::from_u16(self.status_code()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        let body = Json(ApiError {
            error: self.to_string(),
        });
        (status, body).into_response()
    }
}

/// Helper to add custom headers to response
fn add_rate_limit_headers(
    mut response: AxumResponse,
    headers: Vec<(String, String)>,
) -> AxumResponse {
    let response_headers = response.headers_mut();
    for (key, value) in headers {
        if let Ok(header_value) = value.parse() {
            response_headers.insert(
                axum::http::HeaderName::from_bytes(key.as_bytes()).unwrap(),
                header_value,
            );
        }
    }
    response
}

/// Extract client IP from headers (X-Real-IP or X-Forwarded-For)
fn extract_client_ip(headers: &HeaderMap) -> String {
    // Try X-Real-IP first (set by nginx)
    if let Some(ip) = headers.get("x-real-ip") {
        if let Ok(ip_str) = ip.to_str() {
            return ip_str.to_string();
        }
    }

    // Try X-Forwarded-For
    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded.to_str() {
            // X-Forwarded-For can contain multiple IPs, take the first one
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Fallback
    "unknown".to_string()
}

/// Extract auth header value for forwarding
fn extract_auth_header(headers: &HeaderMap) -> Option<String> {
    headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

/// Extract signature header value for forwarding
fn extract_signature_header(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-signature")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

// ========== SIMPLE GET HANDLERS ==========

/// Handle GET /chain - View full blockchain
pub async fn handle_get_chain(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<Json<Blockchain>> {
    let chain = blockchain.read().await;
    Ok(Json((*chain).clone()))
}

/// Handle GET /peers - View peers
pub async fn handle_get_peers(
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

/// Handle GET /sync - Sync with peers
pub async fn handle_sync(Extension(p2p): Extension<Arc<P2PNode>>) -> Result<Json<MessageResponse>> {
    p2p.request_chain_from_peers().await;
    Ok(Json(MessageResponse {
        message: "Syncing with peers...".to_string(),
    }))
}

/// Handle GET /health - Health check endpoint for load balancer
pub async fn handle_health(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<Json<serde_json::Value>> {
    let blockchain = blockchain.read().await;
    let peers = p2p.peers.lock().await;

    let health_info = serde_json::json!({
        "status": "healthy",
        "node_id": blockchain.node_id,
        "chain_length": blockchain.chain.len(),
        "peer_count": peers.len(),
        "latest_block": blockchain.chain.last().map(|b| b.index).unwrap_or(0),
    });

    Ok(Json(health_info))
}

/// Handle GET /stats - Chain analytics and statistics
pub async fn handle_get_stats(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<Json<ChainStatsResponse>> {
    let chain = blockchain.read().await;

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

    Ok(Json(stats))
}

/// Handle GET /metrics - Node performance metrics (JSON format)
pub async fn handle_get_metrics(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<Json<NodeMetricsResponse>> {
    use crate::crypto::global_key_cache;

    let chain = blockchain.read().await;
    let peers = p2p.peers.lock().await;

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

    Ok(Json(metrics))
}

/// Handle GET /metrics/prometheus - Prometheus-formatted metrics including key cache stats
pub async fn handle_get_prometheus_metrics(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
) -> Result<AxumResponse> {
    use crate::crypto::global_key_cache;

    let chain = blockchain.read().await;
    let peers = p2p.peers.lock().await;
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
    Ok((
        StatusCode::OK,
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4",
        )],
        all_metrics,
    )
        .into_response())
}

/// Handle GET /validator/current - Get current validator for next block
/// Used by load balancer to route write requests to the correct node
pub async fn handle_get_current_validator(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
) -> Result<Json<serde_json::Value>> {
    let chain = blockchain.read().await;
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

    Ok(Json(response))
}

// ========== ACCOUNT HANDLERS ==========

/// Handle POST /account/create - Create a new user account
pub async fn handle_create_account(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    headers: HeaderMap,
    Json(request): Json<CreateAccountRequest>,
) -> Result<AxumResponse> {
    // Extract client IP for rate limiting (no API key yet for new accounts)
    let client_ip = extract_client_ip(&headers);

    // Use IP hash as the rate limit key for account creation
    let ip_hash = hash_api_key_hex(client_ip.as_bytes());

    // Check rate limit (write operation - account creation)
    let rate_limit_result = match rate_limiter.check_limit(&ip_hash, &client_ip, true) {
        Ok(result) => result,
        Err(e) => {
            // Rate limiter error - fail open (allow request but log error)
            error!(error = %e, "Rate limit check failed, allowing account creation");
            RateLimitResult::Allowed {
                limit: 10,
                remaining: 10,
                reset_at: chrono::Utc::now().timestamp() + 60,
            }
        }
    };

    // Handle rate limit result
    match &rate_limit_result {
        RateLimitResult::Blocked {
            ban_level,
            retry_after,
            violation_count,
        } => {
            warn!(
                client_ip = %client_ip,
                ban_level = ?ban_level,
                violation_count = violation_count,
                "Account creation blocked by rate limiter"
            );
            let error = GoudChainError::RateLimitExceeded {
                retry_after: *retry_after,
                violation_count: *violation_count,
            };
            let rate_headers = rate_limiter.create_headers(&rate_limit_result);
            let response = error.into_response();
            return Ok(add_rate_limit_headers(response, rate_headers));
        }
        RateLimitResult::Warning {
            violation_count, ..
        } => {
            warn!(
                client_ip = %client_ip,
                violation_count = violation_count,
                "Rate limit warning on account creation"
            );
        }
        RateLimitResult::Allowed { remaining, .. } => {
            info!(
                client_ip = %client_ip,
                remaining = remaining,
                "Account creation rate limit check passed"
            );
        }
    }

    // Check if this node is the authorized validator for the next block
    let blockchain_guard = blockchain.read().await;
    let next_block_number = blockchain_guard
        .chain
        .last()
        .map(|b| b.index + 1)
        .unwrap_or(1);
    let is_validator = is_authorized_validator(&blockchain_guard.node_id, next_block_number);
    let node_id = blockchain_guard.node_id.clone();
    drop(blockchain_guard);

    if !is_validator {
        // This node is NOT the validator - forward request to the correct validator
        let expected_validator = get_current_validator(next_block_number);
        warn!(
            current_node = %node_id,
            expected_validator = %expected_validator,
            next_block = next_block_number,
            "Forwarding account creation to validator node"
        );

        match get_validator_node_address(&expected_validator) {
            Ok(validator_addr) => {
                let body = serde_json::to_string(&request).map_err(|e| {
                    GoudChainError::Internal(format!("Serialization failed: {}", e))
                })?;

                match forward_request_to_node(
                    &validator_addr,
                    "POST",
                    "/account/create",
                    &body,
                    "application/json",
                )
                .await
                {
                    Ok((status_code, response_body)) => {
                        info!(
                            validator = %expected_validator,
                            status = status_code,
                            "Forwarded request successfully"
                        );
                        return Ok((
                            StatusCode::from_u16(status_code).unwrap_or(StatusCode::OK),
                            [(axum::http::header::CONTENT_TYPE, "application/json")],
                            response_body,
                        )
                            .into_response());
                    }
                    Err(e) => {
                        error!(error = %e, "Failed to forward request to validator");
                        return Err(GoudChainError::Internal(format!(
                            "Failed to forward to validator: {}",
                            e
                        )));
                    }
                }
            }
            Err(e) => {
                error!(error = %e, "Failed to get validator address");
                return Err(e);
            }
        }
    }

    // This node IS the validator - proceed with block creation
    let api_key = generate_api_key();
    let signing_key = generate_signing_key();

    // Create user account
    match UserAccount::new(&api_key, &signing_key, request.metadata) {
        Ok(account) => {
            let account_id = account.account_id.clone();

            // Add account to blockchain WITH API key for envelope creation
            let mut blockchain_guard = blockchain.write().await;
            match blockchain_guard.add_account_with_key(account, api_key.clone()) {
                Ok(_) => {
                    // Create block
                    match blockchain_guard.add_block() {
                        Ok(block) => {
                            // Save block to RocksDB (incremental write)
                            if let Err(e) = p2p.blockchain_store.save_block(&block) {
                                error!(error = %e, "Failed to save block to RocksDB");
                            }

                            // Save checkpoint if needed
                            #[allow(unknown_lints)]
                            #[allow(clippy::manual_is_multiple_of)]
                            if block.index % CHECKPOINT_INTERVAL == 0 {
                                if let Err(e) = p2p
                                    .blockchain_store
                                    .save_checkpoint(block.index, &block.hash)
                                {
                                    error!(error = %e, "Failed to save checkpoint");
                                }
                            }

                            let block_index = block.index;
                            drop(blockchain_guard);

                            let response = CreateAccountResponse {
                                account_id: account_id.clone(),
                                api_key: encode_api_key(&api_key),
                                warning: "SAVE THIS API KEY SECURELY. It cannot be recovered and provides full access to your data.".to_string(),
                            };

                            // Audit log: Account created (batched and flushed every 10s)
                            if let Err(e) = audit_logger.log(
                                &api_key,
                                AuditEventType::AccountCreated,
                                None,
                                &client_ip,
                                serde_json::json!({"account_id": account_id, "block": block_index}),
                            ) {
                                error!(error = %e, "Failed to log account creation audit event");
                            }

                            info!("New account created");
                            // Add rate limit headers to success response
                            let rate_headers = rate_limiter.create_headers(&rate_limit_result);
                            let response_obj = Json(response).into_response();

                            // Broadcast block in background (don't block response)
                            let p2p_clone = Arc::clone(&p2p);
                            let block_clone = block.clone();
                            tokio::spawn(async move {
                                p2p_clone.broadcast_block(&block_clone).await;
                            });

                            Ok(add_rate_limit_headers(response_obj, rate_headers))
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to create block");
                            Err(e)
                        }
                    }
                }
                Err(e) => {
                    error!(error = %e, "Failed to add account");
                    Err(e)
                }
            }
        }
        Err(e) => {
            error!(error = %e, "Failed to create account");
            Err(e)
        }
    }
}

/// Handle POST /account/login - Login with API key and get session token
pub async fn handle_login(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    headers: HeaderMap,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Decode API key
    match crate::crypto::decode_api_key(&request.api_key) {
        Ok(api_key) => {
            // Hash API key ONCE (expensive: 100k iterations)
            let api_key_hash_hex = hash_api_key_hex(&api_key);

            // Find account (requires API key to decrypt envelope)
            // Pass pre-computed hash to avoid re-hashing
            let blockchain_guard = blockchain.read().await;
            match blockchain_guard.find_account_with_hash(&api_key, Some(api_key_hash_hex.clone()))
            {
                Some(account) => {
                    // Verify API key hash matches (constant-time comparison)
                    // Use pre-computed hash to avoid re-hashing (saves 100k iterations!)
                    match crate::api::auth::verify_api_key_hash_precomputed(
                        Some(&api_key_hash_hex),
                        &api_key,
                        &account.api_key_hash,
                    ) {
                        Ok(_) => {
                            // Generate session token with encrypted API key
                            // Reuse the hash we already computed!
                            let api_key_hash = api_key_hash_hex;
                            match generate_session_token(
                                account.account_id.clone(),
                                &api_key,
                                api_key_hash,
                                &config,
                            ) {
                                Ok(token) => {
                                    let response = LoginResponse {
                                        session_token: token,
                                        expires_in: SESSION_EXPIRY_SECONDS,
                                        account_id: account.account_id.clone(),
                                    };

                                    // Drop blockchain lock before audit logging to avoid deadlock
                                    drop(blockchain_guard);

                                    // Audit log: Account login (batched and flushed every 10s)
                                    let client_ip = extract_client_ip(&headers);
                                    if let Err(e) = audit_logger.log(
                                        &api_key,
                                        AuditEventType::AccountLogin,
                                        None,
                                        &client_ip,
                                        serde_json::json!({"account_id": account.account_id}),
                                    ) {
                                        error!(error = %e, "Failed to log login audit event");
                                    }

                                    info!("User logged in");
                                    Ok(Json(response))
                                }
                                Err(e) => {
                                    error!(error = %e, "Failed to generate token");
                                    Err(e)
                                }
                            }
                        }
                        Err(e) => {
                            info!("Invalid API key attempt");
                            Err(e)
                        }
                    }
                }
                None => {
                    info!("Account not found");
                    Err(GoudChainError::Unauthorized(
                        "Account not found".to_string(),
                    ))
                }
            }
        }
        Err(_) => Err(GoudChainError::Unauthorized(
            "Invalid API key format".to_string(),
        )),
    }
}

// ========== DATA HANDLERS ==========

/// Handle POST /data/submit - Submit encrypted data (requires API key auth)
pub async fn handle_submit_data(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    headers: HeaderMap,
    Json(request): Json<SubmitDataRequest>,
) -> Result<AxumResponse> {
    // Extract Authorization header (needed for forwarding)
    let auth_header_value = extract_auth_header(&headers);

    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Get API key and hash based on auth method
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key_hex(&key);
            (key, hash)
        }
        AuthMethod::SessionToken(_) => {
            // For session token, we need direct API key for encryption
            return Err(GoudChainError::Unauthorized(
                "Direct API key required for data submission".to_string(),
            ));
        }
    };

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);

    // Check rate limit (write operation)
    let rate_limit_result = match rate_limiter.check_limit(&api_key_hash, &client_ip, true) {
        Ok(result) => result,
        Err(e) => {
            // Rate limiter error - fail open (allow request but log error)
            error!(error = %e, "Rate limit check failed, allowing request");
            RateLimitResult::Allowed {
                limit: 10,
                remaining: 10,
                reset_at: chrono::Utc::now().timestamp() + 60,
            }
        }
    };

    // Handle rate limit result
    match &rate_limit_result {
        RateLimitResult::Blocked {
            ban_level,
            retry_after,
            violation_count,
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                ban_level = ?ban_level,
                violation_count = violation_count,
                "Request blocked by rate limiter"
            );
            let error = GoudChainError::ApiKeyBanned {
                ban_level: format!("{:?}", ban_level),
                expires_at: chrono::Utc::now().timestamp() + *retry_after as i64,
            };
            let rate_headers = rate_limiter.create_headers(&rate_limit_result);
            let response = error.into_response();
            return Ok(add_rate_limit_headers(response, rate_headers));
        }
        RateLimitResult::Warning {
            violation_count,
            cooldown_secs,
            ..
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                violation_count = violation_count,
                cooldown_secs = cooldown_secs,
                "Rate limit warning issued"
            );
            // Continue processing but remember to add warning headers to response
        }
        RateLimitResult::Allowed { remaining, .. } => {
            info!(
                api_key_hash = %api_key_hash,
                remaining = remaining,
                "Rate limit check passed"
            );
        }
    }

    // Verify account exists (use cached hash to avoid re-hashing)
    let blockchain_guard = blockchain.read().await;
    if blockchain_guard
        .find_account_with_hash(&api_key, Some(api_key_hash.clone()))
        .is_none()
    {
        drop(blockchain_guard);
        return Err(GoudChainError::Unauthorized(
            "Account not found".to_string(),
        ));
    }
    drop(blockchain_guard);

    // Validate request size BEFORE encryption (DoS Protection)
    request.validate()?;

    // Check if this node is the authorized validator for the next block
    let blockchain_guard = blockchain.read().await;
    let next_block_number = blockchain_guard
        .chain
        .last()
        .map(|b| b.index + 1)
        .unwrap_or(1);
    let is_validator = is_authorized_validator(&blockchain_guard.node_id, next_block_number);
    let node_id = blockchain_guard.node_id.clone();
    drop(blockchain_guard);

    if !is_validator {
        // This node is NOT the validator - forward request to the correct validator
        let expected_validator = get_current_validator(next_block_number);
        warn!(
            current_node = %node_id,
            expected_validator = %expected_validator,
            next_block = next_block_number,
            "Forwarding data submission to validator node"
        );

        match get_validator_node_address(&expected_validator) {
            Ok(validator_addr) => {
                let body = serde_json::to_string(&request).map_err(|e| {
                    GoudChainError::Internal(format!("Serialization failed: {}", e))
                })?;

                // Extract X-Signature header to forward to validator
                let signature_header = extract_signature_header(&headers);

                match forward_request_with_headers(
                    &validator_addr,
                    "POST",
                    "/data/submit",
                    &body,
                    "application/json",
                    auth_header_value.as_deref(),
                    signature_header.as_deref(),
                )
                .await
                {
                    Ok((status_code, response_body)) => {
                        info!(
                            validator = %expected_validator,
                            status = status_code,
                            "Forwarded data submission successfully"
                        );
                        return Ok((
                            StatusCode::from_u16(status_code).unwrap_or(StatusCode::OK),
                            [(axum::http::header::CONTENT_TYPE, "application/json")],
                            response_body,
                        )
                            .into_response());
                    }
                    Err(e) => {
                        error!(error = %e, "Failed to forward data submission to validator");
                        return Err(GoudChainError::Internal(format!(
                            "Failed to forward to validator: {}",
                            e
                        )));
                    }
                }
            }
            Err(e) => {
                error!(error = %e, "Failed to get validator address");
                return Err(e);
            }
        }
    }

    // This node IS the validator - proceed with encryption and block creation
    // Get node signing key
    let signing_key = {
        let blockchain_guard = blockchain.read().await;
        blockchain_guard.node_signing_key.clone()
    };

    match signing_key {
        Some(key) => {
            // Create encrypted collection
            match EncryptedCollection::new(
                request.label.clone(),
                request.data,
                &api_key,
                api_key_hash.clone(),
                &key,
            ) {
                Ok(collection) => {
                    let collection_id = collection.collection_id.clone();

                    // Add to blockchain
                    let mut blockchain_guard = blockchain.write().await;
                    match blockchain_guard.add_collection(collection) {
                        Ok(_) => {
                            // Create block
                            match blockchain_guard.add_block() {
                                Ok(block) => {
                                    // Save block to RocksDB (incremental write)
                                    if let Err(e) = p2p.blockchain_store.save_block(&block) {
                                        error!(error = %e, "Failed to save block to RocksDB");
                                    }

                                    // Save checkpoint if needed
                                    #[allow(unknown_lints)]
                                    #[allow(clippy::manual_is_multiple_of)]
                                    if block.index % CHECKPOINT_INTERVAL == 0 {
                                        if let Err(e) = p2p
                                            .blockchain_store
                                            .save_checkpoint(block.index, &block.hash)
                                        {
                                            error!(error = %e, "Failed to save checkpoint");
                                        }
                                    }

                                    let block_index = block.index;
                                    drop(blockchain_guard);

                                    let response = SubmitDataResponse {
                                        message: "Data encrypted and stored successfully"
                                            .to_string(),
                                        collection_id: collection_id.clone(),
                                        block_number: block_index,
                                    };

                                    // Audit log: Data submitted (batched and flushed every 10s)
                                    if let Err(e) = audit_logger.log(
                                        &api_key,
                                        AuditEventType::DataSubmitted,
                                        Some(collection_id.clone()),
                                        &client_ip,
                                        serde_json::json!({"block": block_index, "label": request.label}),
                                    ) {
                                        error!(error = %e, "Failed to log data submission audit event");
                                    }

                                    // Add rate limit headers to success response
                                    let rate_headers =
                                        rate_limiter.create_headers(&rate_limit_result);
                                    let response_obj = Json(response).into_response();

                                    // Broadcast block in background (don't block response)
                                    let p2p_clone = Arc::clone(&p2p);
                                    let block_clone = block.clone();
                                    tokio::spawn(async move {
                                        p2p_clone.broadcast_block(&block_clone).await;
                                    });

                                    Ok(add_rate_limit_headers(response_obj, rate_headers))
                                }
                                Err(e) => {
                                    error!(error = %e, "Failed to add block");
                                    Err(e)
                                }
                            }
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to add collection");
                            Err(e)
                        }
                    }
                }
                Err(e) => {
                    error!(error = %e, "Failed to create encrypted collection");
                    Err(e)
                }
            }
        }
        None => Err(GoudChainError::Internal(
            "Node signing key not available".to_string(),
        )),
    }
}

/// Handle GET /data/list - List all user's collections (requires auth)
pub async fn handle_list_data(
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    headers: HeaderMap,
) -> Result<AxumResponse> {
    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            // Decrypt API key from JWT's encrypted_api_key field
            match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(key) => key,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            }
        }
    };

    // Get API key hash for rate limiting
    let api_key_hash = hash_api_key_hex(&api_key);

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);

    // Check rate limit (read operation)
    let rate_limit_result = match rate_limiter.check_limit(&api_key_hash, &client_ip, false) {
        Ok(result) => result,
        Err(e) => {
            // Rate limiter error - fail open (allow request but log error)
            error!(error = %e, "Rate limit check failed, allowing request");
            RateLimitResult::Allowed {
                limit: 100,
                remaining: 100,
                reset_at: chrono::Utc::now().timestamp() + 60,
            }
        }
    };

    // Handle rate limit result
    match &rate_limit_result {
        RateLimitResult::Blocked {
            ban_level,
            retry_after,
            violation_count,
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                ban_level = ?ban_level,
                violation_count = violation_count,
                "Read request blocked by rate limiter"
            );
            let error = GoudChainError::ApiKeyBanned {
                ban_level: format!("{:?}", ban_level),
                expires_at: chrono::Utc::now().timestamp() + *retry_after as i64,
            };
            let rate_headers = rate_limiter.create_headers(&rate_limit_result);
            let response = error.into_response();
            return Ok(add_rate_limit_headers(response, rate_headers));
        }
        RateLimitResult::Warning {
            violation_count, ..
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                violation_count = violation_count,
                "Rate limit warning on read operation"
            );
        }
        RateLimitResult::Allowed { remaining, .. } => {
            info!(
                api_key_hash = %api_key_hash,
                remaining = remaining,
                "Read rate limit check passed"
            );
        }
    }

    let blockchain_guard = blockchain.read().await;

    // Verify account exists
    if blockchain_guard.find_account(&api_key).is_none() {
        return Err(GoudChainError::Unauthorized(
            "Account not found".to_string(),
        ));
    }

    // Find all collections for this user using blind index lookup
    let collections = blockchain_guard.find_collections_by_owner(&api_key);
    let mut result = Vec::new();

    for collection in collections {
        // Try to decrypt metadata (we have the API key)
        let label = match collection.decrypt_metadata(&api_key) {
            Ok(metadata) => metadata["label"]
                .as_str()
                .unwrap_or("[decryption failed]")
                .to_string(),
            Err(_) => "[encrypted]".to_string(),
        };

        let created_at = match collection.decrypt_metadata(&api_key) {
            Ok(metadata) => metadata["created_at"].as_i64().unwrap_or(0),
            Err(_) => 0,
        };

        // Block number lookup requires scanning all blocks - skip for performance
        result.push(CollectionListItem {
            collection_id: collection.collection_id.clone(),
            label,
            created_at,
            block_number: 0,
        });
    }

    let response = CollectionListResponse {
        collections: result.clone(),
    };

    // Audit log: Data listed (batched and flushed every 10s)
    if let Err(e) = audit_logger.log(
        &api_key,
        AuditEventType::DataListed,
        None,
        &client_ip,
        serde_json::json!({"count": result.len()}),
    ) {
        error!(error = %e, "Failed to log data list audit event");
    }

    // Add rate limit headers to response
    let rate_headers = rate_limiter.create_headers(&rate_limit_result);
    let response_obj = Json(response).into_response();
    Ok(add_rate_limit_headers(response_obj, rate_headers))
}

/// Handle POST /data/decrypt/:collection_id - Decrypt a specific collection
pub async fn handle_decrypt_data(
    Path(collection_id): Path<String>,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    headers: HeaderMap,
) -> Result<AxumResponse> {
    // Extract authentication - must be API key for decryption
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            // Decrypt API key from JWT's encrypted_api_key field
            match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(key) => key,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            }
        }
    };

    // Get API key hash for rate limiting
    let api_key_hash = hash_api_key_hex(&api_key);

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);

    // Check rate limit (write operation - decryption is computationally expensive)
    let rate_limit_result = match rate_limiter.check_limit(&api_key_hash, &client_ip, true) {
        Ok(result) => result,
        Err(e) => {
            // Rate limiter error - fail open (allow request but log error)
            error!(error = %e, "Rate limit check failed, allowing request");
            RateLimitResult::Allowed {
                limit: 10,
                remaining: 10,
                reset_at: chrono::Utc::now().timestamp() + 60,
            }
        }
    };

    // Handle rate limit result
    match &rate_limit_result {
        RateLimitResult::Blocked {
            ban_level,
            retry_after,
            violation_count,
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                ban_level = ?ban_level,
                violation_count = violation_count,
                "Decrypt request blocked by rate limiter"
            );
            let error = GoudChainError::ApiKeyBanned {
                ban_level: format!("{:?}", ban_level),
                expires_at: chrono::Utc::now().timestamp() + *retry_after as i64,
            };
            let rate_headers = rate_limiter.create_headers(&rate_limit_result);
            let response = error.into_response();
            return Ok(add_rate_limit_headers(response, rate_headers));
        }
        RateLimitResult::Warning {
            violation_count, ..
        } => {
            warn!(
                api_key_hash = %api_key_hash,
                violation_count = violation_count,
                "Rate limit warning on decrypt operation"
            );
        }
        RateLimitResult::Allowed { remaining, .. } => {
            info!(
                api_key_hash = %api_key_hash,
                remaining = remaining,
                "Decrypt rate limit check passed"
            );
        }
    }

    let blockchain_guard = blockchain.read().await;

    // Find collection (requires API key to decrypt envelope and verify ownership)
    match blockchain_guard.find_collection(&collection_id, &api_key) {
        Some(collection) => {
            // Ownership already verified in find_collection
            // (it only returns collections owned by the API key)

            // Decrypt metadata and payload
            match (
                collection.decrypt_metadata(&api_key),
                collection.decrypt_payload(&api_key),
            ) {
                (Ok(metadata), Ok(data)) => {
                    let response = DecryptCollectionResponse {
                        collection_id: collection.collection_id.clone(),
                        label: metadata["label"].as_str().unwrap_or("unknown").to_string(),
                        data,
                        created_at: metadata["created_at"].as_i64().unwrap_or(0),
                    };

                    // Audit log: Data decrypted (batched and flushed every 10s)
                    if let Err(e) = audit_logger.log(
                        &api_key,
                        AuditEventType::DataDecrypted,
                        Some(collection.collection_id.clone()),
                        &client_ip,
                        serde_json::json!({"success": true}),
                    ) {
                        error!(error = %e, "Failed to log data decryption audit event");
                    }

                    // Add rate limit headers to response
                    let rate_headers = rate_limiter.create_headers(&rate_limit_result);
                    let response_obj = Json(response).into_response();
                    Ok(add_rate_limit_headers(response_obj, rate_headers))
                }
                _ => Err(GoudChainError::DecryptionFailed),
            }
        }
        None => Err(GoudChainError::DataNotFound(collection_id)),
    }
}

// ========== AUDIT LOG HANDLER ==========

/// Handle GET /api/audit - Query audit logs for operational security
/// Returns paginated audit logs for authenticated user
/// Query params: start_ts, end_ts, event_type, page, page_size
pub async fn handle_get_audit_logs(
    Extension(audit_logger): Extension<Arc<AuditLogger>>,
    Extension(config): Extension<Arc<Config>>,
    headers: HeaderMap,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<AuditLogResponse>> {
    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(key) => key,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            }
        }
    };

    // Parse query parameters
    let start_ts = params.get("start_ts").and_then(|s| s.parse::<i64>().ok());
    let end_ts = params.get("end_ts").and_then(|s| s.parse::<i64>().ok());
    let event_type_str = params.get("event_type");
    let page = params
        .get("page")
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(0);
    let page_size = params
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
    match audit_logger
        .query_logs(&api_key, filter, page, page_size)
        .await
    {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err(e),
    }
}

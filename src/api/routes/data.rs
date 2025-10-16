use axum::{
    extract::{Extension, Path},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::auth::{decrypt_api_key_from_jwt, extract_auth_from_headers, AuthMethod};
use crate::api::internal_client::forward_request_with_headers;
use crate::api::schemas::SubmitDataState;
use crate::api::schemas::{
    CollectionListItem, CollectionListResponse, DecryptCollectionResponse, ErrorResponse,
    SubmitDataRequest, SubmitDataResponse,
};
use crate::api::{RateLimitResult, RateLimiter};
use crate::config::Config;
use crate::constants::CHECKPOINT_INTERVAL;
use crate::crypto::hash_api_key_hex;
use crate::domain::blockchain::{get_current_validator, is_authorized_validator};
use crate::domain::{Blockchain, EncryptedCollection};
use crate::network::P2PNode;
use crate::types::*;

use super::DATA_TAG;

/// Data operation routes
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(submit_data))
        .routes(routes!(list_data))
        .routes(routes!(decrypt_data))
}

/// Extract client IP from headers
fn extract_client_ip(headers: &HeaderMap) -> String {
    if let Some(ip) = headers.get("x-real-ip") {
        if let Ok(ip_str) = ip.to_str() {
            return ip_str.to_string();
        }
    }

    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded.to_str() {
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    "unknown".to_string()
}

/// Helper to add rate limit headers
fn add_rate_limit_headers(
    mut response: axum::response::Response,
    headers: Vec<(String, String)>,
) -> axum::response::Response {
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

/// Submit encrypted data to blockchain
///
/// Encrypts user data and stores it on the blockchain in an immutable, tamper-proof manner.
/// Each data submission creates a new encrypted collection with a unique ID.
/// The data is encrypted with the user's API key, ensuring only the owner can decrypt it.
/// Requires direct API key authentication (session tokens not supported for data submission).
#[utoipa::path(
    post,
    path = "/submit",
    tag = DATA_TAG,
    request_body = SubmitDataRequest,
    security(
        ("api_key" = [])
    ),
    responses(
        (status = 201, description = "Data submitted successfully", body = SubmitDataResponse),
        (status = 400, description = "Invalid request or payload too large", body = ErrorResponse),
        (status = 401, description = "Missing or invalid API key", body = ErrorResponse),
        (status = 403, description = "Only current validator can submit data", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn submit_data(
    headers: HeaderMap,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(state): Extension<SubmitDataState>,
    Json(request): Json<SubmitDataRequest>,
) -> Result<impl IntoResponse> {
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
        }
        RateLimitResult::Allowed { remaining, .. } => {
            info!(
                api_key_hash = %api_key_hash,
                remaining = remaining,
                "Rate limit check passed"
            );
        }
    }

    // Verify account exists
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

    // Validate request size BEFORE encryption
    request.validate()?;

    // Check if this node is the authorized validator
    let blockchain_guard = blockchain.read().await;
    let next_block_number = blockchain_guard
        .chain
        .last()
        .map(|b| b.index + 1)
        .unwrap_or(1);
    let is_validator = is_authorized_validator(
        &blockchain_guard.node_id,
        next_block_number,
        &blockchain_guard.validator_config,
    );
    let node_id = blockchain_guard.node_id.clone();
    let validator_config = blockchain_guard.validator_config.clone();
    drop(blockchain_guard);

    if !is_validator {
        // Forward request to the correct validator
        let expected_validator =
            get_current_validator(&validator_config.validators, next_block_number);
        warn!(
            current_node = %node_id,
            expected_validator = %expected_validator,
            next_block = next_block_number,
            "Forwarding data submission to validator node"
        );

        match validator_config.get_validator_address(&expected_validator) {
            Some(validator_addr) => {
                let body = serde_json::to_string(&request).map_err(|e| {
                    GoudChainError::Internal(format!("Serialization failed: {}", e))
                })?;

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
            None => {
                error!(validator = %expected_validator, "Unknown validator address");
                return Err(GoudChainError::Internal(format!(
                    "Unknown validator: {}",
                    expected_validator
                )));
            }
        }
    }

    // This node IS the validator - proceed with encryption and block creation
    let signing_key = {
        let blockchain_guard = blockchain.read().await;
        blockchain_guard.node_signing_key.clone()
    };

    match signing_key {
        Some(key) => {
            match EncryptedCollection::new(
                request.label.clone(),
                request.data,
                &api_key,
                api_key_hash.clone(),
                &key,
            ) {
                Ok(collection) => {
                    let collection_id = collection.collection_id.clone();

                    let mut blockchain_guard = blockchain.write().await;
                    match blockchain_guard.add_collection(collection) {
                        Ok(_) => {
                            match blockchain_guard.add_block() {
                                Ok(block) => {
                                    if let Err(e) = p2p.blockchain_store.save_block(&block) {
                                        error!(error = %e, "Failed to save block to RocksDB");
                                    }

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

                                    // Audit log
                                    if let Err(e) = state.audit_logger.log(
                                        &api_key,
                                        AuditEventType::DataSubmitted,
                                        Some(collection_id.clone()),
                                        &client_ip,
                                        serde_json::json!({"block": block_index, "label": request.label}),
                                    ) {
                                        error!(error = %e, "Failed to log data submission audit event");
                                    }

                                    let rate_headers =
                                        rate_limiter.create_headers(&rate_limit_result);
                                    let response_obj =
                                        (StatusCode::CREATED, Json(response)).into_response();

                                    let block_arc = Arc::new(block);

                                    // Broadcast block in background
                                    let p2p_clone = Arc::clone(&p2p);
                                    let block_ref = Arc::clone(&block_arc);
                                    tokio::spawn(async move {
                                        p2p_clone.broadcast_block(&block_ref).await;
                                    });

                                    // Broadcast WebSocket events
                                    let ws_clone = Arc::clone(&state.ws_broadcaster);
                                    let cid = collection_id.clone();
                                    let bhash = block_arc.hash.clone();
                                    tokio::spawn(async move {
                                        ws_clone
                                            .broadcast_collection_update(cid, block_index)
                                            .await;
                                        ws_clone
                                            .broadcast_blockchain_update(block_index, bhash)
                                            .await;
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

/// List all data collections
///
/// Returns metadata for all encrypted collections owned by the authenticated user.
/// This endpoint does not decrypt the actual data content - use decrypt endpoint for that.
/// Supports both API key and session token authentication.
#[utoipa::path(
    get,
    path = "/list",
    tag = DATA_TAG,
    security(
        ("bearer_token" = []),
        ("api_key" = [])
    ),
    responses(
        (status = 200, description = "Data list retrieved successfully", body = CollectionListResponse),
        (status = 401, description = "Missing or invalid authentication", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn list_data(
    headers: HeaderMap,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(state): Extension<SubmitDataState>,
) -> Result<impl IntoResponse> {
    let audit_logger = &state.audit_logger;

    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key_hex(&key);
            (key, hash)
        }
        AuthMethod::SessionToken(claims) => {
            let key = match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(k) => k,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            };
            let hash = claims.api_key_hash;
            (key, hash)
        }
    };

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);

    // Check rate limit (read operation)
    let rate_limit_result = match rate_limiter.check_limit(&api_key_hash, &client_ip, false) {
        Ok(result) => result,
        Err(e) => {
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

    // Find all collections for this user
    let collections = blockchain_guard.find_collections_by_owner(&api_key);
    let mut result = Vec::new();

    for collection in collections {
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

    // Audit log
    if let Err(e) = audit_logger.log(
        &api_key,
        AuditEventType::DataListed,
        None,
        &client_ip,
        serde_json::json!({"count": result.len()}),
    ) {
        error!(error = %e, "Failed to log data list audit event");
    }

    let rate_headers = rate_limiter.create_headers(&rate_limit_result);
    let response_obj = Json(response).into_response();
    Ok(add_rate_limit_headers(response_obj, rate_headers))
}

/// Decrypt data from a collection
///
/// Decrypts and returns the data content from a specific encrypted collection.
/// Only the owner (authenticated with the correct API key or session token) can decrypt the data.
/// This operation is computationally expensive and subject to stricter rate limits.
#[utoipa::path(
    post,
    path = "/decrypt/{collection_id}",
    tag = DATA_TAG,
    params(
        ("collection_id" = String, Path, description = "Collection ID to decrypt", example = "550e8400-e29b-41d4-a716-446655440000")
    ),
    security(
        ("bearer_token" = []),
        ("api_key" = [])
    ),
    responses(
        (status = 200, description = "Data decrypted successfully", body = DecryptCollectionResponse),
        (status = 401, description = "Missing or invalid authentication", body = ErrorResponse),
        (status = 404, description = "Collection not found or access denied", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Decryption failed", body = ErrorResponse)
    )
)]
async fn decrypt_data(
    headers: HeaderMap,
    Path(collection_id): Path<String>,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(state): Extension<SubmitDataState>,
) -> Result<impl IntoResponse> {
    let audit_logger = &state.audit_logger;

    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key_hex(&key);
            (key, hash)
        }
        AuthMethod::SessionToken(claims) => {
            let key = match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(k) => k,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            };
            let hash = claims.api_key_hash;
            (key, hash)
        }
    };

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);

    // Check rate limit (write operation - decryption is expensive)
    let rate_limit_result = match rate_limiter.check_limit(&api_key_hash, &client_ip, true) {
        Ok(result) => result,
        Err(e) => {
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

    // Find collection
    match blockchain_guard.find_collection(&collection_id, &api_key) {
        Some(collection) => {
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

                    // Audit log
                    if let Err(e) = audit_logger.log(
                        &api_key,
                        AuditEventType::DataDecrypted,
                        Some(collection.collection_id.clone()),
                        &client_ip,
                        serde_json::json!({"success": true}),
                    ) {
                        error!(error = %e, "Failed to log data decryption audit event");
                    }

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

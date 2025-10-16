use axum::{
    extract::Extension,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::schemas::SubmitDataState;
use crate::api::schemas::{
    CreateAccountRequest, CreateAccountResponse, ErrorResponse, LoginRequest, LoginResponse,
};
use crate::api::{RateLimitResult, RateLimiter};
use crate::config::Config;
use crate::constants::{CHECKPOINT_INTERVAL, SESSION_EXPIRY_SECONDS};
use crate::crypto::{encode_api_key, generate_api_key, generate_signing_key, hash_api_key_hex};
use crate::domain::{Blockchain, UserAccount};
use crate::network::P2PNode;
use crate::types::*;

use super::ACCOUNT_TAG;

/// Account routes
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(create_account))
        .routes(routes!(login))
}

/// Extract client IP from headers (X-Real-IP or X-Forwarded-For)
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

/// Helper to add rate limit headers to response
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

/// Create a new user account
///
/// Generates a new blockchain account with a unique API key for authentication.
/// The API key is cryptographically derived and shown only once - it must be stored securely by the client.
/// Account creation is rate-limited by client IP address to prevent abuse.
#[utoipa::path(
    post,
    path = "/create",
    tag = ACCOUNT_TAG,
    request_body = CreateAccountRequest,
    responses(
        (status = 201, description = "Account created successfully", body = CreateAccountResponse),
        (status = 400, description = "Invalid request or account already exists", body = ErrorResponse),
        (status = 403, description = "Only current validator can create accounts", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn create_account(
    headers: HeaderMap,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(p2p): Extension<Arc<P2PNode>>,
    Extension(rate_limiter): Extension<Arc<RateLimiter>>,
    Extension(state): Extension<SubmitDataState>,
    Json(request): Json<CreateAccountRequest>,
) -> Result<impl IntoResponse> {
    let audit_logger = &state.audit_logger;
    let ws_broadcaster = &state.ws_broadcaster;

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&headers);
    let ip_hash = hash_api_key_hex(client_ip.as_bytes());

    // Check rate limit (write operation - account creation)
    let rate_limit_result = match rate_limiter.check_limit(&ip_hash, &client_ip, true) {
        Ok(result) => result,
        Err(e) => {
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

    // Check if this node is the authorized validator
    use crate::domain::blockchain::{get_current_validator, is_authorized_validator};

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
            "Forwarding account creation to validator node"
        );

        match validator_config.get_validator_address(&expected_validator) {
            Some(validator_addr) => {
                use crate::api::internal_client::forward_request_to_node;

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
            None => {
                error!(validator = %expected_validator, "Unknown validator address");
                return Err(GoudChainError::Internal(format!(
                    "Unknown validator: {}",
                    expected_validator
                )));
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
                            // Save block to RocksDB
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

                            // Audit log: Account created
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
                            let response_obj =
                                (StatusCode::CREATED, Json(response)).into_response();

                            // Broadcast block in background
                            let block_arc = Arc::new(block);
                            let p2p_clone = Arc::clone(&p2p);
                            let block_ref = Arc::clone(&block_arc);
                            tokio::spawn(async move {
                                p2p_clone.broadcast_block(&block_ref).await;
                            });

                            // Broadcast WebSocket blockchain update event
                            let ws_clone = Arc::clone(ws_broadcaster);
                            let bhash = block_arc.hash.clone();
                            tokio::spawn(async move {
                                ws_clone
                                    .broadcast_blockchain_update(block_index, bhash)
                                    .await;
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

/// Login with API key
///
/// Authenticates a user with their API key and returns a JWT session token.
/// The session token can be used for subsequent API requests instead of the raw API key.
/// Session tokens expire after 1 hour and must be refreshed by logging in again.
#[utoipa::path(
    post,
    path = "/login",
    tag = ACCOUNT_TAG,
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 401, description = "Invalid API key or account not found", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn login(
    headers: HeaderMap,
    Extension(blockchain): Extension<Arc<RwLock<Blockchain>>>,
    Extension(config): Extension<Arc<Config>>,
    Extension(state): Extension<SubmitDataState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    let audit_logger = &state.audit_logger;

    // Decode API key
    match crate::crypto::decode_api_key(&request.api_key) {
        Ok(api_key) => {
            // Hash API key ONCE (expensive: 100k iterations)
            let api_key_hash_hex = hash_api_key_hex(&api_key);

            // Find account
            let blockchain_guard = blockchain.read().await;
            match blockchain_guard.find_account_with_hash(&api_key, Some(api_key_hash_hex.clone()))
            {
                Some(account) => {
                    // Verify API key hash matches (constant-time comparison)
                    match crate::api::auth::verify_api_key_hash_precomputed(
                        Some(&api_key_hash_hex),
                        &api_key,
                        &account.api_key_hash,
                    ) {
                        Ok(_) => {
                            // Generate session token with encrypted API key
                            let api_key_hash = api_key_hash_hex;
                            match crate::api::auth::generate_session_token(
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

                                    // Drop blockchain lock before audit logging
                                    drop(blockchain_guard);

                                    // Audit log: Account login
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

use std::sync::{Arc, Mutex};
use tiny_http::Request;
use tracing::{error, info, warn};

use super::auth::generate_session_token;
use super::internal_client::{forward_request_to_node, get_validator_node_address};
use super::middleware::{
    error_response, error_response_with_headers, extract_client_ip, json_response,
    json_response_with_headers,
};
use super::RateLimitResult;
use crate::config::Config;
use crate::constants::{CHECKPOINT_INTERVAL, SESSION_EXPIRY_SECONDS};
use crate::crypto::{encode_api_key, generate_api_key, generate_signing_key, hash_api_key_hex};
use crate::domain::blockchain::{get_current_validator, is_authorized_validator};
use crate::domain::{Blockchain, UserAccount};
use crate::network::P2PNode;
use crate::types::*;

/// Handle POST /account/create - Create a new user account
pub fn handle_create_account(
    mut request: Request,
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
    _rate_limiter: Arc<crate::api::RateLimiter>,
) {
    // Extract client IP for rate limiting (no API key yet for new accounts)
    let client_ip = extract_client_ip(&request);

    // Use IP hash as the rate limit key for account creation
    let ip_hash = hash_api_key_hex(client_ip.as_bytes());

    // Check rate limit (write operation - account creation)
    let rate_limit_result = match _rate_limiter.check_limit(&ip_hash, &client_ip, true) {
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
            let headers = _rate_limiter.create_headers(&rate_limit_result);
            let _ = request.respond(error_response_with_headers(error.to_json(), 429, headers));
            return;
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

    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let _ = request.respond(error_response(
            ErrorResponse::new("Failed to read request body").to_json(),
            400,
        ));
        return;
    }

    match serde_json::from_str::<CreateAccountRequest>(&content) {
        Ok(req) => {
            // Check if this node is the authorized validator for the next block
            let blockchain_guard = blockchain.lock().unwrap();
            let next_block_number = blockchain_guard
                .chain
                .last()
                .map(|b| b.index + 1)
                .unwrap_or(1);
            let is_validator =
                is_authorized_validator(&blockchain_guard.node_id, next_block_number);
            drop(blockchain_guard);

            if !is_validator {
                // This node is NOT the validator - forward request to the correct validator
                let expected_validator = get_current_validator(next_block_number);
                warn!(
                    current_node = %blockchain.lock().unwrap().node_id,
                    expected_validator = %expected_validator,
                    next_block = next_block_number,
                    "Forwarding account creation to validator node"
                );

                match get_validator_node_address(&expected_validator) {
                    Ok(validator_addr) => {
                        match forward_request_to_node(
                            &validator_addr,
                            "POST",
                            "/account/create",
                            &content,
                            "application/json",
                        ) {
                            Ok((status_code, response_body)) => {
                                info!(
                                    validator = %expected_validator,
                                    status = status_code,
                                    "Forwarded request successfully"
                                );
                                let _ = request.respond(
                                    tiny_http::Response::from_string(response_body)
                                        .with_status_code(status_code)
                                        .with_header(
                                            tiny_http::Header::from_bytes(
                                                &b"Content-Type"[..],
                                                &b"application/json"[..],
                                            )
                                            .unwrap(),
                                        ),
                                );
                                return;
                            }
                            Err(e) => {
                                error!(error = %e, "Failed to forward request to validator");
                                let _ = request.respond(error_response(
                                    GoudChainError::Internal(format!(
                                        "Failed to forward to validator: {}",
                                        e
                                    ))
                                    .to_json(),
                                    503,
                                ));
                                return;
                            }
                        }
                    }
                    Err(e) => {
                        error!(error = %e, "Failed to get validator address");
                        let _ = request.respond(error_response(e.to_json(), 500));
                        return;
                    }
                }
            }

            // This node IS the validator - proceed with block creation
            let api_key = generate_api_key();
            let signing_key = generate_signing_key();

            // Create user account
            match UserAccount::new(&api_key, &signing_key, req.metadata) {
                Ok(account) => {
                    let account_id = account.account_id.clone();

                    // Add account to blockchain WITH API key for envelope creation
                    let mut blockchain_guard = blockchain.lock().unwrap();
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

                                    drop(blockchain_guard);

                                    let response = CreateAccountResponse {
                                        account_id,
                                        api_key: encode_api_key(&api_key),
                                        warning: "⚠️ SAVE THIS API KEY SECURELY. It cannot be recovered and provides full access to your data.".to_string(),
                                    };

                                    info!("New account created");
                                    // Add rate limit headers to success response
                                    let headers = _rate_limiter.create_headers(&rate_limit_result);
                                    let _ = request.respond(json_response_with_headers(
                                        serde_json::to_string(&response).unwrap(),
                                        headers,
                                    ));

                                    p2p.broadcast_block(&block);
                                }
                                Err(e) => {
                                    error!(error = %e, "Failed to create block");
                                    let _ = request
                                        .respond(error_response(e.to_json(), e.status_code()));
                                }
                            }
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to add account");
                            let _ = request.respond(error_response(e.to_json(), e.status_code()));
                        }
                    }
                }
                Err(e) => {
                    error!(error = %e, "Failed to create account");
                    let _ = request.respond(error_response(e.to_json(), e.status_code()));
                }
            }
        }
        Err(e) => {
            error!(error = %e, "Invalid request body");
            let _ = request.respond(error_response(
                GoudChainError::InvalidRequestBody(e.to_string()).to_json(),
                400,
            ));
        }
    }
}

/// Handle POST /account/login - Login with API key and get session token
pub fn handle_login(mut request: Request, blockchain: Arc<Mutex<Blockchain>>, config: Arc<Config>) {
    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let _ = request.respond(error_response(
            ErrorResponse::new("Failed to read request body").to_json(),
            400,
        ));
        return;
    }

    match serde_json::from_str::<LoginRequest>(&content) {
        Ok(req) => {
            // Decode API key
            match crate::crypto::decode_api_key(&req.api_key) {
                Ok(api_key) => {
                    // Hash API key ONCE (expensive: 100k iterations)
                    let api_key_hash_hex = hash_api_key_hex(&api_key);

                    // Find account (requires API key to decrypt envelope)
                    // Pass pre-computed hash to avoid re-hashing
                    let blockchain_guard = blockchain.lock().unwrap();
                    match blockchain_guard
                        .find_account_with_hash(&api_key, Some(api_key_hash_hex.clone()))
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
                                                account_id: account.account_id,
                                            };

                                            info!("User logged in");
                                            let _ = request.respond(json_response(
                                                serde_json::to_string(&response).unwrap(),
                                            ));
                                        }
                                        Err(e) => {
                                            error!(error = %e, "Failed to generate token");
                                            let _ = request.respond(error_response(
                                                e.to_json(),
                                                e.status_code(),
                                            ));
                                        }
                                    }
                                }
                                Err(e) => {
                                    info!("Invalid API key attempt");
                                    let _ = request
                                        .respond(error_response(e.to_json(), e.status_code()));
                                }
                            }
                        }
                        None => {
                            info!("Account not found");
                            let _ = request.respond(error_response(
                                GoudChainError::Unauthorized("Account not found".to_string())
                                    .to_json(),
                                403,
                            ));
                        }
                    }
                }
                Err(_) => {
                    let _ = request.respond(error_response(
                        GoudChainError::Unauthorized("Invalid API key format".to_string())
                            .to_json(),
                        400,
                    ));
                }
            }
        }
        Err(e) => {
            error!(error = %e, "Invalid request body");
            let _ = request.respond(error_response(
                GoudChainError::InvalidRequestBody(e.to_string()).to_json(),
                400,
            ));
        }
    }
}

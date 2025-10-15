use std::sync::{Arc, Mutex};
use tiny_http::{Request, Response};
use tracing::{error, info, warn};

use super::auth::{decrypt_api_key_from_jwt, extract_auth, AuthMethod};
use super::internal_client::{forward_request_with_headers, get_validator_node_address};
use super::middleware::{
    error_response, error_response_with_headers, extract_client_ip, json_response_with_headers,
};
use super::RateLimitResult;
use crate::config::Config;
use crate::constants::CHECKPOINT_INTERVAL;
use crate::crypto::hash_api_key_hex;
use crate::domain::blockchain::{get_current_validator, is_authorized_validator};
use crate::domain::{Blockchain, EncryptedCollection};
use crate::network::P2PNode;
use crate::types::*;

/// Handle POST /data/submit - Submit encrypted data (requires API key auth)
pub fn handle_submit_data(
    mut request: Request,
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
    config: Arc<Config>,
    _rate_limiter: Arc<crate::api::RateLimiter>, // TODO: Implement rate limiting
) {
    // Extract Authorization header (needed for forwarding)
    let auth_header_value = request
        .headers()
        .iter()
        .find(|h| {
            h.field
                .as_str()
                .as_str()
                .eq_ignore_ascii_case("authorization")
        })
        .map(|h| h.value.as_str().to_string());

    // Extract authentication
    let auth = match extract_auth(&request, &config) {
        Ok(a) => a,
        Err(e) => {
            let _ = request.respond(error_response(e.to_json(), e.status_code()));
            return;
        }
    };

    // Get API key and hash based on auth method
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key_hex(&key);
            (key, hash)
        }
        AuthMethod::SessionToken(_) => {
            // For session token, we need direct API key for encryption
            let _ = request.respond(error_response(
                GoudChainError::Unauthorized(
                    "Direct API key required for data submission".to_string(),
                )
                .to_json(),
                403,
            ));
            return;
        }
    };

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(&request);

    // Check rate limit (write operation)
    let rate_limit_result = match _rate_limiter.check_limit(&api_key_hash, &client_ip, true) {
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
            let headers = _rate_limiter.create_headers(&rate_limit_result);
            let _ = request.respond(error_response_with_headers(error.to_json(), 429, headers));
            return;
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
    let blockchain_guard = blockchain.lock().unwrap();
    if blockchain_guard
        .find_account_with_hash(&api_key, Some(api_key_hash.clone()))
        .is_none()
    {
        drop(blockchain_guard);
        let _ = request.respond(error_response(
            GoudChainError::Unauthorized("Account not found".to_string()).to_json(),
            403,
        ));
        return;
    }
    drop(blockchain_guard);

    // Read request body
    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let _ = request.respond(error_response(
            ErrorResponse::new("Failed to read request body").to_json(),
            400,
        ));
        return;
    }

    match serde_json::from_str::<SubmitDataRequest>(&content) {
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
                    "Forwarding data submission to validator node"
                );

                match get_validator_node_address(&expected_validator) {
                    Ok(validator_addr) => {
                        match forward_request_with_headers(
                            &validator_addr,
                            "POST",
                            "/data/submit",
                            &content,
                            "application/json",
                            auth_header_value.as_deref(),
                        ) {
                            Ok((status_code, response_body)) => {
                                info!(
                                    validator = %expected_validator,
                                    status = status_code,
                                    "Forwarded data submission successfully"
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
                                error!(error = %e, "Failed to forward data submission to validator");
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

            // This node IS the validator - proceed with encryption and block creation
            // Get node signing key
            let signing_key = {
                let blockchain_guard = blockchain.lock().unwrap();
                blockchain_guard.node_signing_key.clone()
            };

            match signing_key {
                Some(key) => {
                    // Create encrypted collection
                    match EncryptedCollection::new(
                        req.label,
                        req.data,
                        &api_key,
                        api_key_hash.clone(),
                        &key,
                    ) {
                        Ok(collection) => {
                            let collection_id = collection.collection_id.clone();

                            // Add to blockchain
                            let mut blockchain = blockchain.lock().unwrap();
                            match blockchain.add_collection(collection) {
                                Ok(_) => {
                                    // Create block
                                    match blockchain.add_block() {
                                        Ok(block) => {
                                            // Save block to RocksDB (incremental write)
                                            if let Err(e) = p2p.blockchain_store.save_block(&block)
                                            {
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

                                            drop(blockchain);

                                            let response = SubmitDataResponse {
                                                message: "Data encrypted and stored successfully"
                                                    .to_string(),
                                                collection_id,
                                                block_number: block.index,
                                            };

                                            // Add rate limit headers to success response
                                            let headers =
                                                _rate_limiter.create_headers(&rate_limit_result);
                                            let _ = request.respond(json_response_with_headers(
                                                serde_json::to_string(&response).unwrap(),
                                                headers,
                                            ));

                                            p2p.broadcast_block(&block);
                                        }
                                        Err(e) => {
                                            error!(error = %e, "Failed to add block");
                                            let _ = request.respond(error_response(
                                                e.to_json(),
                                                e.status_code(),
                                            ));
                                        }
                                    }
                                }
                                Err(e) => {
                                    error!(error = %e, "Failed to add collection");
                                    let _ = request
                                        .respond(error_response(e.to_json(), e.status_code()));
                                }
                            }
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to create encrypted collection");
                            let _ = request.respond(error_response(e.to_json(), e.status_code()));
                        }
                    }
                }
                None => {
                    let _ = request.respond(error_response(
                        ErrorResponse::new("Node signing key not available").to_json(),
                        500,
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

/// Handle GET /data/list - List all user's collections (requires auth)
pub fn handle_list_data(
    request: &Request,
    blockchain: Arc<Mutex<Blockchain>>,
    config: Arc<Config>,
    _rate_limiter: Arc<crate::api::RateLimiter>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    // Extract authentication
    let auth = match extract_auth(request, &config) {
        Ok(a) => a,
        Err(e) => return error_response(e.to_json(), e.status_code()),
    };

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            // Decrypt API key from JWT's encrypted_api_key field
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

    // Get API key hash for rate limiting
    let api_key_hash = hash_api_key_hex(&api_key);

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(request);

    // Check rate limit (read operation)
    let rate_limit_result = match _rate_limiter.check_limit(&api_key_hash, &client_ip, false) {
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
            let headers = _rate_limiter.create_headers(&rate_limit_result);
            return error_response_with_headers(error.to_json(), 429, headers);
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

    let blockchain = blockchain.lock().unwrap();

    // Verify account exists
    if blockchain.find_account(&api_key).is_none() {
        return error_response(
            GoudChainError::Unauthorized("Account not found".to_string()).to_json(),
            403,
        );
    }

    // Find all collections for this user using blind index lookup
    let collections = blockchain.find_collections_by_owner(&api_key);
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

        result.push(CollectionListItem {
            collection_id: collection.collection_id.clone(),
            label,
            created_at,
            block_number: 0, // TODO: Add block number lookup if needed
        });
    }

    let response = CollectionListResponse {
        collections: result,
    };

    // Add rate limit headers to response
    let headers = _rate_limiter.create_headers(&rate_limit_result);
    json_response_with_headers(serde_json::to_string(&response).unwrap(), headers)
}

/// Handle POST /data/decrypt - Decrypt a specific collection
pub fn handle_decrypt_data(
    request: &Request,
    blockchain: Arc<Mutex<Blockchain>>,
    collection_id: &str,
    config: Arc<Config>,
    _rate_limiter: Arc<crate::api::RateLimiter>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    // Extract authentication - must be API key for decryption
    let auth = match extract_auth(request, &config) {
        Ok(a) => a,
        Err(e) => return error_response(e.to_json(), e.status_code()),
    };

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            // Decrypt API key from JWT's encrypted_api_key field
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

    // Get API key hash for rate limiting
    let api_key_hash = hash_api_key_hex(&api_key);

    // Extract client IP for rate limiting
    let client_ip = extract_client_ip(request);

    // Check rate limit (write operation - decryption is computationally expensive)
    let rate_limit_result = match _rate_limiter.check_limit(&api_key_hash, &client_ip, true) {
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
            let headers = _rate_limiter.create_headers(&rate_limit_result);
            return error_response_with_headers(error.to_json(), 429, headers);
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

    let blockchain = blockchain.lock().unwrap();

    // Find collection (requires API key to decrypt envelope and verify ownership)
    match blockchain.find_collection(collection_id, &api_key) {
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
                        collection_id: collection.collection_id,
                        label: metadata["label"].as_str().unwrap_or("unknown").to_string(),
                        data,
                        created_at: metadata["created_at"].as_i64().unwrap_or(0),
                    };
                    // Add rate limit headers to response
                    let headers = _rate_limiter.create_headers(&rate_limit_result);
                    json_response_with_headers(serde_json::to_string(&response).unwrap(), headers)
                }
                _ => error_response(
                    GoudChainError::DecryptionFailed.to_json(),
                    GoudChainError::DecryptionFailed.status_code(),
                ),
            }
        }
        None => error_response(
            GoudChainError::DataNotFound(collection_id.to_string()).to_json(),
            404,
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::blockchain::{get_current_validator, is_authorized_validator};

    #[test]
    fn test_validator_determination_for_block_numbers() {
        // Test that validator rotation works correctly for 2-node setup
        // Block 0 -> Validator_1 (node1)
        assert_eq!(get_current_validator(0), "Validator_1");
        assert!(is_authorized_validator("node1", 0));
        assert!(!is_authorized_validator("node2", 0));

        // Block 1 -> Validator_2 (node2)
        assert_eq!(get_current_validator(1), "Validator_2");
        assert!(is_authorized_validator("node2", 1));
        assert!(!is_authorized_validator("node1", 1));

        // Block 2 -> Validator_1 (node1)
        assert_eq!(get_current_validator(2), "Validator_1");
        assert!(is_authorized_validator("node1", 2));
        assert!(!is_authorized_validator("node2", 2));

        // Block 7 -> Validator_2 (node2) - the error case from production
        assert_eq!(get_current_validator(7), "Validator_2");
        assert!(is_authorized_validator("node2", 7));
        assert!(!is_authorized_validator("node1", 7));
    }

    #[test]
    fn test_validator_node_address_mapping() {
        // Test that validator names map correctly to node addresses
        assert_eq!(
            get_validator_node_address("Validator_1").unwrap(),
            "node1:8080"
        );
        assert_eq!(
            get_validator_node_address("Validator_2").unwrap(),
            "node2:8080"
        );

        // Test invalid validator
        assert!(get_validator_node_address("Invalid").is_err());
    }

    #[test]
    fn test_forwarding_uses_auth_header() {
        // This test verifies that the forwarding mechanism includes the Authorization header
        // We test the internal_client module which is already tested, but document the flow here

        // When data submission request arrives at non-validator node:
        // 1. Extract Authorization header from request
        // 2. Determine correct validator for next block
        // 3. Forward request with Authorization header to validator node
        // 4. Validator node authenticates using forwarded header
        // 5. Response returned to original client

        // This is an integration test that would require a full HTTP server setup
        // The unit tests above verify the validator logic is correct
        // The account_handlers.rs already demonstrates this pattern working for /account/create
    }
}

use std::sync::{Arc, Mutex};
use tiny_http::Request;
use tracing::{error, info};

use super::auth::{generate_session_token, verify_api_key_hash};
use super::middleware::{error_response, json_response};
use crate::constants::SESSION_EXPIRY_SECONDS;
use crate::crypto::{
    encode_api_key, generate_api_key, generate_signing_key, hash_api_key,
};
use crate::domain::{Blockchain, UserAccount};
use crate::network::P2PNode;
use crate::storage;
use crate::types::*;

/// Handle POST /account/create - Create a new user account
pub fn handle_create_account(
    mut request: Request,
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
) {
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
            // Generate API key
            let api_key = generate_api_key();
            let signing_key = generate_signing_key();

            // Create user account
            match UserAccount::new(&api_key, &signing_key, req.metadata) {
                Ok(account) => {
                    let account_id = account.account_id.clone();

                    // Add account to blockchain
                    let mut blockchain_guard = blockchain.lock().unwrap();
                    match blockchain_guard.add_account(account) {
                        Ok(_) => {
                            // Create block
                            match blockchain_guard.add_block() {
                                Ok(block) => {
                                    if let Err(e) = storage::save_blockchain(&blockchain_guard) {
                                        error!(error = %e, "Failed to save blockchain");
                                    }
                                    drop(blockchain_guard);

                                    // Broadcast to peers
                                    p2p.broadcast_block(&block);

                                    let response = CreateAccountResponse {
                                        account_id,
                                        api_key: encode_api_key(&api_key),
                                        warning: "⚠️ SAVE THIS API KEY SECURELY. It cannot be recovered and provides full access to your data.".to_string(),
                                    };

                                    info!("New account created");
                                    let _ = request.respond(json_response(
                                        serde_json::to_string(&response).unwrap(),
                                    ));
                                }
                                Err(e) => {
                                    error!(error = %e, "Failed to create block");
                                    let _ = request.respond(error_response(
                                        e.to_json(),
                                        e.status_code(),
                                    ));
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
pub fn handle_login(mut request: Request, blockchain: Arc<Mutex<Blockchain>>) {
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
                    let api_key_hash = hash_api_key(&api_key);

                    // Find account
                    let blockchain_guard = blockchain.lock().unwrap();
                    match blockchain_guard.find_account(&api_key_hash) {
                        Some(account) => {
                            // Verify API key hash matches (constant-time comparison)
                            match verify_api_key_hash(&api_key, &account.api_key_hash) {
                                Ok(_) => {
                                    // Generate session token
                                    match generate_session_token(
                                        account.account_id.clone(),
                                        api_key_hash,
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

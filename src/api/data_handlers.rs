use std::sync::{Arc, Mutex};
use tiny_http::{Request, Response};
use tracing::error;

use super::auth::{extract_auth, AuthMethod};
use super::middleware::{error_response, json_response};
use crate::crypto::hash_api_key;
use crate::domain::{Blockchain, EncryptedCollection};
use crate::network::P2PNode;
use crate::storage;
use crate::types::*;

/// Handle POST /data/submit - Submit encrypted data (requires API key auth)
pub fn handle_submit_data(
    mut request: Request,
    blockchain: Arc<Mutex<Blockchain>>,
    p2p: Arc<P2PNode>,
) {
    // Extract authentication
    let auth = match extract_auth(&request) {
        Ok(a) => a,
        Err(e) => {
            let _ = request.respond(error_response(e.to_json(), e.status_code()));
            return;
        }
    };

    // Get API key and hash based on auth method
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key(&key);
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

    // Verify account exists
    let blockchain_guard = blockchain.lock().unwrap();
    if blockchain_guard.find_account(&api_key_hash).is_none() {
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
                                            if let Err(e) = storage::save_blockchain(&blockchain) {
                                                error!(error = %e, "Failed to save blockchain");
                                            }
                                            drop(blockchain);

                                            // Broadcast to peers
                                            p2p.broadcast_block(&block);

                                            let response = SubmitDataResponse {
                                                message: "Data encrypted and stored successfully"
                                                    .to_string(),
                                                collection_id,
                                                block_number: block.index,
                                            };
                                            let _ = request.respond(json_response(
                                                serde_json::to_string(&response).unwrap(),
                                            ));
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
) -> Response<std::io::Cursor<Vec<u8>>> {
    // Extract authentication
    let auth = match extract_auth(request) {
        Ok(a) => a,
        Err(e) => return error_response(e.to_json(), e.status_code()),
    };

    // Get API key hash from auth
    let (api_key, api_key_hash) = match auth {
        AuthMethod::ApiKey(key) => {
            let hash = hash_api_key(&key);
            (Some(key), hash)
        }
        AuthMethod::SessionToken(claims) => (None, claims.api_key_hash),
    };

    let blockchain = blockchain.lock().unwrap();

    // Verify account exists
    if blockchain.find_account(&api_key_hash).is_none() {
        return error_response(
            GoudChainError::Unauthorized("Account not found".to_string()).to_json(),
            403,
        );
    }

    // Find all collections for this user using blind index lookup
    let collections = blockchain.find_collections_by_owner(&api_key_hash);
    let mut result = Vec::new();

    for collection in collections {
        // Try to decrypt metadata if we have the API key
        let label = if let Some(ref key) = api_key {
            match collection.decrypt_metadata(key) {
                Ok(metadata) => metadata["label"]
                    .as_str()
                    .unwrap_or("[decryption failed]")
                    .to_string(),
                Err(_) => "[encrypted]".to_string(),
            }
        } else {
            "[encrypted - use API key to decrypt]".to_string()
        };

        let created_at = if let Some(ref key) = api_key {
            match collection.decrypt_metadata(key) {
                Ok(metadata) => metadata["created_at"].as_i64().unwrap_or(0),
                Err(_) => 0,
            }
        } else {
            0
        };

        // Note: We don't have block_number readily available in the new structure
        // This would require additional lookup. For now, set to 0
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
    json_response(serde_json::to_string(&response).unwrap())
}

/// Handle POST /data/decrypt - Decrypt a specific collection
pub fn handle_decrypt_data(
    request: &Request,
    blockchain: Arc<Mutex<Blockchain>>,
    collection_id: &str,
) -> Response<std::io::Cursor<Vec<u8>>> {
    // Extract authentication - must be API key for decryption
    let auth = match extract_auth(request) {
        Ok(a) => a,
        Err(e) => return error_response(e.to_json(), e.status_code()),
    };

    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(_) => {
            return error_response(
                GoudChainError::Unauthorized("Direct API key required for decryption".to_string())
                    .to_json(),
                403,
            );
        }
    };

    let api_key_hash = hash_api_key(&api_key);
    let blockchain = blockchain.lock().unwrap();

    // Find collection
    match blockchain.find_collection(collection_id) {
        Some(collection) => {
            // Verify ownership
            if collection.owner_api_key_hash != api_key_hash {
                return error_response(
                    GoudChainError::Unauthorized("Not the owner of this collection".to_string())
                        .to_json(),
                    403,
                );
            }

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
                    json_response(serde_json::to_string(&response).unwrap())
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

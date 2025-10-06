use std::sync::{Arc, Mutex};
use tiny_http::{Method, Request, Response};
use tracing::{error, info};

use super::middleware::{error_response, json_response};
use crate::domain::{Blockchain, EncryptedData};
use crate::network::P2PNode;
use crate::storage;
use crate::types::*;

/// Handle POST /data/submit - Submit encrypted data
pub fn handle_submit_data(
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

    match serde_json::from_str::<SubmitDataRequest>(&content) {
        Ok(req) => {
            // Get node signing key
            let signing_key = {
                let blockchain_guard = blockchain.lock().unwrap();
                blockchain_guard.node_signing_key.clone()
            };

            match signing_key {
                Some(key) => {
                    // Create encrypted data entry
                    match EncryptedData::new(req.label, req.data, &req.pin, &key) {
                        Ok(data_entry) => {
                            let data_id = data_entry.data_id.clone();

                            // Add to blockchain
                            let mut blockchain = blockchain.lock().unwrap();
                            match blockchain.add_encrypted_data(data_entry) {
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
                                                data_id,
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
                                    error!(error = %e, "Failed to add encrypted data");
                                    let _ = request
                                        .respond(error_response(e.to_json(), e.status_code()));
                                }
                            }
                        }
                        Err(e) => {
                            error!(error = %e, "Failed to create encrypted data");
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

/// Handle GET /data/list - List all encrypted data
pub fn handle_list_data(blockchain: Arc<Mutex<Blockchain>>) -> Response<std::io::Cursor<Vec<u8>>> {
    let blockchain = blockchain.lock().unwrap();
    let mut all_data = Vec::new();

    for block in &blockchain.chain {
        for data in &block.encrypted_data {
            all_data.push(DataListItem {
                data_id: data.data_id.clone(),
                label: data.label.clone(),
                encrypted: true,
                timestamp: data.timestamp,
                block_number: block.index,
                validator: block.validator.clone(),
            });
        }
    }

    let response = DataListResponse { data: all_data };
    json_response(serde_json::to_string(&response).unwrap())
}

/// Handle POST /data/decrypt - Decrypt data with PIN
pub fn handle_decrypt_data(mut request: Request, blockchain: Arc<Mutex<Blockchain>>) {
    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let _ = request.respond(error_response(
            ErrorResponse::new("Failed to read request body").to_json(),
            400,
        ));
        return;
    }

    match serde_json::from_str::<DecryptDataRequest>(&content) {
        Ok(req) => {
            let blockchain = blockchain.lock().unwrap();

            match blockchain.find_data(&req.data_id) {
                Some(data) => match data.decrypt(&req.pin) {
                    Ok(decrypted) => {
                        let response = DecryptDataResponse {
                            data_id: data.data_id,
                            label: data.label,
                            decrypted_data: decrypted,
                            timestamp: data.timestamp,
                        };
                        let _ = request
                            .respond(json_response(serde_json::to_string(&response).unwrap()));
                    }
                    Err(e) => {
                        info!(data_id = %req.data_id, "Invalid PIN attempt");
                        let _ = request.respond(error_response(e.to_json(), e.status_code()));
                    }
                },
                None => {
                    let _ = request.respond(error_response(
                        GoudChainError::DataNotFound(req.data_id).to_json(),
                        404,
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

/// Route and handle HTTP requests
pub fn route_request(request: Request, blockchain: Arc<Mutex<Blockchain>>, p2p: Arc<P2PNode>) {
    let method = request.method().clone();
    let url = request.url().to_string();

    match (method, url.as_str()) {
        (Method::Post, "/data/submit") => {
            handle_submit_data(request, blockchain, p2p);
        }
        (Method::Get, "/data/list") => {
            let _ = request.respond(handle_list_data(blockchain));
        }
        (Method::Post, "/data/decrypt") => {
            handle_decrypt_data(request, blockchain);
        }
        (Method::Get, "/chain") => {
            let _ = request.respond(handle_get_chain(blockchain));
        }
        (Method::Get, "/peers") => {
            let _ = request.respond(handle_get_peers(p2p));
        }
        (Method::Get, "/sync") => {
            let _ = request.respond(handle_sync(p2p));
        }
        _ => {
            let _ = request.respond(error_response(
                ErrorResponse::new("Not found").to_json(),
                404,
            ));
        }
    }
}

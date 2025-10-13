//! HTTP handlers for key-value storage operations.
//! Layer 5: Presentation - REST API endpoints for RocksDB operations.

use std::sync::Arc;
use tiny_http::{Request, Response};

use super::middleware::{error_response, json_response};
use crate::storage::RocksDbStore;
use crate::types::*;

/// Request body for PUT operation
#[derive(serde::Deserialize)]
struct PutRequest {
    key: String,
    value: String,
}

/// Handle POST /kv/put - Store a key-value pair
pub fn handle_kv_put(
    request: &mut Request,
    db: Arc<RocksDbStore>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    // Read request body
    let mut body = String::new();
    if let Err(e) = std::io::Read::read_to_string(request.as_reader(), &mut body) {
        return error_response(
            ErrorResponse::new(format!("Failed to read request body: {}", e)).to_json(),
            400,
        );
    }

    // Parse JSON
    let put_req: PutRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(e) => {
            return error_response(
                ErrorResponse::new(format!("Invalid JSON: {}", e)).to_json(),
                400,
            )
        }
    };

    // Store in RocksDB
    match db.put(&put_req.key, &put_req.value) {
        Ok(_) => {
            let response = MessageResponse {
                message: format!("Key '{}' stored successfully", put_req.key),
            };
            json_response(serde_json::to_string(&response).unwrap())
        }
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

/// Handle GET /kv/get/:key - Retrieve a value by key
pub fn handle_kv_get(key: &str, db: Arc<RocksDbStore>) -> Response<std::io::Cursor<Vec<u8>>> {
    match db.get(key) {
        Ok(value) => {
            let response = serde_json::json!({
                "key": key,
                "value": value,
            });
            json_response(serde_json::to_string(&response).unwrap())
        }
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

/// Handle DELETE /kv/delete/:key - Delete a key
pub fn handle_kv_delete(key: &str, db: Arc<RocksDbStore>) -> Response<std::io::Cursor<Vec<u8>>> {
    match db.delete(key) {
        Ok(_) => {
            let response = MessageResponse {
                message: format!("Key '{}' deleted successfully", key),
            };
            json_response(serde_json::to_string(&response).unwrap())
        }
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

/// Handle GET /kv/list - List all keys
pub fn handle_kv_list(db: Arc<RocksDbStore>) -> Response<std::io::Cursor<Vec<u8>>> {
    match db.list_keys() {
        Ok(keys) => {
            let response = serde_json::json!({
                "keys": keys,
                "count": keys.len(),
            });
            json_response(serde_json::to_string(&response).unwrap())
        }
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

/// Handle GET /kv/all - List all key-value pairs
pub fn handle_kv_list_all(db: Arc<RocksDbStore>) -> Response<std::io::Cursor<Vec<u8>>> {
    match db.list_all() {
        Ok(pairs) => {
            let response = serde_json::json!({
                "pairs": pairs,
                "count": pairs.len(),
            });
            json_response(serde_json::to_string(&response).unwrap())
        }
        Err(e) => error_response(e.to_json(), e.status_code()),
    }
}

use serde::{Deserialize, Serialize};

/// Request to submit encrypted data to the blockchain
#[derive(Debug, Clone, Deserialize)]
pub struct SubmitDataRequest {
    pub label: String,
    pub data: String,
    pub pin: String,
}

/// Response after successfully submitting data
#[derive(Debug, Clone, Serialize)]
pub struct SubmitDataResponse {
    pub message: String,
    pub data_id: String,
    pub block_number: u64,
}

/// Request to decrypt data with a PIN
#[derive(Debug, Clone, Deserialize)]
pub struct DecryptDataRequest {
    pub data_id: String,
    pub pin: String,
}

/// Response containing decrypted data
#[derive(Debug, Clone, Serialize)]
pub struct DecryptDataResponse {
    pub data_id: String,
    pub label: String,
    pub decrypted_data: String,
    pub timestamp: i64,
}

/// Data listing item (encrypted data metadata without content)
#[derive(Debug, Clone, Serialize)]
pub struct DataListItem {
    pub data_id: String,
    pub label: String,
    pub encrypted: bool,
    pub timestamp: i64,
    pub block_number: u64,
    pub validator: String,
}

/// Response for listing all data
#[derive(Debug, Clone, Serialize)]
pub struct DataListResponse {
    pub data: Vec<DataListItem>,
}

/// Peer information response
#[derive(Debug, Clone, Serialize)]
pub struct PeerInfoResponse {
    pub peers: Vec<String>,
    pub count: usize,
    pub reputation: std::collections::HashMap<String, i32>,
}

/// Generic success message response
#[derive(Debug, Clone, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

/// Generic error response
#[derive(Debug, Clone, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

impl ErrorResponse {
    pub fn new(error: impl ToString) -> Self {
        Self {
            error: error.to_string(),
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self)
            .unwrap_or_else(|_| r#"{"error":"Serialization failed"}"#.to_string())
    }
}

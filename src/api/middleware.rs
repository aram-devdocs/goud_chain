use tiny_http::{Header, Request, Response};

use crate::constants::{HEADER_CONTENT_TYPE, HEADER_VALUE_JSON};

/// Create a CORS preflight response
/// NOTE: CORS headers are handled by nginx load balancer, not application layer
pub fn create_preflight_response() -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string("").with_status_code(204)
}

/// Create a JSON response
pub fn json_response(json: String) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string(json)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap())
}

/// Create an error JSON response with status code
pub fn error_response(json: String, status_code: u16) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string(json)
        .with_status_code(status_code)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap())
}

/// Create a JSON response with custom headers
pub fn json_response_with_headers(
    json: String,
    headers: Vec<(String, String)>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut response = Response::from_string(json)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap());

    for (key, value) in headers {
        if let Ok(header) = Header::from_bytes(key.as_bytes(), value.as_bytes()) {
            response = response.with_header(header);
        }
    }

    response
}

/// Create an error JSON response with status code and custom headers
pub fn error_response_with_headers(
    json: String,
    status_code: u16,
    headers: Vec<(String, String)>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut response = Response::from_string(json)
        .with_status_code(status_code)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap());

    for (key, value) in headers {
        if let Ok(header) = Header::from_bytes(key.as_bytes(), value.as_bytes()) {
            response = response.with_header(header);
        }
    }

    response
}

/// Extract client IP from request headers (X-Real-IP or X-Forwarded-For)
/// Falls back to "unknown" if headers not present
pub fn extract_client_ip(request: &Request) -> String {
    // Try X-Real-IP first (set by nginx)
    if let Some(header) = request
        .headers()
        .iter()
        .find(|h| h.field.as_str().as_str().eq_ignore_ascii_case("x-real-ip"))
    {
        return header.value.as_str().to_string();
    }

    // Try X-Forwarded-For
    if let Some(header) = request.headers().iter().find(|h| {
        h.field
            .as_str()
            .as_str()
            .eq_ignore_ascii_case("x-forwarded-for")
    }) {
        // X-Forwarded-For can contain multiple IPs, take the first one
        let ip_list = header.value.as_str();
        if let Some(first_ip) = ip_list.split(',').next() {
            return first_ip.trim().to_string();
        }
    }

    // Fallback
    "unknown".to_string()
}

/// Verify request signature (Replay Attack Prevention)
/// Format: X-Signature: ts={timestamp},nonce={random},sig={hex}
/// Signature = HMAC-SHA256(api_key, timestamp || nonce || SHA256(body))
pub fn verify_request_signature(
    request: &Request,
    api_key: &[u8],
    body: &str,
    rate_limit_store: &crate::storage::RateLimitStore,
) -> crate::types::Result<()> {
    use crate::constants::{SIGNATURE_HEADER_NAME, SIGNATURE_TIMESTAMP_TOLERANCE_SECONDS};
    use crate::types::GoudChainError;
    use hmac::{Hmac, Mac};
    use sha2::{Digest, Sha256};
    use subtle::ConstantTimeEq;

    // Extract X-Signature header
    let sig_header = request
        .headers()
        .iter()
        .find(|h| {
            h.field
                .as_str()
                .as_str()
                .eq_ignore_ascii_case(SIGNATURE_HEADER_NAME)
        })
        .ok_or_else(|| {
            GoudChainError::InvalidRequestSignature(format!(
                "{} header missing",
                SIGNATURE_HEADER_NAME
            ))
        })?;

    let sig_value = sig_header.value.as_str();

    // Parse header: ts=1234567890,nonce=abc123,sig=hex
    let mut timestamp_str = "";
    let mut nonce = "";
    let mut signature_hex = "";

    for part in sig_value.split(',') {
        let kv: Vec<&str> = part.splitn(2, '=').collect();
        if kv.len() == 2 {
            match kv[0] {
                "ts" => timestamp_str = kv[1],
                "nonce" => nonce = kv[1],
                "sig" => signature_hex = kv[1],
                _ => {}
            }
        }
    }

    if timestamp_str.is_empty() || nonce.is_empty() || signature_hex.is_empty() {
        return Err(GoudChainError::InvalidRequestSignature(
            "Invalid signature format (expected ts=...,nonce=...,sig=...)".to_string(),
        ));
    }

    // Parse timestamp
    let timestamp: i64 = timestamp_str
        .parse()
        .map_err(|_| GoudChainError::InvalidRequestSignature("Invalid timestamp".to_string()))?;

    // Check timestamp tolerance (5 minutes)
    let now = chrono::Utc::now().timestamp();
    let age = now - timestamp;
    if !(-SIGNATURE_TIMESTAMP_TOLERANCE_SECONDS..=SIGNATURE_TIMESTAMP_TOLERANCE_SECONDS)
        .contains(&age)
    {
        return Err(GoudChainError::RequestExpired);
    }

    // Check nonce (replay detection)
    if rate_limit_store.check_nonce(nonce)? {
        return Err(GoudChainError::NonceReused);
    }

    // Compute body hash
    let mut hasher = Sha256::new();
    hasher.update(body.as_bytes());
    let body_hash = hasher.finalize();
    let body_hash_hex = hex::encode(body_hash);

    // Compute expected signature: HMAC-SHA256(api_key, timestamp || nonce || body_hash)
    let message = format!("{}{}{}", timestamp, nonce, body_hash_hex);

    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(api_key)
        .map_err(|e| GoudChainError::Internal(format!("HMAC initialization failed: {}", e)))?;
    mac.update(message.as_bytes());
    let expected_sig = mac.finalize().into_bytes();
    let expected_sig_hex = hex::encode(expected_sig);

    // Constant-time comparison to prevent timing attacks
    let provided_sig_bytes = hex::decode(signature_hex).map_err(|_| {
        GoudChainError::InvalidRequestSignature("Invalid signature hex".to_string())
    })?;

    let expected_sig_bytes = hex::decode(&expected_sig_hex).unwrap();

    if provided_sig_bytes.len() != expected_sig_bytes.len()
        || provided_sig_bytes.ct_eq(&expected_sig_bytes).unwrap_u8() != 1
    {
        return Err(GoudChainError::InvalidRequestSignature(
            "Signature mismatch".to_string(),
        ));
    }

    // Store nonce to prevent replay
    rate_limit_store.store_nonce(nonce)?;

    Ok(())
}

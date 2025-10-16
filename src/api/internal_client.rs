use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::{sleep, Duration};
use tracing::{info, warn};

use crate::types::{GoudChainError, Result};

/// Forward an HTTP request to another node (async)
/// Used when current node is not the PoA validator
pub async fn forward_request_to_node(
    target_node: &str,
    method: &str,
    path: &str,
    body: &str,
    content_type: &str,
) -> Result<(u16, String)> {
    forward_request_with_headers(target_node, method, path, body, content_type, None, None).await
}

/// Forward an HTTP request with optional Authorization and X-Signature headers (async)
/// Used when current node is not the PoA validator
pub async fn forward_request_with_headers(
    target_node: &str,
    method: &str,
    path: &str,
    body: &str,
    content_type: &str,
    auth_header: Option<&str>,
    signature_header: Option<&str>,
) -> Result<(u16, String)> {
    info!(
        target_node = %target_node,
        path = %path,
        "Forwarding request to validator node"
    );

    // Parse target node URL (format: "node_name:port" or "http://hostname:port")
    let target_addr = if target_node.starts_with("http://") {
        target_node.trim_start_matches("http://").to_string()
    } else {
        target_node.to_string()
    };

    // Retry logic for connection with exponential backoff
    use crate::constants::{HTTP_INITIAL_BACKOFF_MS, HTTP_MAX_BACKOFF_MS, HTTP_MAX_RETRIES};

    let mut last_error = None;

    for attempt in 0..HTTP_MAX_RETRIES {
        if attempt > 0 {
            let backoff =
                (HTTP_INITIAL_BACKOFF_MS * 2_u64.pow(attempt - 1)).min(HTTP_MAX_BACKOFF_MS);
            warn!(
                attempt = attempt + 1,
                backoff_ms = backoff,
                "Retrying connection after error"
            );
            sleep(Duration::from_millis(backoff)).await;
        }

        match TcpStream::connect(&target_addr).await {
            Ok(stream) => {
                return perform_http_request(
                    stream,
                    method,
                    path,
                    body,
                    content_type,
                    &target_addr,
                    auth_header,
                    signature_header,
                )
                .await;
            }
            Err(e) => {
                // Check if error is transient
                if e.kind() == std::io::ErrorKind::WouldBlock
                    || e.kind() == std::io::ErrorKind::ConnectionRefused
                {
                    last_error = Some(e);
                    continue;
                }

                // For other errors, fail immediately
                return Err(GoudChainError::PeerConnectionFailed(format!(
                    "Failed to connect to {}: {}",
                    target_addr, e
                )));
            }
        }
    }

    // All retries exhausted
    Err(GoudChainError::PeerConnectionFailed(format!(
        "Failed to connect to {} after {} retries: {}",
        target_addr,
        HTTP_MAX_RETRIES,
        last_error.unwrap()
    )))
}

/// Perform the actual HTTP request over an established TCP stream (async)
#[allow(clippy::too_many_arguments)]
async fn perform_http_request(
    mut stream: TcpStream,
    method: &str,
    path: &str,
    body: &str,
    content_type: &str,
    target_addr: &str,
    auth_header: Option<&str>,
    signature_header: Option<&str>,
) -> Result<(u16, String)> {
    // Build HTTP request with optional Authorization and X-Signature headers
    let auth_line = auth_header
        .map(|h| format!("Authorization: {}\r\n", h))
        .unwrap_or_default();

    let signature_line = signature_header
        .map(|h| format!("X-Signature: {}\r\n", h))
        .unwrap_or_default();

    let request = format!(
        "{} {} HTTP/1.1\r\n\
         Host: {}\r\n\
         Content-Type: {}\r\n\
         Content-Length: {}\r\n\
         {}{}Connection: close\r\n\
         \r\n\
         {}",
        method,
        path,
        target_addr.split(':').next().unwrap_or("localhost"),
        content_type,
        body.len(),
        auth_line,
        signature_line,
        body
    );

    // Send request with timeout
    tokio::time::timeout(
        Duration::from_secs(10),
        stream.write_all(request.as_bytes()),
    )
    .await
    .map_err(|_| GoudChainError::Internal("Write timeout".to_string()))?
    .map_err(GoudChainError::IoError)?;

    // Read response with timeout
    let mut response = String::new();
    tokio::time::timeout(
        Duration::from_secs(30),
        stream.read_to_string(&mut response),
    )
    .await
    .map_err(|_| GoudChainError::Internal("Read timeout".to_string()))?
    .map_err(GoudChainError::IoError)?;

    // Parse HTTP response
    parse_http_response(&response)
}

/// Parse HTTP response to extract status code and body
fn parse_http_response(response: &str) -> Result<(u16, String)> {
    // Split headers and body
    let parts: Vec<&str> = response.splitn(2, "\r\n\r\n").collect();
    if parts.is_empty() {
        return Err(GoudChainError::Internal(
            "Invalid HTTP response: no headers".to_string(),
        ));
    }

    let headers = parts[0];
    let body = parts.get(1).unwrap_or(&"").to_string();

    // Parse status line (e.g., "HTTP/1.1 200 OK")
    let status_line = headers.lines().next().ok_or_else(|| {
        GoudChainError::Internal("Invalid HTTP response: no status line".to_string())
    })?;

    let status_parts: Vec<&str> = status_line.split_whitespace().collect();
    if status_parts.len() < 2 {
        return Err(GoudChainError::Internal(format!(
            "Invalid HTTP status line: {}",
            status_line
        )));
    }

    let status_code = status_parts[1]
        .parse::<u16>()
        .map_err(|e| GoudChainError::Internal(format!("Invalid status code: {}", e)))?;

    Ok((status_code, body))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_http_response() {
        let response = "HTTP/1.1 200 OK\r\n\
                       Content-Type: application/json\r\n\
                       \r\n\
                       {\"status\":\"success\"}";

        let (status, body) = parse_http_response(response).unwrap();
        assert_eq!(status, 200);
        assert_eq!(body, "{\"status\":\"success\"}");
    }

    #[test]
    fn test_parse_http_response_422() {
        let response = "HTTP/1.1 422 Unprocessable Entity\r\n\
                       Content-Type: application/json\r\n\
                       \r\n\
                       {\"error\":\"Not authorized\"}";

        let (status, body) = parse_http_response(response).unwrap();
        assert_eq!(status, 422);
        assert_eq!(body, "{\"error\":\"Not authorized\"}");
    }
}

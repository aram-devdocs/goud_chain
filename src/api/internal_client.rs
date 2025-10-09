use std::io::Read;
use std::net::TcpStream;
use std::time::Duration;
use tracing::info;

use crate::types::{GoudChainError, Result};

/// Forward an HTTP request to another node
/// Used when current node is not the PoA validator
pub fn forward_request_to_node(
    target_node: &str,
    method: &str,
    path: &str,
    body: &str,
    content_type: &str,
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

    // Connect to target node
    let mut stream = TcpStream::connect(&target_addr).map_err(|e| {
        GoudChainError::PeerConnectionFailed(format!("Failed to connect to {}: {}", target_addr, e))
    })?;

    // Set timeouts
    stream
        .set_read_timeout(Some(Duration::from_secs(30)))
        .map_err(GoudChainError::IoError)?;
    stream
        .set_write_timeout(Some(Duration::from_secs(10)))
        .map_err(GoudChainError::IoError)?;

    // Build HTTP request
    let request = format!(
        "{} {} HTTP/1.1\r\n\
         Host: {}\r\n\
         Content-Type: {}\r\n\
         Content-Length: {}\r\n\
         Connection: close\r\n\
         \r\n\
         {}",
        method,
        path,
        target_addr.split(':').next().unwrap_or("localhost"),
        content_type,
        body.len(),
        body
    );

    // Send request
    use std::io::Write;
    stream
        .write_all(request.as_bytes())
        .map_err(GoudChainError::IoError)?;

    // Read response
    let mut response = String::new();
    stream
        .read_to_string(&mut response)
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

/// Get the HTTP address for a validator node
/// Maps validator names (Validator_1, Validator_2) to node addresses
/// Tries environment variable first, then defaults to local service name
pub fn get_validator_node_address(validator_name: &str) -> Result<String> {
    let node_addr = match validator_name {
        "Validator_1" => std::env::var("NODE1_ADDR").unwrap_or_else(|_| "node1:8080".to_string()),
        "Validator_2" => std::env::var("NODE2_ADDR").unwrap_or_else(|_| "node2:8080".to_string()),
        "Validator_3" => std::env::var("NODE3_ADDR").unwrap_or_else(|_| "node3:8080".to_string()),
        _ => {
            return Err(GoudChainError::Internal(format!(
                "Unknown validator: {}",
                validator_name
            )));
        }
    };

    Ok(node_addr)
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

    #[test]
    fn test_get_validator_node_address() {
        assert_eq!(
            get_validator_node_address("Validator_1").unwrap(),
            "node1:8080"
        );
        assert_eq!(
            get_validator_node_address("Validator_2").unwrap(),
            "node2:8080"
        );
        assert!(get_validator_node_address("Unknown").is_err());
    }
}

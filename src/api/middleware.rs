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

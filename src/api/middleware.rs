use tiny_http::{Header, Response};

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

use tiny_http::{Header, Response};

use crate::constants::{
    HEADER_ACCESS_CONTROL_ALLOW_HEADERS, HEADER_ACCESS_CONTROL_ALLOW_METHODS,
    HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, HEADER_CONTENT_TYPE, HEADER_VALUE_HEADERS,
    HEADER_VALUE_JSON, HEADER_VALUE_METHODS, HEADER_VALUE_WILDCARD,
};

/// Add CORS headers to a response
pub fn add_cors_headers<T: std::io::Read>(mut response: Response<T>) -> Response<T> {
    response = response
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, HEADER_VALUE_WILDCARD).unwrap(),
        )
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_METHODS, HEADER_VALUE_METHODS).unwrap(),
        )
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_HEADERS, HEADER_VALUE_HEADERS).unwrap(),
        );
    response
}

/// Create a CORS preflight response
pub fn create_preflight_response() -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string("")
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_ORIGIN, HEADER_VALUE_WILDCARD).unwrap(),
        )
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_METHODS, HEADER_VALUE_METHODS).unwrap(),
        )
        .with_header(
            Header::from_bytes(HEADER_ACCESS_CONTROL_ALLOW_HEADERS, HEADER_VALUE_HEADERS).unwrap(),
        )
}

/// Create a JSON response with CORS headers
pub fn json_response(json: String) -> Response<std::io::Cursor<Vec<u8>>> {
    let response = Response::from_string(json)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap());
    add_cors_headers(response)
}

/// Create an error JSON response with status code and CORS headers
pub fn error_response(json: String, status_code: u16) -> Response<std::io::Cursor<Vec<u8>>> {
    let response = Response::from_string(json)
        .with_status_code(status_code)
        .with_header(Header::from_bytes(HEADER_CONTENT_TYPE, HEADER_VALUE_JSON).unwrap());
    add_cors_headers(response)
}

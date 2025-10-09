pub mod account_handlers;
pub mod auth;
pub mod data_handlers;
pub mod handlers;
pub mod middleware;

// Re-export commonly used functions
pub use handlers::route_request;
pub use middleware::create_preflight_response;

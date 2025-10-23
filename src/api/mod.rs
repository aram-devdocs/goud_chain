use crate::constants::{
    API_SERVER_URL_GCP, API_SERVER_URL_LOCAL, ENVIRONMENT_GCP, ENVIRONMENT_LOCAL,
};
use std::env;
use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::openapi::{Server, ServerBuilder};
use utoipa::{Modify, OpenApi};

pub mod auth;
pub mod internal_client;
pub mod rate_limiter;
pub mod request_signature;
pub mod routes;
pub mod schemas;
pub mod websocket;

// Re-export commonly used functions
pub use rate_limiter::{RateLimitResult, RateLimiter};
pub use websocket::WebSocketBroadcaster;

// OpenAPI tags for route grouping
use routes::{ACCOUNT_TAG, AUDIT_TAG, DATA_TAG, HEALTH_TAG, METRICS_TAG, TEST_TAG};

/// Goud Chain API Documentation
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Goud Chain API",
        version = "0.1.0",
        description = "Encrypted blockchain with API key-based authentication using Proof of Authority (PoA) consensus.\n\n## Features\n- **End-to-End Encryption**: All data encrypted with user's API key\n- **Proof of Authority**: Fast, deterministic block creation with validator rotation\n- **Immutable Storage**: Blockchain-backed tamper-proof data storage\n- **Rate Limiting**: Intelligent rate limiting with progressive penalties\n- **Audit Logging**: Privacy-preserving operational security logs\n- **Real-time Updates**: WebSocket support for live blockchain events\n\n## Authentication\nSupports two authentication methods:\n1. **API Key**: Direct authentication with base64-encoded API key (header: `Authorization: Bearer <api_key>`)\n2. **Session Token**: JWT token obtained from `/account/login` endpoint (header: `Authorization: Bearer <jwt>`)\n\nAPI keys are shown only once during account creation and cannot be recovered.\n\n## WebSocket Real-time Updates\n**Endpoint:** `ws://<server>/ws?token=<api_key>`\n\nConnect to receive real-time event notifications:\n- `blockchain_update` - New block added to chain\n- `collection_update` - New encrypted collection created\n- `peer_update` - P2P network topology changed\n- `metrics_update` - System metrics updated\n- `audit_log_update` - New audit log entry (user-specific)\n\n**Client Messages:**\n- `{\"type\": \"subscribe\", \"event\": \"blockchain_update\"}` - Subscribe to event type\n- `{\"type\": \"unsubscribe\", \"event\": \"blockchain_update\"}` - Unsubscribe from event\n- `{\"type\": \"ping\"}` - Keep-alive ping\n\n**Server Messages:**\n- `{\"type\": \"event\", \"event\": \"blockchain_update\", ...data}` - Event notification\n- `{\"type\": \"pong\"}` - Pong response\n- `{\"type\": \"subscribed\", \"event\": \"...\"}` - Subscription confirmed\n\nAuthentication: Provide base64-encoded API key as `token` query parameter.",
    ),
    modifiers(&ApiModifier),
    tags(
        (name = ACCOUNT_TAG, description = "User account creation and authentication endpoints"),
        (name = DATA_TAG, description = "Encrypted data submission and retrieval operations"),
        (name = HEALTH_TAG, description = "Blockchain health, sync status, and peer management"),
        (name = METRICS_TAG, description = "System metrics, statistics, and monitoring"),
        (name = AUDIT_TAG, description = "Operational security audit logs (privacy-preserving)"),
        (name = TEST_TAG, description = "Test endpoints for demonstrating replay protection")
    )
)]
pub struct ApiDoc;

/// API modifier for security schemes and environment-aware server configuration
struct ApiModifier;

impl Modify for ApiModifier {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        // Configure security schemes
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_token",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .description(Some(
                            "JWT session token obtained from /account/login endpoint. \
                             Expires after 1 hour and provides access to all authenticated endpoints.",
                        ))
                        .build(),
                ),
            );
            components.add_security_scheme(
                "api_key",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .description(Some(
                            "Raw API key for direct authentication (base64-encoded). \
                             Shown only once during account creation. Required for data submission.",
                        ))
                        .build(),
                ),
            );
        }

        // Configure servers based on environment
        let servers = get_api_servers();
        openapi.servers = Some(servers);
    }
}

/// Get API server URLs based on environment
fn get_api_servers() -> Vec<Server> {
    let environment = env::var("ENV").unwrap_or_else(|_| {
        eprintln!(
            "ENV environment variable not set, defaulting to '{}'",
            ENVIRONMENT_GCP
        );
        ENVIRONMENT_GCP.to_string()
    });

    match environment.as_str() {
        ENVIRONMENT_LOCAL => vec![ServerBuilder::new()
            .url(API_SERVER_URL_LOCAL)
            .description(Some("Load balancer (local development)"))
            .build()],
        ENVIRONMENT_GCP => vec![ServerBuilder::new()
            .url(API_SERVER_URL_GCP)
            .description(Some("Development environment"))
            .build()],
        _ => {
            eprintln!(
                "Unknown environment '{}', defaulting to '{}'",
                environment, ENVIRONMENT_GCP
            );
            vec![ServerBuilder::new()
                .url(API_SERVER_URL_GCP)
                .description(Some("Development environment"))
                .build()]
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_api_servers_local_environment() {
        // Set environment to local
        env::set_var("ENV", ENVIRONMENT_LOCAL);

        let servers = get_api_servers();

        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].url, API_SERVER_URL_LOCAL);
        assert_eq!(
            servers[0].description,
            Some("Load balancer (local development)".to_string())
        );

        // Clean up
        env::remove_var("ENV");
    }

    #[test]
    fn test_get_api_servers_gcp_environment() {
        // Set environment to gcp
        env::set_var("ENV", ENVIRONMENT_GCP);

        let servers = get_api_servers();

        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].url, API_SERVER_URL_GCP);
        assert_eq!(
            servers[0].description,
            Some("Development environment".to_string())
        );

        // Clean up
        env::remove_var("ENV");
    }

    #[test]
    fn test_get_api_servers_default_environment() {
        // Ensure ENV is not set
        env::remove_var("ENV");

        let servers = get_api_servers();

        // Should default to GCP
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].url, API_SERVER_URL_GCP);
        assert_eq!(
            servers[0].description,
            Some("Development environment".to_string())
        );
    }

    #[test]
    fn test_get_api_servers_unknown_environment() {
        // Set environment to an unknown value
        env::set_var("ENV", "production");

        let servers = get_api_servers();

        // Should default to GCP
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].url, API_SERVER_URL_GCP);
        assert_eq!(
            servers[0].description,
            Some("Development environment".to_string())
        );

        // Clean up
        env::remove_var("ENV");
    }
}

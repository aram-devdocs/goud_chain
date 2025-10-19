mod api;
mod config;
mod constants;
mod crypto;
mod domain;
mod network;
mod storage;
mod types;

use axum::{
    response::{Html, IntoResponse},
    routing::get,
    Extension, Json, Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;

use api::{ApiDoc, RateLimiter, WebSocketBroadcaster};
use config::Config;
use constants::NONCE_CLEANUP_INTERVAL_SECONDS;
use domain::Block;
use network::P2PNode;
use storage::{
    init_data_directory, load_blockchain, AuditLogger, BlockchainStore, NonceStore, RateLimitStore,
};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = match Config::from_env() {
        Ok(cfg) => Arc::new(cfg),
        Err(e) => {
            error!(error = %e, "Failed to load configuration");
            std::process::exit(1);
        }
    };

    // Initialize data directory
    if let Err(e) = init_data_directory() {
        error!(error = %e, "Failed to initialize data directory");
        std::process::exit(1);
    }

    // Initialize BlockchainStore for persistent blockchain storage
    let blockchain_store = match BlockchainStore::new() {
        Ok(store) => Arc::new(store),
        Err(e) => {
            error!(error = %e, "Failed to initialize BlockchainStore");
            std::process::exit(1);
        }
    };

    // Load or create blockchain from RocksDB
    let blockchain = match load_blockchain(
        config.node_id.clone(),
        config.validator_config.clone(),
        &blockchain_store,
    ) {
        Ok(bc) => Arc::new(RwLock::new(bc)), // Changed from Mutex to RwLock for concurrent reads
        Err(e) => {
            error!(error = %e, "Failed to load blockchain");
            std::process::exit(1);
        }
    };

    // Initialize rate limiting store (reuses same RocksDB instance)
    let rate_limit_store = Arc::new(RateLimitStore::new(blockchain_store.get_db()));

    // Parse bypass whitelist from environment (comma-separated API key hashes)
    let bypass_keys: Vec<String> = std::env::var("RATE_LIMIT_BYPASS_KEYS")
        .unwrap_or_default()
        .split(',')
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.trim().to_string())
        .collect();

    info!(
        bypass_count = bypass_keys.len(),
        "Rate limiting initialized with bypass whitelist"
    );

    let rate_limiter = Arc::new(RateLimiter::new(rate_limit_store, bypass_keys));

    // Initialize nonce store for replay protection (reuses same RocksDB instance)
    let nonce_store = Arc::new(NonceStore::new(blockchain_store.get_db()));
    info!("Nonce store initialized for replay attack prevention");

    // Start background task for periodic nonce cleanup
    let nonce_store_cleanup = Arc::clone(&nonce_store);
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(
            NONCE_CLEANUP_INTERVAL_SECONDS,
        ));
        loop {
            interval.tick().await;
            match nonce_store_cleanup.cleanup_expired_nonces() {
                Ok(deleted) => {
                    if deleted > 0 {
                        info!("Nonce cleanup: removed {} expired entries", deleted);
                    }
                }
                Err(e) => {
                    error!("Nonce cleanup failed: {}", e);
                }
            }
        }
    });

    // Start P2P node (async-first)
    let p2p_node = Arc::new(P2PNode::new(
        Arc::clone(&blockchain),
        Arc::clone(&blockchain_store),
        config.peers.clone(),
    ));

    // Start P2P server in background
    let p2p_clone = Arc::clone(&p2p_node);
    let p2p_port = config.p2p_port;
    tokio::spawn(async move {
        p2p_clone.start_p2p_server(p2p_port).await;
    });

    // Initialize audit logger for operational security
    let p2p_for_audit = Arc::clone(&p2p_node);
    let broadcast_callback = Arc::new(move |block: &Block| {
        let p2p = Arc::clone(&p2p_for_audit);
        let block = block.clone();
        tokio::spawn(async move {
            p2p.broadcast_block(&block).await;
        });
    });

    // Initialize WebSocket broadcaster for real-time updates
    let ws_broadcaster = Arc::new(WebSocketBroadcaster::new());
    info!("WebSocket broadcaster initialized");

    // Create audit event callback for real-time notifications (avoids layer violation)
    let ws_for_audit = Arc::clone(&ws_broadcaster);
    let audit_event_callback = Arc::new(move |event_type, timestamp, collection_id, metadata| {
        let ws = Arc::clone(&ws_for_audit);
        tokio::spawn(async move {
            ws.broadcast_audit_log_update(event_type, timestamp, collection_id, metadata)
                .await;
        });
    });

    let audit_logger = Arc::new(AuditLogger::new(
        Arc::clone(&blockchain),
        Arc::clone(&blockchain_store),
        Some(broadcast_callback),
        Some(audit_event_callback),
    ));
    info!("Audit logger initialized with background flush task and real-time WebSocket updates");

    // Create shared state for handlers
    let submit_data_state = api::schemas::SubmitDataState {
        audit_logger: Arc::clone(&audit_logger),
        ws_broadcaster: Arc::clone(&ws_broadcaster),
    };

    // Build OpenAPI router with all routes organized by module
    let (api_router, api_spec) = OpenApiRouter::with_openapi(ApiDoc::openapi())
        .nest("/account", api::routes::account::router())
        .nest("/data", api::routes::data::router())
        .nest("/audit", api::routes::audit::router())
        .nest("/test", api::routes::test::router())
        .merge(api::routes::health::router())
        .merge(api::routes::metrics::router())
        // Shared state via Extension middleware
        .layer(Extension(blockchain))
        .layer(Extension(p2p_node))
        .layer(Extension(config.clone()))
        .layer(Extension(rate_limiter))
        .layer(Extension(nonce_store))
        .layer(Extension(submit_data_state))
        .layer(Extension(Arc::clone(&ws_broadcaster)))
        .split_for_parts();

    // Convert OpenApiRouter to standard Router
    let api_router = api_router;

    // Create OpenAPI JSON endpoint
    let openapi_spec_clone = api_spec.clone();
    let openapi_route = Router::new().route(
        "/api-docs/openapi.json",
        get(move || async move { Json(openapi_spec_clone.clone()).into_response() }),
    );

    // Create simple HTML page with embedded RapiDoc
    let rapidoc_html = Html(
        r###"
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Goud Chain API Documentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body>
    <rapi-doc
        spec-url="/api-docs/openapi.json"
        theme="dark"
        bg-color="#1a1a1a"
        text-color="#ffffff"
        header-color="#111111"
        primary-color="#4a9eff"
        render-style="read"
        show-header="true"
        show-info="true"
        allow-authentication="true"
        allow-server-selection="true"
        allow-api-list-style-selection="true"
    > </rapi-doc>
</body>
</html>
"###,
    );

    let rapidoc_route = Router::new().route("/rapidoc", get(move || async move { rapidoc_html }));

    // WebSocket route with required extensions
    let ws_route = Router::new()
        .route("/ws", get(api::websocket::handle_websocket_upgrade))
        .layer(Extension(Arc::clone(&ws_broadcaster)))
        .layer(Extension(config.clone()));

    // Merge all routes
    let app = api_router
        .merge(openapi_route)
        .merge(rapidoc_route)
        .merge(ws_route);

    // NOTE: CORS handled by nginx reverse proxy (see nginx/cors.conf)
    // Removed CorsLayer to prevent duplicate Access-Control-Allow-Origin headers

    let bind_addr = config.http_bind_addr();

    info!("\nGoud Chain - Encrypted Blockchain (OpenAPI-Enabled)");
    info!("   Node ID: {}", config.node_id);
    info!("   HTTP API: http://{}", bind_addr);
    info!("   P2P Port: {}", config.p2p_port);
    info!("   Storage: RocksDB (high-performance embedded database)");
    info!("\nAPI Documentation:");
    info!("   RapiDoc UI:   http://{}/rapidoc", bind_addr);
    info!(
        "   OpenAPI Spec: http://{}/api-docs/openapi.json",
        bind_addr
    );
    info!("\nEndpoint Groups:");
    info!("   Account Management - /account/*");
    info!("   Data Operations    - /data/*");
    info!("   Health & Status    - /health, /chain, /peers, /sync");
    info!("   Metrics & Stats    - /metrics, /stats");
    info!("   Audit Logs         - /audit");
    info!("   WebSocket          - /ws\n");

    // Start async HTTP server
    let listener = match tokio::net::TcpListener::bind(&bind_addr).await {
        Ok(l) => l,
        Err(e) => {
            error!(error = %e, "Failed to bind HTTP server");
            std::process::exit(1);
        }
    };

    info!("HTTP server listening on {}", bind_addr);

    // Serve with graceful shutdown
    if let Err(e) = axum::serve(listener, app).await {
        error!(error = %e, "HTTP server error");
        std::process::exit(1);
    }
}

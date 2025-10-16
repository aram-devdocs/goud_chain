mod api;
mod config;
mod constants;
mod crypto;
mod domain;
mod network;
mod storage;
mod types;

use axum::{
    routing::{get, post},
    Extension, Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};

use api::{RateLimiter, WebSocketBroadcaster};
use config::Config;
use domain::Block;
use network::P2PNode;
use storage::{init_data_directory, load_blockchain, AuditLogger, BlockchainStore, RateLimitStore};

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
    let submit_data_state = api::handlers::SubmitDataState {
        audit_logger: Arc::clone(&audit_logger),
        ws_broadcaster: Arc::clone(&ws_broadcaster),
    };

    // Build HTTP router with all endpoints
    let app = Router::new()
        // Account Management
        .route(
            "/account/create",
            post(api::handlers::handle_create_account),
        )
        .route("/account/login", post(api::handlers::handle_login))
        // Data Operations
        .route("/data/submit", post(api::handlers::handle_submit_data))
        .route("/data/list", get(api::handlers::handle_list_data))
        .route(
            "/data/decrypt/:collection_id",
            post(api::handlers::handle_decrypt_data),
        )
        // Blockchain Explorer
        .route("/chain", get(api::handlers::handle_get_chain))
        .route("/peers", get(api::handlers::handle_get_peers))
        .route("/sync", get(api::handlers::handle_sync))
        // Health & Metrics
        .route("/health", get(api::handlers::handle_health))
        .route("/stats", get(api::handlers::handle_get_stats))
        .route("/metrics", get(api::handlers::handle_get_metrics))
        .route(
            "/metrics/prometheus",
            get(api::handlers::handle_get_prometheus_metrics),
        )
        // Validator Info (for load balancer routing)
        .route(
            "/validator/current",
            get(api::handlers::handle_get_current_validator),
        )
        // Audit Logging
        .route("/api/audit", get(api::handlers::handle_get_audit_logs))
        // WebSocket - Real-time event streaming
        .route("/ws", get(api::websocket::handle_websocket_upgrade))
        // Shared state via Extension middleware
        .layer(Extension(blockchain))
        .layer(Extension(p2p_node))
        .layer(Extension(config.clone()))
        .layer(Extension(rate_limiter))
        .layer(Extension(submit_data_state))
        .layer(Extension(ws_broadcaster));

    // NOTE: CORS handled by nginx reverse proxy (see nginx/cors.conf)
    // Removed CorsLayer to prevent duplicate Access-Control-Allow-Origin headers

    let bind_addr = config.http_bind_addr();

    info!("\nGoud Chain - Encrypted Blockchain (Async-First Architecture)");
    info!("   Node ID: {}", config.node_id);
    info!("   HTTP API: http://{}", bind_addr);
    info!("   P2P Port: {}", config.p2p_port);
    info!("   Storage: RocksDB (high-performance embedded database)");
    info!("\nEndpoints:");
    info!("   POST /account/create   - Create new account");
    info!("   POST /account/login    - Login to existing account");
    info!("   POST /data/submit      - Submit encrypted JSON data");
    info!("   GET  /data/list        - List all encrypted data");
    info!("   POST /data/decrypt/:id - Decrypt specific data with API key");
    info!("   GET  /chain            - View full blockchain");
    info!("   GET  /peers            - View P2P peers");
    info!("   GET  /sync             - Manual sync with peers");
    info!("   GET  /health           - Health check");
    info!("   GET  /metrics          - Prometheus metrics\n");

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

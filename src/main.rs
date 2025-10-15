mod api;
mod config;
mod constants;
mod crypto;
mod domain;
mod network;
mod storage;
mod types;

use std::sync::{Arc, Mutex};
use tiny_http::{Method, Server};
use tracing::{error, info};

use api::{create_preflight_response, route_request, RateLimiter};
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
    let blockchain = match load_blockchain(config.node_id.clone(), &blockchain_store) {
        Ok(bc) => Arc::new(Mutex::new(bc)),
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

    // Start P2P node
    let p2p_node = Arc::new(P2PNode::new(
        Arc::clone(&blockchain),
        Arc::clone(&blockchain_store),
        config.peers.clone(),
    ));
    p2p_node.start_p2p_server(config.p2p_port);

    // Initialize audit logger (Phase 4 - Operational Security)
    // Use callback to broadcast blocks without creating circular dependency
    let p2p_for_audit = Arc::clone(&p2p_node);
    let broadcast_callback = Arc::new(move |block: &Block| {
        p2p_for_audit.broadcast_block(block);
    });
    let audit_logger = AuditLogger::new(
        Arc::clone(&blockchain),
        Arc::clone(&blockchain_store),
        Some(broadcast_callback),
    );
    info!("Audit logger initialized with background flush task");

    // Start continuous sync task (initial sync happens in background)
    // NOTE: We start HTTP server immediately to avoid deadlock where all nodes
    // wait for each other to be ready. Initial sync happens asynchronously.
    let p2p_clone = Arc::clone(&p2p_node);
    p2p_clone.start_sync_task();

    // Start HTTP server
    let server = match Server::http(config.http_bind_addr()) {
        Ok(s) => s,
        Err(e) => {
            error!(error = %e, "Failed to start HTTP server");
            std::process::exit(1);
        }
    };

    info!("\n🔗 Goud Chain - Encrypted Blockchain");
    info!("   Node ID: {}", config.node_id);
    info!("   HTTP API: http://{}", config.http_bind_addr());
    info!("   P2P Port: {}", config.p2p_port);
    info!("   Storage: RocksDB (high-performance embedded database)");
    info!("\n📊 Endpoints:");
    info!("   POST /data/submit      - Submit encrypted JSON data");
    info!("   GET  /data/list        - List all encrypted data");
    info!("   POST /data/decrypt     - Decrypt specific data with API key");
    info!("   GET  /chain            - View full blockchain");
    info!("   GET  /peers            - View peers");
    info!("   GET  /sync             - Sync with peers\n");

    // Handle requests
    for request in server.incoming_requests() {
        let blockchain = Arc::clone(&blockchain);
        let p2p = Arc::clone(&p2p_node);
        let config_clone = Arc::clone(&config);
        let rate_limiter_clone = Arc::clone(&rate_limiter);
        let audit_logger_clone = Arc::clone(&audit_logger);

        // Handle OPTIONS preflight requests
        if request.method() == &Method::Options {
            if let Err(e) = request.respond(create_preflight_response()) {
                error!(error = %e, "Failed to respond to OPTIONS request");
            }
            continue;
        }

        // Route and handle request
        route_request(
            request,
            blockchain,
            p2p,
            config_clone,
            rate_limiter_clone,
            audit_logger_clone,
        );
    }
}

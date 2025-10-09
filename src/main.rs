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

use api::{create_preflight_response, route_request};
use config::Config;
use network::P2PNode;
use storage::{init_data_directory, load_blockchain};

fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = match Config::from_env() {
        Ok(cfg) => cfg,
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

    // Load or create blockchain
    let blockchain = match load_blockchain(config.node_id.clone(), config.master_chain_key.clone())
    {
        Ok(bc) => Arc::new(Mutex::new(bc)),
        Err(e) => {
            error!(error = %e, "Failed to load blockchain");
            std::process::exit(1);
        }
    };

    // Start P2P node
    let p2p_node = P2PNode::new(Arc::clone(&blockchain), config.peers.clone());
    p2p_node.start_p2p_server(config.p2p_port);

    // Start continuous sync task (initial sync happens in background)
    // NOTE: We start HTTP server immediately to avoid deadlock where all nodes
    // wait for each other to be ready. Initial sync happens asynchronously.
    let p2p_clone = Arc::new(p2p_node);
    Arc::clone(&p2p_clone).start_sync_task();

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
        let p2p = Arc::clone(&p2p_clone);

        // Handle OPTIONS preflight requests
        if request.method() == &Method::Options {
            if let Err(e) = request.respond(create_preflight_response()) {
                error!(error = %e, "Failed to respond to OPTIONS request");
            }
            continue;
        }

        // Route and handle request
        route_request(request, blockchain, p2p);
    }
}

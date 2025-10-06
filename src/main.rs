use aes_gcm::aead::generic_array::GenericArray;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tiny_http::{Method, Response, Server};
use uuid::Uuid;

const BLOCKCHAIN_FILE: &str = "/data/blockchain.json";

// Compliance audit constants
const CHECKPOINT_INTERVAL: u64 = 100; // Checkpoint every 100 blocks

// Proof of Authority validators
const VALIDATORS: [&str; 3] = ["Validator_1", "Validator_2", "Validator_3"];

// Helper function to get current validator based on block number
fn get_current_validator(block_number: u64) -> String {
    let index = (block_number % VALIDATORS.len() as u64) as usize;
    VALIDATORS[index].to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct EncryptedData {
    data_id: String,           // Unique data ID
    label: String,             // Public label/description (optional, visible to all)
    encrypted_payload: String, // Base64 encoded ciphertext (encrypted JSON)
    encryption_hint: String,   // SHA256 hash of PIN for verification
    timestamp: i64,
    signature: String,
    public_key: String,
}

impl EncryptedData {
    // Derive 32-byte key from PIN using SHA-256
    fn derive_key_from_pin(pin: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(pin.as_bytes());
        hasher.update(b"goud_chain_salt_v1"); // Add salt
        let result = hasher.finalize();
        let mut key = [0u8; 32];
        key.copy_from_slice(&result);
        key
    }

    // Hash PIN for verification (without decrypting)
    fn hash_pin(pin: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(pin.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    // Encrypt JSON data with PIN
    fn encrypt_data(json_data: &str, pin: &str) -> String {
        let key_bytes = Self::derive_key_from_pin(pin);
        let key = GenericArray::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);

        // Generate random nonce
        let nonce_bytes: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt
        let ciphertext = cipher
            .encrypt(nonce, json_data.as_bytes())
            .expect("Encryption failed");

        // Combine nonce + ciphertext and encode as base64
        let mut combined = nonce_bytes.to_vec();
        combined.extend_from_slice(&ciphertext);
        general_purpose::STANDARD.encode(combined)
    }

    // Decrypt data with PIN
    fn decrypt_data(&self, pin: &str) -> Option<String> {
        // Verify PIN hash first
        if Self::hash_pin(pin) != self.encryption_hint {
            return None;
        }

        let key_bytes = Self::derive_key_from_pin(pin);
        let key = GenericArray::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);

        // Decode base64
        let combined = general_purpose::STANDARD
            .decode(&self.encrypted_payload)
            .ok()?;
        if combined.len() < 12 {
            return None;
        }

        // Split nonce and ciphertext
        let (nonce_bytes, ciphertext) = combined.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        // Decrypt
        let plaintext = cipher.decrypt(nonce, ciphertext).ok()?;
        String::from_utf8(plaintext).ok()
    }

    // Create new encrypted data entry
    fn new(label: String, json_data: String, pin: &str, signing_key: &SigningKey) -> Self {
        let data_id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp();
        let public_key = hex::encode(signing_key.verifying_key().to_bytes());

        // Encrypt the JSON data
        let encrypted_payload = Self::encrypt_data(&json_data, pin);
        let encryption_hint = Self::hash_pin(pin);

        // Create message to sign
        let message = format!("{}{}{}{}", data_id, label, encrypted_payload, timestamp);
        let signature = signing_key.sign(message.as_bytes());

        EncryptedData {
            data_id,
            label,
            encrypted_payload,
            encryption_hint,
            timestamp,
            signature: hex::encode(signature.to_bytes()),
            public_key,
        }
    }

    // Verify signature
    fn verify(&self) -> bool {
        let message = format!(
            "{}{}{}{}",
            self.data_id, self.label, self.encrypted_payload, self.timestamp
        );

        match hex::decode(&self.public_key) {
            Ok(pk_bytes) => {
                if let Ok(pk_array) = pk_bytes.try_into() {
                    if let Ok(verifying_key) = VerifyingKey::from_bytes(&pk_array) {
                        if let Ok(sig_bytes) = hex::decode(&self.signature) {
                            if let Ok(sig_array) = sig_bytes.try_into() {
                                let signature = Signature::from_bytes(&sig_array);
                                return verifying_key
                                    .verify(message.as_bytes(), &signature)
                                    .is_ok();
                            }
                        }
                    }
                }
            }
            Err(_) => return false,
        }
        false
    }

    // Hash for merkle tree
    fn hash(&self) -> String {
        let content = format!(
            "{}{}{}",
            self.data_id, self.encrypted_payload, self.timestamp
        );
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Block {
    index: u64,
    timestamp: i64,
    encrypted_data: Vec<EncryptedData>,
    previous_hash: String,
    merkle_root: String,
    hash: String,
    validator: String,
}

impl Block {
    fn new(
        index: u64,
        encrypted_data: Vec<EncryptedData>,
        previous_hash: String,
        validator: String,
    ) -> Self {
        let timestamp = Utc::now().timestamp();
        let merkle_root = Self::calculate_merkle_root(&encrypted_data);

        let mut block = Block {
            index,
            timestamp,
            encrypted_data,
            previous_hash,
            merkle_root,
            hash: String::new(),
            validator,
        };

        // No mining - just calculate hash instantly
        block.hash = block.calculate_hash();
        block
    }

    fn calculate_merkle_root(encrypted_data: &[EncryptedData]) -> String {
        if encrypted_data.is_empty() {
            return String::from("0");
        }

        let mut hashes: Vec<String> = encrypted_data.iter().map(|d| d.hash()).collect();

        while hashes.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in hashes.chunks(2) {
                let combined = if chunk.len() == 2 {
                    format!("{}{}", chunk[0], chunk[1])
                } else {
                    chunk[0].clone()
                };
                let mut hasher = Sha256::new();
                hasher.update(combined.as_bytes());
                next_level.push(format!("{:x}", hasher.finalize()));
            }
            hashes = next_level;
        }

        hashes[0].clone()
    }

    fn calculate_hash(&self) -> String {
        let content = format!(
            "{}{}{}{}{}",
            self.index, self.timestamp, self.merkle_root, self.previous_hash, self.validator
        );
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Blockchain {
    chain: Vec<Block>,
    node_id: String,
    checkpoints: Vec<String>, // Hashes of checkpoint blocks
    #[serde(skip)]
    pending_data: Vec<EncryptedData>,
    #[serde(skip)]
    node_signing_key: Option<SigningKey>, // For signing data
}

impl Blockchain {
    fn new(node_id: String) -> Self {
        // Create genesis data entry
        let signing_key = SigningKey::from_bytes(&rand::random::<[u8; 32]>());
        let genesis_data = EncryptedData::new(
            "Genesis Block".to_string(),
            "{\"message\": \"Goud Chain initialized\", \"timestamp\": \"2025-01-01\"}".to_string(),
            "0000", // Genesis PIN
            &signing_key,
        );

        let validator = get_current_validator(0);
        let mut genesis = Block {
            index: 0,
            timestamp: Utc::now().timestamp(),
            encrypted_data: vec![genesis_data],
            previous_hash: "0".to_string(),
            merkle_root: String::new(),
            hash: String::new(),
            validator,
        };
        genesis.merkle_root = Block::calculate_merkle_root(&genesis.encrypted_data);
        genesis.hash = genesis.calculate_hash();

        Blockchain {
            chain: vec![genesis],
            node_id,
            checkpoints: Vec::new(),
            pending_data: Vec::new(),
            node_signing_key: Some(signing_key),
        }
    }

    fn get_latest_block(&self) -> &Block {
        self.chain.last().unwrap()
    }

    fn add_block(&mut self) -> Option<Block> {
        if self.pending_data.is_empty() {
            println!("⚠️  No pending data to add to block");
            return None;
        }

        let previous_block = self.get_latest_block();
        let block_number = previous_block.index + 1;
        let validator = get_current_validator(block_number);

        // Create block instantly (no mining)
        let new_block = Block::new(
            block_number,
            self.pending_data.clone(),
            previous_block.hash.clone(),
            validator,
        );

        println!(
            "✅ Block {} created by {} in <1s",
            block_number, new_block.validator
        );

        self.chain.push(new_block.clone());
        self.pending_data.clear();

        // Create checkpoint
        if new_block.index % CHECKPOINT_INTERVAL == 0 {
            self.checkpoints.push(new_block.hash.clone());
            println!("🔒 Checkpoint created at block {}", new_block.index);
        }

        Some(new_block)
    }

    fn add_encrypted_data(&mut self, data: EncryptedData) -> bool {
        if !data.verify() {
            println!("❌ Invalid encrypted data signature");
            return false;
        }

        self.pending_data.push(data);
        true
    }

    fn is_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current = &self.chain[i];
            let previous = &self.chain[i - 1];

            // Validate hash
            if current.hash != current.calculate_hash() {
                println!("❌ Invalid hash at block {}", i);
                return false;
            }

            // Validate chain link
            if current.previous_hash != previous.hash {
                println!("❌ Broken chain at block {}", i);
                return false;
            }

            // Validate timestamp
            let now = Utc::now().timestamp();
            if current.timestamp > now + 120 {
                println!("❌ Block {} timestamp in future", i);
                return false;
            }
            if current.timestamp < previous.timestamp {
                println!("❌ Block {} timestamp before previous block", i);
                return false;
            }

            // Validate merkle root
            if current.merkle_root != Block::calculate_merkle_root(&current.encrypted_data) {
                println!("❌ Invalid merkle root at block {}", i);
                return false;
            }

            // Validate all encrypted data entries
            for data in &current.encrypted_data {
                if !data.verify() {
                    println!("❌ Invalid encrypted data signature at block {}", i);
                    return false;
                }
            }

            // Validate validator authorization
            let expected_validator = get_current_validator(current.index);
            if current.validator != expected_validator {
                println!(
                    "❌ Invalid validator at block {}: expected {}, got {}",
                    i, expected_validator, current.validator
                );
                return false;
            }
        }
        true
    }

    fn replace_chain(&mut self, new_chain: Vec<Block>) -> bool {
        // Don't reorganize past checkpoints
        if let Some(last_checkpoint_hash) = self.checkpoints.last() {
            if let Some(checkpoint_block) =
                self.chain.iter().find(|b| &b.hash == last_checkpoint_hash)
            {
                // Check if new chain tries to reorganize past checkpoint
                if new_chain.len() <= checkpoint_block.index as usize {
                    println!("🔒 Rejected: Chain reorganization blocked by checkpoint");
                    return false;
                }
            }
        }

        let temp_blockchain = Blockchain {
            chain: new_chain.clone(),
            node_id: self.node_id.clone(),
            checkpoints: self.checkpoints.clone(),
            pending_data: Vec::new(),
            node_signing_key: None,
        };

        // Use chain length (longest chain wins in PoA)
        if new_chain.len() > self.chain.len() && temp_blockchain.is_valid() {
            println!(
                "🔄 Replacing chain (length: {} > {})",
                new_chain.len(),
                self.chain.len()
            );
            self.chain = new_chain;
            return true;
        }
        false
    }

    fn save_to_disk(&self) {
        if let Ok(json) = serde_json::to_string_pretty(self) {
            if let Ok(mut file) = fs::File::create(BLOCKCHAIN_FILE) {
                file.write_all(json.as_bytes()).ok();
                println!("💾 Blockchain saved to disk");
            }
        }
    }

    fn load_from_disk(node_id: String) -> Self {
        if let Ok(content) = fs::read_to_string(BLOCKCHAIN_FILE) {
            if let Ok(mut blockchain) = serde_json::from_str::<Blockchain>(&content) {
                blockchain.node_id = node_id;
                blockchain.pending_data = Vec::new();
                blockchain.node_signing_key =
                    Some(SigningKey::from_bytes(&rand::random::<[u8; 32]>()));
                println!(
                    "📂 Blockchain loaded from disk (length: {} blocks)",
                    blockchain.chain.len()
                );
                return blockchain;
            }
        }
        println!("📝 Creating new blockchain");
        Blockchain::new(node_id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum P2PMessage {
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewData(EncryptedData),
}

#[derive(Deserialize)]
struct SubmitDataRequest {
    label: String,
    data: String,
    pin: String,
}

#[derive(Deserialize)]
struct DecryptDataRequest {
    data_id: String,
    pin: String,
}

struct P2PNode {
    peers: Arc<Mutex<Vec<String>>>,
    blockchain: Arc<Mutex<Blockchain>>,
    peer_reputation: Arc<Mutex<HashMap<String, i32>>>, // Track peer reputation
}

impl P2PNode {
    fn new(blockchain: Arc<Mutex<Blockchain>>) -> Self {
        let peers = Arc::new(Mutex::new(Vec::new()));

        if let Ok(peer_urls) = env::var("PEERS") {
            let peer_list: Vec<String> = peer_urls
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            if !peer_list.is_empty() {
                *peers.lock().unwrap() = peer_list.clone();
                println!("🌐 Configured peers: {:?}", peer_list);
            }
        }

        P2PNode {
            peers,
            blockchain,
            peer_reputation: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn broadcast_block(&self, block: &Block) {
        let message = P2PMessage::NewBlock(block.clone());
        let peers = self.peers.lock().unwrap().clone();

        for peer in peers {
            let msg = message.clone();
            thread::spawn(move || {
                if let Ok(encoded) = bincode::serialize(&msg) {
                    if let Ok(mut stream) = TcpStream::connect(&peer) {
                        stream.write_all(&encoded).ok();
                        println!("📡 Broadcast block to {}", peer);
                    }
                }
            });
        }
    }

    fn request_chain_from_peers(&self) {
        let peers = self.peers.lock().unwrap().clone();
        let blockchain = Arc::clone(&self.blockchain);
        let reputation = Arc::clone(&self.peer_reputation);

        for peer in peers {
            let bc = Arc::clone(&blockchain);
            let rep = Arc::clone(&reputation);
            thread::spawn(move || {
                let message = P2PMessage::RequestChain;
                if let Ok(encoded) = bincode::serialize(&message) {
                    if let Ok(mut stream) = TcpStream::connect(&peer) {
                        stream.write_all(&encoded).ok();

                        let mut buffer = Vec::new();
                        if stream.read_to_end(&mut buffer).is_ok() {
                            if let Ok(P2PMessage::ResponseChain(chain)) =
                                bincode::deserialize(&buffer)
                            {
                                let mut bc = bc.lock().unwrap();
                                if bc.replace_chain(chain) {
                                    bc.save_to_disk();
                                    // Good peer - increase reputation
                                    let mut r = rep.lock().unwrap();
                                    *r.entry(peer.clone()).or_insert(0) += 1;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    fn start_p2p_server(&self, port: u16) {
        let blockchain = Arc::clone(&self.blockchain);
        let reputation = Arc::clone(&self.peer_reputation);

        thread::spawn(move || {
            use std::net::TcpListener;

            if let Ok(listener) = TcpListener::bind(format!("0.0.0.0:{}", port)) {
                println!("🔗 P2P server listening on port {}", port);

                for mut stream in listener.incoming().flatten() {
                    let bc = Arc::clone(&blockchain);
                    let rep = Arc::clone(&reputation);
                    let peer_addr = stream
                        .peer_addr()
                        .ok()
                        .map(|a| a.to_string())
                        .unwrap_or_default();

                    thread::spawn(move || {
                        let mut buffer = Vec::new();
                        if stream.read_to_end(&mut buffer).is_ok() {
                            if let Ok(message) = bincode::deserialize::<P2PMessage>(&buffer) {
                                match message {
                                    P2PMessage::NewBlock(block) => {
                                        let mut blockchain = bc.lock().unwrap();
                                        if block.index == blockchain.get_latest_block().index + 1 {
                                            // Validate block before accepting
                                            if block.hash == block.calculate_hash() {
                                                blockchain.chain.push(block);
                                                blockchain.save_to_disk();
                                                println!("📥 Received and added valid block from network");

                                                // Good peer
                                                let mut r = rep.lock().unwrap();
                                                *r.entry(peer_addr.clone()).or_insert(0) += 1;
                                            } else {
                                                println!(
                                                    "❌ Rejected invalid block from {}",
                                                    peer_addr
                                                );
                                                // Bad peer - decrease reputation
                                                let mut r = rep.lock().unwrap();
                                                *r.entry(peer_addr).or_insert(0) -= 5;
                                            }
                                        }
                                    }
                                    P2PMessage::NewData(data) => {
                                        let mut blockchain = bc.lock().unwrap();
                                        if blockchain.add_encrypted_data(data) {
                                            println!("📥 Received valid encrypted data");
                                        }
                                    }
                                    P2PMessage::RequestChain => {
                                        let blockchain = bc.lock().unwrap();
                                        let response =
                                            P2PMessage::ResponseChain(blockchain.chain.clone());
                                        if let Ok(encoded) = bincode::serialize(&response) {
                                            stream.write_all(&encoded).ok();
                                        }
                                    }
                                    _ => {}
                                }
                            }
                        }
                    });
                }
            }
        });
    }
}

fn main() {
    let node_id = env::var("NODE_ID").unwrap_or_else(|_| Uuid::new_v4().to_string());
    let http_port = env::var("HTTP_PORT").unwrap_or_else(|_| "8080".to_string());
    let p2p_port: u16 = env::var("P2P_PORT")
        .unwrap_or_else(|_| "9000".to_string())
        .parse()
        .unwrap();

    fs::create_dir_all("/data").ok();

    let blockchain = Arc::new(Mutex::new(Blockchain::load_from_disk(node_id.clone())));

    let p2p_node = P2PNode::new(Arc::clone(&blockchain));
    p2p_node.start_p2p_server(p2p_port);

    let p2p_clone = Arc::new(p2p_node);
    let sync_node = Arc::clone(&p2p_clone);
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        sync_node.request_chain_from_peers();
    });

    let server = Server::http(format!("0.0.0.0:{}", http_port)).expect("Failed to start server");

    println!("\n🔗 Goud Chain - Encrypted Blockchain");
    println!("   Node ID: {}", node_id);
    println!("   HTTP API: http://0.0.0.0:{}", http_port);
    println!("   P2P Port: {}", p2p_port);
    println!("\n📊 Endpoints:");
    println!("   POST /data/submit      - Submit encrypted JSON data");
    println!("   GET  /data/list        - List all encrypted data");
    println!("   POST /data/decrypt     - Decrypt specific data with PIN");
    println!("   GET  /chain            - View full blockchain");
    println!("   GET  /peers            - View peers\n");

    for mut request in server.incoming_requests() {
        let blockchain = Arc::clone(&blockchain);
        let p2p = Arc::clone(&p2p_clone);

        let add_cors_headers = |mut response: Response<std::io::Cursor<Vec<u8>>>| {
            response = response
                .with_header(
                    tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..])
                        .unwrap(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(
                        &b"Access-Control-Allow-Methods"[..],
                        &b"GET, POST, OPTIONS"[..],
                    )
                    .unwrap(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(
                        &b"Access-Control-Allow-Headers"[..],
                        &b"Content-Type"[..],
                    )
                    .unwrap(),
                );
            response
        };

        if request.method() == &Method::Options {
            let response = Response::from_string("")
                .with_header(
                    tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..])
                        .unwrap(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(
                        &b"Access-Control-Allow-Methods"[..],
                        &b"GET, POST, OPTIONS"[..],
                    )
                    .unwrap(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(
                        &b"Access-Control-Allow-Headers"[..],
                        &b"Content-Type"[..],
                    )
                    .unwrap(),
                );
            request.respond(response).ok();
            continue;
        }

        match (request.method(), request.url()) {
            (Method::Post, "/data/submit") => {
                let mut content = String::new();
                request.as_reader().read_to_string(&mut content).ok();

                if let Ok(req) = serde_json::from_str::<SubmitDataRequest>(&content) {
                    // Get node signing key
                    let blockchain_guard = blockchain.lock().unwrap();
                    let signing_key = blockchain_guard.node_signing_key.clone();
                    drop(blockchain_guard);

                    if let Some(key) = signing_key {
                        // Create encrypted data entry
                        let data_entry = EncryptedData::new(req.label, req.data, &req.pin, &key);

                        let data_id = data_entry.data_id.clone();

                        // Add to blockchain
                        let mut blockchain = blockchain.lock().unwrap();
                        if blockchain.add_encrypted_data(data_entry.clone()) {
                            // Create block instantly
                            if let Some(block) = blockchain.add_block() {
                                blockchain.save_to_disk();
                                drop(blockchain);

                                // Broadcast to peers
                                p2p.broadcast_block(&block);

                                let response = Response::from_string(
                                    serde_json::json!({
                                        "message": "Data encrypted and stored successfully",
                                        "data_id": data_id,
                                        "block_number": block.index
                                    })
                                    .to_string(),
                                )
                                .with_header(
                                    tiny_http::Header::from_bytes(
                                        &b"Content-Type"[..],
                                        &b"application/json"[..],
                                    )
                                    .unwrap(),
                                );
                                request.respond(add_cors_headers(response)).ok();
                            }
                        } else {
                            let response = Response::from_string(
                                serde_json::json!({"error": "Failed to add data"}).to_string(),
                            )
                            .with_status_code(400)
                            .with_header(
                                tiny_http::Header::from_bytes(
                                    &b"Content-Type"[..],
                                    &b"application/json"[..],
                                )
                                .unwrap(),
                            );
                            request.respond(add_cors_headers(response)).ok();
                        }
                    }
                } else {
                    let response = Response::from_string(
                        serde_json::json!({"error": "Invalid request"}).to_string(),
                    )
                    .with_status_code(400)
                    .with_header(
                        tiny_http::Header::from_bytes(
                            &b"Content-Type"[..],
                            &b"application/json"[..],
                        )
                        .unwrap(),
                    );
                    request.respond(add_cors_headers(response)).ok();
                }
            }

            (Method::Get, "/data/list") => {
                let blockchain = blockchain.lock().unwrap();
                let mut all_data = Vec::new();

                for block in &blockchain.chain {
                    for data in &block.encrypted_data {
                        all_data.push(serde_json::json!({
                            "data_id": data.data_id,
                            "label": data.label,
                            "encrypted": true,
                            "timestamp": data.timestamp,
                            "block_number": block.index,
                            "validator": block.validator
                        }));
                    }
                }

                let response =
                    Response::from_string(serde_json::json!({"data": all_data}).to_string())
                        .with_header(
                            tiny_http::Header::from_bytes(
                                &b"Content-Type"[..],
                                &b"application/json"[..],
                            )
                            .unwrap(),
                        );
                request.respond(add_cors_headers(response)).ok();
            }

            (Method::Post, "/data/decrypt") => {
                let mut content = String::new();
                request.as_reader().read_to_string(&mut content).ok();

                if let Ok(req) = serde_json::from_str::<DecryptDataRequest>(&content) {
                    let blockchain = blockchain.lock().unwrap();

                    // Find the data
                    let mut found_data: Option<EncryptedData> = None;
                    for block in &blockchain.chain {
                        for data in &block.encrypted_data {
                            if data.data_id == req.data_id {
                                found_data = Some(data.clone());
                                break;
                            }
                        }
                    }

                    if let Some(data) = found_data {
                        if let Some(decrypted) = data.decrypt_data(&req.pin) {
                            let response = Response::from_string(
                                serde_json::json!({
                                    "data_id": data.data_id,
                                    "label": data.label,
                                    "decrypted_data": decrypted,
                                    "timestamp": data.timestamp
                                })
                                .to_string(),
                            )
                            .with_header(
                                tiny_http::Header::from_bytes(
                                    &b"Content-Type"[..],
                                    &b"application/json"[..],
                                )
                                .unwrap(),
                            );
                            request.respond(add_cors_headers(response)).ok();
                        } else {
                            let response = Response::from_string(
                                serde_json::json!({"error": "Invalid PIN or access denied"})
                                    .to_string(),
                            )
                            .with_status_code(403)
                            .with_header(
                                tiny_http::Header::from_bytes(
                                    &b"Content-Type"[..],
                                    &b"application/json"[..],
                                )
                                .unwrap(),
                            );
                            request.respond(add_cors_headers(response)).ok();
                        }
                    } else {
                        let response = Response::from_string(
                            serde_json::json!({"error": "Data not found"}).to_string(),
                        )
                        .with_status_code(404)
                        .with_header(
                            tiny_http::Header::from_bytes(
                                &b"Content-Type"[..],
                                &b"application/json"[..],
                            )
                            .unwrap(),
                        );
                        request.respond(add_cors_headers(response)).ok();
                    }
                }
            }

            (Method::Get, "/chain") => {
                let chain = blockchain.lock().unwrap();
                let json = serde_json::to_string_pretty(&*chain).unwrap();
                let response = Response::from_string(json).with_header(
                    tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..])
                        .unwrap(),
                );
                request.respond(add_cors_headers(response)).ok();
            }

            (Method::Get, "/peers") => {
                let peers = p2p.peers.lock().unwrap().clone();
                let reputation = p2p.peer_reputation.lock().unwrap();

                let response = Response::from_string(
                    serde_json::json!({
                        "peers": peers,
                        "count": peers.len(),
                        "reputation": *reputation
                    })
                    .to_string(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..])
                        .unwrap(),
                );
                request.respond(add_cors_headers(response)).ok();
            }

            (Method::Get, "/sync") => {
                p2p.request_chain_from_peers();
                let response = Response::from_string(
                    serde_json::json!({"message": "Syncing with peers..."}).to_string(),
                )
                .with_header(
                    tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..])
                        .unwrap(),
                );
                request.respond(add_cors_headers(response)).ok();
            }

            _ => {
                let response =
                    Response::from_string(serde_json::json!({"error": "Not found"}).to_string())
                        .with_status_code(404)
                        .with_header(
                            tiny_http::Header::from_bytes(
                                &b"Content-Type"[..],
                                &b"application/json"[..],
                            )
                            .unwrap(),
                        );
                request.respond(add_cors_headers(response)).ok();
            }
        }
    }
}

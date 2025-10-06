# Goud Chain

Encrypted blockchain with PIN-based access control. Store any JSON data on an immutable, distributed ledger.

## Features

- **No Mining** - Instant blocks (<1s) using Proof of Authority
- **AES-256-GCM Encryption** - PIN-based symmetric encryption
- **Proof of Authority** - 3 validators rotate block creation
- **Ed25519 Signatures** - Cryptographic verification
- **Merkle Trees** - Tamper detection
- **JSON Storage** - Store any valid JSON object

## Quick Start

```bash
./run              # Start 3-node network (production)
./run dev          # Start with hot reload (development)
```

Open [http://localhost:8080](http://localhost:8080)

**Available nodes:**
- Node 1: http://localhost:8081
- Node 2: http://localhost:8082
- Node 3: http://localhost:8083

## Architecture

```
JSON Data → Encrypt (AES-256-GCM + PIN) → Sign (Ed25519) → Block (Validator) → Blockchain
```

**Consensus:** Proof of Authority (PoA)
- 3 validators: `Validator_1`, `Validator_2`, `Validator_3`
- Round-robin rotation per block
- Deterministic validator selection

**Block Structure:**
```rust
Block {
    index: u64,
    timestamp: i64,
    encrypted_data: Vec<EncryptedData>,
    previous_hash: String,
    merkle_root: String,
    hash: String,
    validator: String,
}
```

**Encrypted Data:**
```rust
EncryptedData {
    data_id: String,
    label: String,              // Public
    encrypted_payload: String,  // Encrypted JSON
    encryption_hint: String,    // SHA256(PIN)
    timestamp: i64,
    signature: String,          // Ed25519
    public_key: String,
}
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/data/submit` | Submit encrypted data |
| `GET` | `/data/list` | List all data entries |
| `POST` | `/data/decrypt` | Decrypt with PIN |
| `GET` | `/chain` | View blockchain |
| `GET` | `/peers` | View P2P peers |

### Submit Data

```bash
curl -X POST http://localhost:8081/data/submit \
  -H "Content-Type: application/json" \
  -d '{
    "label": "API Keys",
    "data": "{\"api_key\": \"abc123\"}",
    "pin": "1234"
  }'
```

Response:
```json
{
  "message": "Data encrypted and stored successfully",
  "data_id": "550e8400-e29b-41d4-a716-446655440000",
  "block_number": 1
}
```

### Decrypt Data

```bash
curl -X POST http://localhost:8081/data/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data_id": "550e8400-e29b-41d4-a716-446655440000",
    "pin": "1234"
  }'
```

Response:
```json
{
  "data_id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "API Keys",
  "decrypted_data": "{\"api_key\": \"abc123\"}",
  "timestamp": 1704672000
}
```

## Web UI

**3 Tabs:**

1. **Submit Data**
   - Form Builder: Add key-value pairs dynamically
   - Raw JSON: Paste JSON directly
   - Live JSON validation
   - PIN encryption

2. **Encrypted Data**
   - List all entries
   - Decrypt with PIN
   - Pretty-printed JSON output

3. **Blockchain Explorer**
   - View all blocks
   - Hashes, validators, timestamps
   - Expandable block details

## Security

| Component | Implementation |
|-----------|----------------|
| Encryption | AES-256-GCM with random nonce |
| Key Derivation | SHA-256(PIN + salt) |
| Signatures | Ed25519 |
| Merkle Trees | SHA-256 |
| PIN Verification | Hash check before decrypt |
| Validator Auth | Deterministic rotation |

**Encryption Flow:**
```
1. PIN → SHA-256 → 32-byte key
2. Random 12-byte nonce
3. AES-256-GCM(data, key, nonce) → ciphertext
4. Base64(nonce + ciphertext) → encrypted_payload
5. SHA-256(PIN) → encryption_hint (for verification)
```

**Decryption Flow:**
```
1. Verify SHA-256(PIN) == encryption_hint
2. Base64 decode → (nonce + ciphertext)
3. AES-256-GCM decrypt → plaintext
```

## Development

**Prerequisites:**
- Rust 1.83+
- Docker & Docker Compose

**Build:**
```bash
cargo build --release
```

**Test:**
```bash
cargo test
cargo clippy
```

**Run:**
```bash
cargo run
```

**Docker Commands:**
```bash
./run start        # Production mode
./run dev          # Development mode with hot reload
./run logs node1   # View logs
./run stop         # Stop network
./run clean        # Remove data
./run help         # Show all commands
```

**Hot Reload (Dev Mode):**
- Dashboard: Changes to `dashboard/index.html` auto-reload
- Blockchain: Changes to `src/` auto-recompile and restart
- Uses `nodemon` for dashboard, `cargo-watch` for Rust code

## Module Architecture

Goud Chain follows a **clean, layered architecture** with **zero circular dependencies**:

![Module Dependency Graph](docs/module-structure.png)

### Layer Structure

```
Layer 0: Foundation     → constants, types
Layer 1: Utilities      → crypto, config
Layer 2: Business Logic → domain
Layer 3: Persistence    → storage
Layer 4: Network/P2P    → network
Layer 5: Presentation   → api
Entry Point             → main
```

**Dependency Rules:**
- ✅ Modules can only depend on **lower layers**
- ✅ No circular dependencies (enforced by tests)
- ✅ Foundation layer has **zero** internal dependencies

**Module Responsibilities:**

| Module | Purpose | Dependencies |
|--------|---------|--------------|
| **constants** | Magic numbers, strings, config values | None |
| **types** | Error types, API request/response types | None |
| **crypto** | Encryption, signatures, key derivation | constants, types |
| **config** | Environment variable configuration | constants |
| **domain** | Block, Blockchain, EncryptedData | constants, crypto, types |
| **storage** | File persistence, load/save blockchain | constants, crypto, domain, types |
| **network** | P2P messaging, peer management | constants, domain, storage, types |
| **api** | HTTP handlers, middleware, routing | All modules |
| **main** | Entry point, orchestration | api, config, network, storage |

### Automated Quality Checks

Every commit automatically:
1. ✅ **Tests for circular dependencies** - Prevents architectural decay
2. ✅ **Validates layer hierarchy** - Enforces clean architecture
3. ✅ **Regenerates dependency graph** - Visual documentation always up-to-date

See [`tests/module_dependencies.rs`](tests/module_dependencies.rs) for implementation.

## Project Structure

```
goud_chain/
├── src/
│   ├── main.rs              # Entry point (94 lines)
│   ├── config.rs            # Configuration management
│   ├── constants.rs         # All magic numbers/strings
│   ├── types/               # Error & API types
│   │   ├── mod.rs
│   │   ├── errors.rs        # Custom error enum
│   │   └── api.rs           # Request/response types
│   ├── crypto/              # Encryption & signatures
│   │   ├── mod.rs
│   │   ├── encryption.rs    # AES-256-GCM
│   │   └── signature.rs     # Ed25519
│   ├── domain/              # Business logic
│   │   ├── mod.rs
│   │   ├── encrypted_data.rs
│   │   ├── block.rs
│   │   └── blockchain.rs
│   ├── storage/             # Persistence layer
│   │   └── mod.rs
│   ├── network/             # P2P networking
│   │   ├── mod.rs
│   │   ├── messages.rs
│   │   └── p2p.rs
│   └── api/                 # HTTP API
│       ├── mod.rs
│       ├── handlers.rs
│       └── middleware.rs
├── tests/
│   └── module_dependencies.rs  # Circular dependency prevention
├── scripts/
│   └── generate_module_graph.sh  # Auto-generate dependency PNG
├── docs/
│   ├── module-structure.png     # Generated dependency graph
│   └── module-structure.dot     # GraphViz source
├── dashboard/
│   ├── index.html           # Web UI (~520 lines)
│   ├── server.js            # Dashboard server
│   ├── package.json         # Node dependencies
│   └── Dockerfile           # Dashboard image
├── docker-compose.yml       # 3-node network (production)
├── docker-compose.dev.yml   # Hot reload overrides (development)
├── Dockerfile               # Rust build (production)
├── Dockerfile.dev           # Rust build with cargo-watch (development)
├── run                      # CLI script
└── README.md                # This file
```

## Tech Stack

- **Rust** - Core blockchain
- **AES-GCM** - Encryption (aes-gcm crate)
- **Ed25519** - Signatures (ed25519-dalek)
- **SHA-256** - Hashing (sha2)
- **JSON** - Serialization (serde_json)
- **HTTP** - API (tiny_http)
- **AlpineJS** - Web UI reactivity
- **TailwindCSS** - Web UI styling

## P2P Networking

**Message Types:**
```rust
enum P2PMessage {
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewData(EncryptedData),
}
```

**Peer Discovery:**
- Environment variable: `PEERS=node2:9000,node3:9000`
- Automatic chain sync on startup
- Block broadcasting on creation

**Chain Validation:**
- Longest chain wins
- Merkle root verification
- Validator authorization checks
- Timestamp validation
- Signature verification

## Configuration

**Environment Variables:**
```bash
NODE_ID=node1              # Node identifier
HTTP_PORT=8081             # API server port
P2P_PORT=9000              # P2P network port
PEERS=node2:9000           # Comma-separated peers
```

**Docker Compose:**
```yaml
node1:
  ports: ["8081:8080", "9001:9000"]
  environment:
    - HTTP_PORT=8080
    - P2P_PORT=9000
    - PEERS=node2:9000,node3:9000
```

## License

MIT

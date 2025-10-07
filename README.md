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

**🚀 Primary API Endpoint:** [http://localhost:8080](http://localhost:8080) (Load Balancer)

**🌐 Dashboard:** [http://localhost:3000](http://localhost:3000)

**📡 Individual Nodes (for debugging):**
- Node 1: http://localhost:8081
- Node 2: http://localhost:8082
- Node 3: http://localhost:8083

> **Note for Developers:** Always use the load balancer endpoint (`http://localhost:8080`) for all API calls. It automatically routes requests to healthy nodes and provides failover capabilities.

## Architecture

### Network Topology

```
                    Developers
                        ↓
            ┌───────────────────────┐
            │  NGINX Load Balancer  │  ← Single API Endpoint (Port 8080)
            │  - Health checks      │
            │  - Failover           │
            │  - Request routing    │
            └───────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    ┌───────┐      ┌───────┐      ┌───────┐
    │ node1 │◄────►│ node2 │◄────►│ node3 │
    │ :8081 │  P2P │ :8082 │  P2P │ :8083 │
    └───────┘      └───────┘      └───────┘
```

**Load Balancer Features:**
- **Automatic Failover** - Routes around unhealthy nodes
- **Health Checks** - Monitors node availability and chain state
- **Intelligent Routing**:
  - Read operations (`GET /data/list`, `/chain`, `/peers`) → Round-robin across all nodes
  - Write operations (`POST /data/submit`, `/data/decrypt`) → Least-connections routing
- **Connection Pooling** - Reuses connections for better performance
- **CORS Support** - Browser-friendly API access

### Data Flow

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

**Base URL:** `http://localhost:8080` (Load Balancer)

| Method | Endpoint | Description | Routing Strategy |
|--------|----------|-------------|------------------|
| `POST` | `/data/submit` | Submit encrypted data | Least-connections |
| `GET` | `/data/list` | List all data entries | Round-robin |
| `POST` | `/data/decrypt` | Decrypt with PIN | Least-connections |
| `GET` | `/chain` | View blockchain | Round-robin |
| `GET` | `/peers` | View P2P peers | Round-robin |
| `GET` | `/health` | Node health check | Any healthy node |
| `GET` | `/lb/health` | Load balancer health | Load balancer only |
| `GET` | `/lb/status` | NGINX statistics | Load balancer only |

### Submit Data

```bash
curl -X POST http://localhost:8080/data/submit \
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
curl -X POST http://localhost:8080/data/decrypt \
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
./run start         # Production mode
./run dev           # Development mode with hot reload
./run status        # Check load balancer and all nodes
./run lb-status     # Detailed load balancer metrics
./run logs nginx    # View load balancer logs
./run logs node1    # View node logs
./run stop          # Stop network
./run clean         # Remove data
./run help          # Show all commands
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

## Load Balancer & Deployment

### NGINX Load Balancer

Goud Chain uses **NGINX** as a reverse proxy and load balancer to provide a single, reliable API endpoint for all blockchain operations.

**Key Benefits:**
- **Single Entry Point** - Developers only need to know one URL: `http://localhost:8080`
- **High Availability** - Automatic failover if nodes go down (tested with node failures)
- **Performance** - Connection pooling, intelligent routing, and caching headers
- **Monitoring** - Built-in health checks and request metrics

**Routing Strategy:**

| Operation Type | Strategy | Reason |
|----------------|----------|--------|
| **Read** (`GET /data/list`, `/chain`, `/peers`) | Round-robin | Distribute load evenly, any node has full chain |
| **Write** (`POST /data/submit`, `/data/decrypt`) | Least-connections | Route to node with fewest active connections |
| **Health checks** | Passive monitoring | Mark nodes as down after 3 failures in 30s |

**Health Monitoring:**

```bash
# Check overall system status
./run status

# Get detailed NGINX metrics
./run lb-status

# Output example:
# Active connections: 12
# Requests handled: 1,543
# Reading/Writing/Waiting: 0/1/11
```

### Deployment Architecture

**Local Development:**
```
Load Balancer (nginx:alpine) → 3 Blockchain Nodes (Rust + Docker)
                              → Dashboard (Node.js + Alpine.js)
```

**AWS Deployment (Terraform-ready):**
```
AWS ALB/NLB
    ↓
ECS/Fargate Tasks (3+ blockchain nodes)
    ↓
EFS for persistent blockchain data
```

**Docker Services:**
- `nginx` - Load balancer (port 8080)
- `node1`, `node2`, `node3` - Blockchain nodes (ports 8081-8083 for debugging)
- `dashboard` - Web UI (port 3000)

All services run on a shared Docker bridge network for internal communication, with only the load balancer and dashboard exposed externally.

### Scaling Considerations

**Horizontal Scaling:**
- Add more blockchain nodes to `docker-compose.yml`
- Update NGINX upstream pool with new nodes
- Update `PEERS` environment variable for P2P discovery

**Vertical Scaling:**
- Increase container CPU/memory limits
- Adjust NGINX worker processes and connections
- Tune Rust compilation for target architecture

**Production Hardening:**
- Remove individual node port mappings (8081-8083) to prevent direct access
- Enable HTTPS/TLS on load balancer with valid certificates
- Implement rate limiting and DDoS protection at load balancer level
- Add authentication/authorization layer for write operations
- Use AWS Secrets Manager or HashiCorp Vault for cryptographic keys

## Project Structure

```
goud_chain/
├── src/
│   ├── main.rs              # Entry point
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
│       ├── handlers.rs      # Includes /health endpoint
│       └── middleware.rs
├── nginx/
│   └── nginx.conf           # Load balancer configuration
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
├── docker-compose.yml       # Network with load balancer
├── docker-compose.dev.yml   # Hot reload overrides
├── Dockerfile               # Rust build (production)
├── Dockerfile.dev           # Rust build with cargo-watch (dev)
├── run                      # CLI script with lb-status command
└── README.md                # This file
```

## Tech Stack

- **Rust** - Core blockchain implementation
- **NGINX** - Load balancer and reverse proxy
- **Docker & Docker Compose** - Containerization and orchestration
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

## Cloud Deployment (Oracle Cloud)

### Prerequisites

1. Oracle Cloud account with $300 trial credits or always-free tier
2. OCI CLI configured with API keys
3. SSH key pair for VM access
4. GitHub repository secrets configured (for CI/CD)

### Manual Deployment

**1. Configure Terraform variables:**
```bash
# Create terraform/environments/dev/terraform.tfvars
tenancy_ocid     = "ocid1.tenancy.oc1..."
user_ocid        = "ocid1.user.oc1..."
fingerprint      = "ab:cd:ef:..."
private_key_path = "~/.oci/oci_api_key.pem"
region           = "us-ashburn-1"
ssh_public_key   = "ssh-rsa AAAAB3..."

environment            = "dev"
blockchain_node_count  = 2
instance_shape         = "VM.Standard.E2.1"  # x86 instances
instance_ocpus         = 1
instance_memory_gb     = 8
boot_volume_size_gb    = 50
block_volume_size_gb   = 50

allowed_ssh_cidrs      = ["0.0.0.0/0"]
allowed_http_cidrs     = ["0.0.0.0/0"]
enable_monitoring      = false
enable_redis           = true
backup_retention_days  = 7

tags = {
  Project     = "goud-chain"
  Environment = "dev"
  ManagedBy   = "terraform"
}
```

**2. Deploy infrastructure and application:**
```bash
./scripts/deploy.sh
```

**3. Destroy all resources:**
```bash
./scripts/destroy.sh
```

### Automated Deployment (GitHub Actions)

**Setup GitHub Secrets:**
```
OCI_TENANCY_OCID
OCI_USER_OCID
OCI_FINGERPRINT
OCI_PRIVATE_KEY
OCI_REGION
SSH_PUBLIC_KEY
SSH_PRIVATE_KEY
```

**Automatic deployment triggers:**
- Push to `main` branch → Full deploy
- Manual trigger → Via GitHub Actions UI

**Deployment workflow:**
1. Build multi-arch Docker images → Push to Oracle Container Registry
2. Terraform plan & apply → Provision infrastructure
3. Deploy containers → SSH to VMs and start services
4. Health checks → Verify deployment success

### Infrastructure

**Cost:** ~$15/month (covered by $300 trial credits for ~20 months)

**Resources:**
- 2× VM.Standard.E2.1 (x86, 1 vCPU, 8GB RAM each)
- 2× 50GB boot volumes
- 2× 50GB block volumes (blockchain data)
- 1× VCN with public subnet
- Load balancer (nginx on VM1)

**Public Access:**
- Load Balancer API: `http://<VM1_IP>:8080`
- Dashboard: `http://<VM1_IP>:3000`

## License

MIT

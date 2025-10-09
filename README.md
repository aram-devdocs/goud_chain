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

## Cloud Deployment (Google Cloud Platform)

**Cost: FREE** - Runs on GCP's Always Free tier (1x e2-micro instance)

### Prerequisites

1. Google Cloud account (free tier available)
2. `gcloud` CLI installed
3. `terraform` CLI installed
4. `gh` CLI (for GitHub secrets setup)
5. Cloudflare account (optional, for custom domain)

### Quick Start

**Option A: Automated Setup Script**

```bash
# Run the guided setup script (creates GCP project, service account, generates configs)
./scripts/setup-gcp.sh

# Deploy infrastructure + application
./scripts/deploy.sh
```

**Option B: Manual Setup**

**1. Install Prerequisites:**
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# Install GitHub CLI (for secrets management)
brew install gh  # macOS
gh auth login
```

**2. Setup GCP Project:**
```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Create a new project (or use existing)
gcloud projects create goud-chain-12345 --set-as-default
PROJECT_ID=$(gcloud config get-value project)

# Enable required APIs
gcloud services enable compute.googleapis.com

# Create service account for Terraform
gcloud iam service-accounts create goud-chain-terraform \
  --display-name="Goud Chain Terraform Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:goud-chain-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:goud-chain-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Generate service account key
mkdir -p ~/.gcloud
gcloud iam service-accounts keys create ~/.gcloud/goud-chain-terraform-key.json \
  --iam-account="goud-chain-terraform@${PROJECT_ID}.iam.gserviceaccount.com"
```

**3. Generate SSH Keys:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/goud_chain_rsa -N "" -C "goud-chain-gcp"
```

**4. Create Terraform Configuration:**
```bash
cat > terraform/environments/dev/terraform.tfvars <<EOF
# GCP Configuration
project_id    = "your-gcp-project-id"
region        = "us-central1"
zone          = "us-central1-a"

# Environment
environment   = "dev"
project_name  = "goud-chain"

# Compute (FREE tier)
machine_type      = "e2-micro"
boot_disk_size_gb = 30

# SSH Access
ssh_username   = "ubuntu"
ssh_public_key = "$(cat ~/.ssh/goud_chain_rsa.pub)"

# Network Security
allowed_ssh_cidrs  = ["0.0.0.0/0"]
allowed_http_cidrs = ["0.0.0.0/0"]

# DNS (optional - Cloudflare)
enable_dns              = false  # Set to true if using custom domain
domain_name             = "goudchain.com"
cloudflare_api_token    = ""
cloudflare_zone_id      = ""
enable_cloudflare_proxy = false

# Tags
tags = {
  project     = "goud-chain"
  environment = "dev"
  managed_by  = "terraform"
}
EOF
```

**5. Deploy:**
```bash
./scripts/deploy.sh
```

### Automated Deployment (GitHub Actions)

**Setup GitHub Secrets:**
```bash
# Use the automated script
./scripts/setup-secrets.sh

# Or manually via gh CLI:
gh secret set GCP_PROJECT_ID
gh secret set GCP_SERVICE_ACCOUNT_KEY < ~/.gcloud/goud-chain-terraform-key.json
gh secret set SSH_PUBLIC_KEY < ~/.ssh/goud_chain_rsa.pub
gh secret set SSH_PRIVATE_KEY < ~/.ssh/goud_chain_rsa
gh secret set CLOUDFLARE_API_TOKEN  # Optional
gh secret set CLOUDFLARE_ZONE_ID    # Optional
```

**Deployment Triggers:**
- Push to `main` branch → Automatic deployment
- Manual trigger → GitHub Actions UI → "Deploy Dev" workflow

**Workflow Steps:**
1. Authenticate to GCP using service account key
2. Terraform plan & apply → Provision e2-micro instance
3. Wait for VM startup (Docker installation via cloud-init)
4. Clone repository and deploy Docker containers
5. Health checks → Verify all services are running

### Infrastructure Details

**Cost: $0/month** (GCP Always Free tier)

**Resources:**
- 1× e2-micro instance (0.25-2 vCPU bursting, 1GB RAM)
- 30GB standard persistent disk
- Default VPC + firewall rules
- Cloudflare DNS (optional, also free)

**Architecture:**
- **Single VM deployment** - All services run as Docker containers
- 2 blockchain nodes (reduced for 1GB RAM constraint)
- 1 nginx load balancer
- 1 dashboard web UI
- P2P networking between containers via Docker bridge network

**What's Running:**
```
VM: e2-micro (1GB RAM)
├── nginx:alpine (~64MB)
├── dashboard (~128MB)
├── node1 (goud-chain) (~384MB)
└── node2 (goud-chain) (~384MB)
```

**Public Access:**
- API Endpoint: `http://<INSTANCE_IP>:8080`
- Dashboard: `http://<INSTANCE_IP>:3000`
- Individual Nodes (debug): `http://<INSTANCE_IP>:8081`, `:8082`

**With Cloudflare DNS:**
- API: `https://dev-api.goudchain.com`
- Dashboard: `https://dev-dashboard.goudchain.com`

### Management Commands

**Deploy:**
```bash
./scripts/deploy.sh
```

**Destroy:**
```bash
./scripts/destroy.sh
```

**SSH to instance:**
```bash
ssh ubuntu@<INSTANCE_IP>

# View container logs
cd /opt/goud-chain
docker-compose -f docker-compose.gcp.yml logs -f

# Restart services
docker-compose -f docker-compose.gcp.yml restart

# View container status
docker-compose -f docker-compose.gcp.yml ps
```

**Health Checks:**
```bash
# Load balancer
curl http://<INSTANCE_IP>:8080/lb/health

# Blockchain API
curl http://<INSTANCE_IP>:8080/health

# View chain
curl http://<INSTANCE_IP>:8080/chain
```

### GCP Free Tier Limits

**Always Free (no expiration):**
- 1× e2-micro instance per month (us-west1, us-central1, or us-east1)
- 30 GB standard persistent disk
- 1 GB egress per month (excluding China & Australia)
- 5 GB snapshot storage

**After 12-month trial ($300 credits):**
- Still FREE if you stay within the Always Free limits
- No automatic charges (billing account required but won't be charged)

### Troubleshooting

**VM not accessible:**
```bash
# Check firewall rules
gcloud compute firewall-rules list

# Check instance status
gcloud compute instances list

# View instance logs
gcloud compute instances get-serial-port-output goud-chain-dev-vm
```

**Docker not starting:**
```bash
ssh ubuntu@<INSTANCE_IP>
sudo systemctl status docker
sudo systemctl start docker
sudo journalctl -u docker -f
```

**Out of memory:**
```bash
# Check memory usage
ssh ubuntu@<INSTANCE_IP> "free -h"

# Restart containers to free memory
docker-compose -f docker-compose.gcp.yml restart
```

### Cloudflare DNS Setup (Optional)

**1. Get your Zone ID:**
- Login to Cloudflare Dashboard
- Select your domain → Overview
- Copy "Zone ID" from the right sidebar

**2. Create API Token:**
- Profile → API Tokens → Create Token
- Template: "Edit zone DNS"
- Zone Resources: Include → Specific zone → your domain
- Copy the generated token

**3. Add to terraform.tfvars:**
```hcl
enable_dns              = true
domain_name             = "goudchain.com"
cloudflare_api_token    = "your-api-token"
cloudflare_zone_id      = "your-zone-id"
enable_cloudflare_proxy = true
```

**4. Configure SSL/TLS:**
- Cloudflare Dashboard → SSL/TLS → Overview
- Set encryption mode to "Flexible"
- (Optional) Enable "Always Use HTTPS"

**5. Redeploy:**
```bash
./scripts/deploy.sh
```

DNS records will be created automatically:
- `dev-api.goudchain.com` → VM IP
- `dev-dashboard.goudchain.com` → VM IP

### Production Considerations

**For production deployments:**
1. **Security:**
   - Restrict `allowed_ssh_cidrs` to your IP only
   - Restrict `allowed_http_cidrs` to known clients
   - Enable Cloudflare proxy for DDoS protection
   - Implement authentication for write operations

2. **Scaling:**
   - Upgrade to e2-small or e2-medium for better performance
   - Add monitoring (Stackdriver)
   - Implement automated backups
   - Use Cloud SQL for persistent metadata

3. **Cost:**
   - e2-small: ~$13/month
   - e2-medium: ~$27/month
   - Still much cheaper than Oracle Cloud (~$15/month) or other providers

## License

MIT

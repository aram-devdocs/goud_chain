# Goud Chain

Encrypted blockchain with PIN-based access control. Store any JSON data on an immutable, distributed ledger using Proof of Authority consensus.

## Features

- **No Mining** - Instant blocks (<1s) using Proof of Authority
- **AES-256-GCM Encryption** - PIN-based symmetric encryption
- **Proof of Authority** - 2 validators rotate block creation
- **Ed25519 Signatures** - Cryptographic verification
- **Merkle Trees** - Tamper detection
- **JSON Storage** - Store any valid JSON object
- **Load Balanced** - NGINX reverse proxy with health checks
- **Cloud-Native** - Runs on GCP free tier ($0/month)

## Quick Start (Local Development)

```bash
./run              # Start 3-node network (production mode)
./run dev          # Start with hot reload (development mode)
```

**🚀 Primary API Endpoint:** [http://localhost:8080](http://localhost:8080) (Load Balancer)

**🌐 Dashboard:** [http://localhost:3000](http://localhost:3000)

**📡 Individual Nodes (for debugging):**
- Node 1: http://localhost:8081
- Node 2: http://localhost:8082
- Node 3: http://localhost:8083

> **Note:** Always use the load balancer endpoint (`http://localhost:8080`) for all API calls. It provides automatic failover and intelligent routing.

## Architecture

### Local Development (3 nodes)

```
                    Developers
                        ↓
            ┌───────────────────────┐
            │  NGINX Load Balancer  │  ← Port 8080
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

### GCP Production (2 nodes, single VM)

```
                 Cloudflare CDN
                 (HTTPS, Port 443)
                        ↓
            dev-api.goudchain.com
            dev-dashboard.goudchain.com
                        ↓
        ┌───────────────────────────────┐
        │   GCP e2-micro VM (1GB RAM)   │
        │                               │
        │   ┌─────────────────┐         │
        │   │ NGINX (Port 80) │         │
        │   └────────┬─────────┘         │
        │            │                   │
        │    ┌───────┼───────┐           │
        │    ↓       ↓       ↓           │
        │  node1   node2  dashboard      │
        │  :8081   :8082   :3000         │
        │    ↕──P2P──↕                   │
        └───────────────────────────────┘
```

**Load Balancer Features:**
- Automatic failover to healthy nodes
- Health checks (monitors chain state and node availability)
- Intelligent routing:
  - **Read operations** (`GET /data/list`, `/chain`, `/peers`) → Round-robin
  - **Write operations** (`POST /data/submit`, `/data/decrypt`) → Least-connections
- Connection pooling for performance
- CORS support for browser access

### Data Flow

```
JSON Data → Encrypt (AES-256-GCM + PIN) → Sign (Ed25519) → Block (Validator) → Blockchain
```

**Consensus:** Proof of Authority (PoA)
- Validators: `Validator_1`, `Validator_2`
- Deterministic round-robin rotation per block
- No mining, instant block creation

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
    label: String,              // Public metadata
    encrypted_payload: String,  // Encrypted JSON
    encryption_hint: String,    // SHA256(PIN) for verification
    timestamp: i64,
    signature: String,          // Ed25519 signature
    public_key: String,
}
```

## API Reference

### Submit Encrypted Data

```bash
curl -X POST http://localhost:8080/data/submit \
  -H "Content-Type: application/json" \
  -d '{
    "label": "my-data",
    "pin": "1234",
    "data": {"key": "value"}
  }'

# Response:
{
  "data_id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "my-data",
  "timestamp": 1704067200,
  "signature": "abc123...",
  "public_key": "def456..."
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

# Response:
{
  "data_id": "550e8400-e29b-41d4-a716-446655440000",
  "label": "my-data",
  "data": {"key": "value"},
  "timestamp": 1704067200
}
```

### List All Data

```bash
curl http://localhost:8080/data/list

# Response:
[
  {
    "data_id": "550e8400-e29b-41d4-a716-446655440000",
    "label": "my-data",
    "timestamp": 1704067200
  }
]
```

### View Blockchain

```bash
curl http://localhost:8080/chain

# Response:
{
  "chain": [
    {
      "index": 0,
      "timestamp": 1704067200,
      "encrypted_data": [],
      "previous_hash": "0",
      "merkle_root": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "hash": "abc123...",
      "validator": "Genesis"
    }
  ],
  "length": 1
}
```

### Health Check

```bash
curl http://localhost:8080/health

# Response:
{
  "status": "healthy",
  "chain_length": 1,
  "latest_block": 0,
  "node_id": "node1",
  "peer_count": 1
}
```

### Load Balancer Status

```bash
curl http://localhost:8080/lb/health

# Response:
{
  "status": "healthy",
  "service": "goud_chain_lb",
  "nodes": 2,
  "platform": "gcp"
}
```

## Cloud Deployment (Google Cloud Platform)

**Cost:** **$0/month** - Runs on GCP's Always Free tier

**Live Demo:**
- API: https://dev-api.goudchain.com
- Dashboard: https://dev-dashboard.goudchain.com

### Prerequisites

1. **Google Cloud Account** - [Sign up](https://cloud.google.com/free) (free tier, no credit card required)
2. **gcloud CLI** - [Install guide](https://cloud.google.com/sdk/docs/install)
3. **Terraform** - `brew install terraform` (macOS) or [download](https://www.terraform.io/downloads)
4. **Cloudflare Account** - [Sign up](https://cloudflare.com) (optional, for custom domain)

### Quick Start

**Step 1: Run setup script**
```bash
./scripts/setup-gcp.sh
```

This interactive script will:
- Guide you through GCP project creation
- Create a service account for Terraform
- Generate SSH keys
- Create `terraform/environments/dev/terraform.tfvars`

**Step 2: Deploy**
```bash
./scripts/deploy.sh
```

This will:
- Provision a GCP e2-micro instance (FREE tier)
- Configure firewall rules
- Create Cloudflare DNS records (if configured)
- Deploy Docker containers
- Run health checks

**Step 3: Configure Cloudflare SSL (if using custom domain)**
1. Go to Cloudflare Dashboard → SSL/TLS → Overview
2. Set encryption mode to **"Flexible"**
3. Wait 2-5 minutes for DNS propagation

**Done!** Your blockchain is now live.

### What Gets Deployed

**GCP Resources (all FREE tier):**
- 1× e2-micro VM (0.25-2 vCPU bursting, 1GB RAM)
- 30GB standard persistent disk
- Default VPC with firewall rules:
  - Port 22 (SSH)
  - Port 80 (HTTP - Cloudflare proxy)
  - Port 8080 (API - direct access)
  - Port 3000 (Dashboard - direct access)

**Docker Containers on VM:**
```
e2-micro (1GB RAM)
├── nginx:alpine        (~64MB)  - Load balancer + routing
├── dashboard           (~128MB) - Web UI
├── node1 (goud-chain)  (~384MB) - Blockchain node
└── node2 (goud-chain)  (~384MB) - Blockchain node
```

**Access Points:**
- **Direct IP**: `http://<VM_IP>:8080` (API), `http://<VM_IP>:3000` (Dashboard)
- **With Cloudflare**: `https://dev-api.goudchain.com`, `https://dev-dashboard.goudchain.com`

### Management Commands

**Deploy/Update:**
```bash
./scripts/deploy.sh
```

**Destroy Infrastructure:**
```bash
./scripts/destroy.sh
```

**SSH to VM:**
```bash
ssh ubuntu@<VM_IP>
```

**View Logs:**
```bash
ssh ubuntu@<VM_IP> 'cd /opt/goud-chain && docker-compose -f docker-compose.gcp.yml logs -f'
```

**Restart Services:**
```bash
ssh ubuntu@<VM_IP> 'cd /opt/goud-chain && docker-compose -f docker-compose.gcp.yml restart'
```

**Check Container Status:**
```bash
ssh ubuntu@<VM_IP> 'cd /opt/goud-chain && docker-compose -f docker-compose.gcp.yml ps'
```

### Cloudflare DNS Setup (Optional)

**1. Get your Zone ID and API Token:**
- Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Select your domain → Overview
- Copy "Zone ID" from the right sidebar
- Create API Token: Profile → API Tokens → Create Token
  - Template: "Edit zone DNS"
  - Zone Resources: Include → Specific zone → your domain
  - Copy the generated token

**2. Add to `terraform/environments/dev/terraform.tfvars`:**
```hcl
enable_dns              = true
domain_name             = "goudchain.com"
cloudflare_api_token    = "your-api-token"
cloudflare_zone_id      = "your-zone-id"
enable_cloudflare_proxy = true
dashboard_subdomain     = "dashboard"
api_subdomain           = "api"
```

**3. Configure SSL/TLS in Cloudflare:**
- Go to SSL/TLS → Overview
- Set encryption mode to **"Flexible"**
  - Visitor ↔ Cloudflare: **HTTPS** (encrypted)
  - Cloudflare ↔ Your server: **HTTP** (unencrypted, but over Cloudflare's network)
- (Optional) Enable "Always Use HTTPS"

**4. Redeploy:**
```bash
./scripts/deploy.sh
```

DNS records will be created automatically:
- `dev-api.goudchain.com` → VM IP
- `dev-dashboard.goudchain.com` → VM IP

### GitHub Actions (CI/CD)

**Setup GitHub Secrets:**
```bash
# Automated (recommended)
./scripts/setup-secrets.sh

# Or manually
gh secret set GCP_PROJECT_ID
gh secret set GCP_SERVICE_ACCOUNT_KEY < ~/.gcloud/goud-chain-terraform-key.json
gh secret set SSH_PUBLIC_KEY < ~/.ssh/goud_chain_rsa.pub
gh secret set SSH_PRIVATE_KEY < ~/.ssh/goud_chain_rsa
gh secret set CLOUDFLARE_API_TOKEN  # Optional
gh secret set CLOUDFLARE_ZONE_ID    # Optional
```

**Deployment Triggers:**
- Push to `main` → Automatic deployment
- Manual → GitHub Actions UI → "Deploy Dev" workflow

### Troubleshooting

**"Web server is down" with Cloudflare:**
- Ensure nginx is listening on port 80 (check `docker-compose.gcp.yml` has `"80:80"`)
- Verify Cloudflare SSL mode is set to "Flexible"
- Check firewall allows port 80: `gcloud compute firewall-rules list`

**Dashboard shows API responses:**
- Nginx config must have separate `server` blocks for different domains
- Check `nginx/nginx.gcp.conf` has `server_name dev-dashboard.goudchain.com`

**VM not accessible:**
```bash
# Check instance status
gcloud compute instances list

# Check firewall rules
gcloud compute firewall-rules list

# View startup logs
gcloud compute instances get-serial-port-output goud-chain-dev-vm
```

**Docker not starting:**
```bash
ssh ubuntu@<VM_IP>
sudo systemctl status docker
sudo systemctl start docker
sudo journalctl -u docker -f
```

**Out of memory (e2-micro has only 1GB):**
```bash
# Check memory usage
ssh ubuntu@<VM_IP> "free -h"

# Restart containers
ssh ubuntu@<VM_IP> 'cd /opt/goud-chain && docker-compose -f docker-compose.gcp.yml restart'
```

### GCP Free Tier Limits

**Always Free (no expiration):**
- 1× e2-micro instance per month (us-west1, us-central1, or us-east1)
- 30 GB standard persistent disk
- 1 GB egress per month (excluding China & Australia)
- 5 GB snapshot storage

**After 12-month trial ($300 credits):**
- Still FREE if you stay within Always Free limits
- No automatic charges (billing account required but won't be charged unless you manually upgrade)

### Production Considerations

**Security:**
- Restrict `allowed_ssh_cidrs` to your IP only
- Restrict `allowed_http_cidrs` to known clients
- Enable Cloudflare proxy for DDoS protection
- Implement authentication for write operations
- Rotate service account keys every 90 days

**Scaling:**
- Upgrade to e2-small (2GB RAM, ~$13/month) for 3+ nodes
- Upgrade to e2-medium (4GB RAM, ~$27/month) for 4+ nodes
- Add monitoring with Google Cloud Monitoring
- Implement automated backups
- Use remote state backend (already configured in `terraform/environments/dev/main.tf`)

**Cost Comparison:**
- e2-micro: $0/month (free tier)
- e2-small: ~$13/month
- e2-medium: ~$27/month
- Still cheaper than most cloud providers!

## Local Development

### Running Tests

```bash
cargo test
cargo clippy
cargo fmt -- --check
```

### Running with Hot Reload

```bash
./run dev
```

This starts the blockchain with `cargo-watch` for automatic recompilation on file changes.

### Project Structure

```
goud_chain/
├── src/
│   ├── main.rs                 # Entry point
│   ├── constants.rs            # Configuration constants
│   ├── crypto/
│   │   ├── encryption.rs       # AES-256-GCM encryption
│   │   ├── signature.rs        # Ed25519 signatures
│   │   └── hashing.rs          # SHA-256 hashing
│   ├── domain/
│   │   ├── blockchain.rs       # Blockchain logic
│   │   ├── block.rs            # Block structure
│   │   └── encrypted_data.rs   # Encrypted data model
│   ├── network/
│   │   └── p2p.rs              # Peer-to-peer networking
│   ├── persistence/
│   │   └── file_storage.rs     # Blockchain persistence
│   ├── presentation/
│   │   └── http_api.rs         # HTTP API server
│   └── utility/
│       └── config.rs           # Configuration loading
├── tests/
│   └── module_dependencies.rs  # Circular dependency prevention
├── scripts/
│   ├── setup-gcp.sh                    # GCP project setup
│   ├── deploy.sh                       # Deploy to GCP
│   ├── destroy.sh                      # Destroy GCP resources
│   ├── setup-terraform-backend.sh      # Create GCS bucket for Terraform state
│   └── generate_module_graph.sh        # Dependency visualization
├── nginx/
│   ├── nginx.conf              # Load balancer (local, 3 nodes)
│   └── nginx.gcp.conf          # Load balancer (GCP, 2 nodes)
├── dashboard/
│   ├── index.html              # Web UI
│   ├── server.js               # Dashboard server
│   └── Dockerfile              # Dashboard container
├── terraform/
│   ├── main.tf                 # Root Terraform module
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── modules/
│   │   ├── compute/            # GCP VM module
│   │   └── dns/                # Cloudflare DNS module
│   └── environments/
│       └── dev/                # Development environment
│           ├── main.tf         # Environment-specific config
│           ├── variables.tf    # Environment variables
│           └── terraform.tfvars.example  # Example configuration
├── docker-compose.yml          # Local 3-node network
├── docker-compose.dev.yml      # Local dev with hot reload
├── docker-compose.gcp.yml      # GCP 2-node network (optimized for 1GB RAM)
├── Dockerfile                  # Rust production build
├── Dockerfile.dev              # Rust dev build with cargo-watch
├── run                         # CLI script
└── README.md                   # This file
```

## Tech Stack

- **Rust** - Core blockchain implementation
- **NGINX** - Load balancer and reverse proxy
- **Docker & Docker Compose** - Containerization
- **Google Cloud Platform** - Cloud hosting (free tier)
- **Terraform** - Infrastructure as Code
- **Cloudflare** - DNS and CDN (free tier)
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

## Security Model

**Encryption:**
- AES-256-GCM with authenticated encryption
- PIN-derived keys using SHA-256
- Each data item encrypted independently

**Signatures:**
- Ed25519 public-key cryptography
- Every encrypted data item is signed
- Prevents tampering and ensures authenticity

**Limitations (Proof of Concept):**
- PIN security is symmetric (anyone with PIN can decrypt)
- No rate limiting on PIN attempts
- No key rotation mechanism
- Suitable for PoC only, not production use

## License

MIT

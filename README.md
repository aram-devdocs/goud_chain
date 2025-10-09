# Goud Chain

Encrypted blockchain with API key-based authentication. Store any JSON data on an immutable, distributed ledger using Proof of Authority consensus.

[![API Status](https://img.shields.io/badge/API-Live-brightgreen?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://dev-api.goudchain.com/)
[![Dashboard Status](https://img.shields.io/badge/Dashboard-Live-brightgreen?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://dev-dashboard.goudchain.com/)

## 🚀 Try the Live Demo

**Test the blockchain in action** - No installation required!

- **📡 API Endpoint:** [https://dev-api.goudchain.com](https://dev-api.goudchain.com)
- **🌐 Dashboard:** [https://dev-dashboard.goudchain.com](https://dev-dashboard.goudchain.com)

**Quick Test:**
```bash
# Create account and get API key
curl -X POST https://dev-api.goudchain.com/account/create \
  -H "Content-Type: application/json" \
  -d '{"metadata": null}'

# Login with API key to get session token
curl -X POST https://dev-api.goudchain.com/account/login \
  -H "Content-Type: application/json" \
  -d '{"api_key": "YOUR_API_KEY_HERE"}'

# Submit encrypted data (use session token or API key)
curl -X POST https://dev-api.goudchain.com/data/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"label": "test", "data": "{\"message\": \"Hello Blockchain!\"}"}'

# View the blockchain
curl https://dev-api.goudchain.com/chain
```

Or visit the [Dashboard](https://dev-dashboard.goudchain.com) to interact with the blockchain visually.

> **Note:** This is a proof-of-concept deployment running on GCP's free tier. Hosted on a 2-node network with load balancing.

## Features

- **No Mining** - Instant blocks (<1s) using Proof of Authority
- **API Key Authentication** - Cryptographically secure 256-bit keys
- **AES-256-GCM Encryption** - API key-based symmetric encryption with HMAC integrity verification
- **HKDF Key Derivation** - Separate encryption, MAC, and search keys derived from single API key (100k iterations)
- **JWT Sessions** - Token-based authentication with 1-hour expiry
- **Collection-Based Storage** - Group encrypted data by user account
- **Ed25519 Signatures** - Digital signatures for blockchain integrity
- **Merkle Trees** - Tamper detection with accounts and collections
- **Schema Versioning** - Automatic migration on architecture changes
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
1. Account Creation → Generate 256-bit API Key → Hash with SHA-256 → Store on Blockchain
2. Authentication → API Key → JWT Session Token (1hr expiry)
3. Data Submission → JSON → Encrypt with API-derived key (HKDF) → HMAC → Sign (Ed25519) → Collection
4. Block Creation → Validator creates block with accounts + collections → Merkle Root → Blockchain
5. Data Retrieval → Decrypt with API key → Verify HMAC → Return JSON
```

**Consensus:** Proof of Authority (PoA)
- Validators: `Validator_1`, `Validator_2`
- Deterministic round-robin rotation per block
- No mining, instant block creation

**Cryptography Architecture:**
- **Key Generation**: 256-bit random API keys (base64-encoded)
- **Key Storage**: SHA-256 hash stored on blockchain (not the key itself)
- **Key Derivation**: HKDF with 100k iterations produces:
  - Encryption key (32 bytes for AES-256)
  - MAC key (32 bytes for HMAC-SHA256)
  - Search key (32 bytes, future use)
- **Encryption**: AES-256-GCM with 12-byte random nonce
- **Integrity**: HMAC-SHA256 over encrypted payload
- **Authentication**: Constant-time comparison prevents timing attacks

**Block Structure:**
```rust
Block {
    index: u64,
    timestamp: i64,
    user_accounts: Vec<UserAccount>,
    encrypted_collections: Vec<EncryptedCollection>,
    previous_hash: String,
    merkle_root: String,
    hash: String,
    validator: String,
}
```

**User Account:**
```rust
UserAccount {
    account_id: String,           // UUID
    api_key_hash: String,         // SHA-256 hash (for verification)
    public_key: String,           // Ed25519 public key
    created_at: i64,
    metadata_encrypted: Option<String>,  // Optional encrypted metadata
    signature: String,            // Ed25519 signature
}
```

**Encrypted Collection:**
```rust
EncryptedCollection {
    collection_id: String,        // UUID
    owner_api_key_hash: String,   // Links to UserAccount
    encrypted_metadata: String,   // Encrypted label/tags
    encrypted_payload: String,    // Encrypted JSON data
    mac: String,                  // HMAC-SHA256 for integrity
    nonce: String,                // 12-byte random nonce
    signature: String,            // Ed25519 signature
    public_key: String,           // Ed25519 public key
}
```

## API Reference

### Create Account

```bash
curl -X POST http://localhost:8080/account/create \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": null
  }'

# Response:
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012",
  "warning": "IMPORTANT: Save this API key! It will only be shown once and cannot be recovered."
}
```

**⚠️ Important:** The API key is shown only once. Store it securely - it cannot be recovered.

### Login

```bash
curl -X POST http://localhost:8080/account/login \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012"
  }'

# Response:
{
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "account_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** Session tokens expire after 1 hour. You can use either the API key or session token for authenticated requests.

### Submit Encrypted Data

```bash
curl -X POST http://localhost:8080/data/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "label": "my-data",
    "data": "{\"key\": \"value\"}"
  }'

# Response:
{
  "collection_id": "650e8400-e29b-41d4-a716-446655440000",
  "label": "my-data",
  "block_number": 5
}
```

**Authentication Methods:**
- Header: `Authorization: Bearer YOUR_API_KEY`
- Header: `Authorization: Bearer YOUR_SESSION_TOKEN`

### List My Collections

```bash
curl -X GET http://localhost:8080/data/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
{
  "collections": [
    {
      "collection_id": "650e8400-e29b-41d4-a716-446655440000",
      "label": "my-data",
      "created_at": 1704067200,
      "block_number": 5
    }
  ]
}
```

### Decrypt Collection

```bash
curl -X POST http://localhost:8080/data/decrypt/650e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
{
  "collection_id": "650e8400-e29b-41d4-a716-446655440000",
  "data": "{\"key\": \"value\"}"
}
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
│   ├── main.rs                     # Entry point
│   ├── constants.rs                # Configuration constants & schema version
│   ├── crypto/
│   │   ├── api_key.rs              # API key generation & validation
│   │   ├── encryption.rs           # AES-256-GCM encryption
│   │   ├── hkdf.rs                 # HKDF key derivation (100k iterations)
│   │   ├── mac.rs                  # HMAC-SHA256 message authentication
│   │   └── signature.rs            # Ed25519 signatures
│   ├── domain/
│   │   ├── blockchain.rs           # Blockchain logic with schema versioning
│   │   ├── block.rs                # Block structure (accounts + collections)
│   │   ├── user_account.rs         # User account model
│   │   ├── encrypted_collection.rs # Encrypted data collection
│   │   └── encrypted_data.rs       # Legacy encrypted data (deprecated)
│   ├── api/
│   │   ├── handlers.rs             # Main router
│   │   ├── account_handlers.rs     # Account creation & login
│   │   ├── data_handlers.rs        # Data submission & retrieval
│   │   ├── auth.rs                 # JWT authentication middleware
│   │   └── middleware.rs           # CORS & request handling
│   ├── network/
│   │   └── p2p.rs                  # Peer-to-peer networking
│   ├── storage/
│   │   └── mod.rs                  # Blockchain persistence with schema migration
│   └── types/
│       ├── api.rs                  # Request/response types
│       └── errors.rs               # Error types
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
│   ├── index.html              # Main dashboard (authenticated)
│   ├── auth.html               # Login & signup page
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

**Backend:**
- **Rust** - Core blockchain implementation
- **AES-256-GCM** - Symmetric encryption (aes-gcm crate)
- **HKDF** - Key derivation with 100k iterations (hkdf crate)
- **HMAC-SHA256** - Message authentication (hmac + sha2)
- **Ed25519** - Digital signatures (ed25519-dalek)
- **SHA-256** - Hashing (sha2)
- **JWT** - Session tokens (jsonwebtoken)
- **Base64** - API key encoding (base64)
- **JSON** - Serialization (serde_json)
- **HTTP** - API server (tiny_http)

**Infrastructure:**
- **NGINX** - Load balancer and reverse proxy
- **Docker & Docker Compose** - Containerization
- **Google Cloud Platform** - Cloud hosting (free tier)
- **Terraform** - Infrastructure as Code
- **Cloudflare** - DNS and CDN (free tier)

**Frontend:**
- **AlpineJS** - Reactive UI components
- **TailwindCSS** - Styling
- **localStorage** - Session management

## P2P Networking

**Message Types:**
```rust
enum P2PMessage {
    NewBlock(Block),
    RequestChain,
    ResponseChain(Vec<Block>),
    Peers(Vec<String>),
    NewAccount(UserAccount),
    NewCollection(EncryptedCollection),
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

**Key Generation & Storage:**
- 256-bit API keys generated using cryptographically secure random number generator
- Only SHA-256 hash of API key stored on blockchain (not the key itself)
- Keys cannot be recovered if lost - users must save them securely

**Key Derivation:**
- HKDF (HMAC-based Key Derivation Function) with 100,000 iterations
- Derives separate keys from single API key:
  - **Encryption key** (32 bytes for AES-256)
  - **MAC key** (32 bytes for HMAC-SHA256)
  - **Search key** (32 bytes, reserved for future use)
- Each derivation uses unique context strings to ensure key separation

**Encryption:**
- AES-256-GCM with authenticated encryption
- 12-byte random nonce per collection (prevents replay attacks)
- HMAC-SHA256 for additional integrity verification
- Each collection encrypted independently

**Authentication:**
- Constant-time comparison prevents timing attacks on API key verification
- JWT session tokens with 1-hour expiry reduce API key exposure
- Dual-mode auth: API key (long-lived) or session token (short-lived)

**Signatures:**
- Ed25519 public-key cryptography for blockchain data
- Every account and collection is digitally signed
- Prevents tampering and ensures authenticity
- Signatures verified during chain validation

**Schema Versioning:**
- Automatic detection of architecture changes
- Old blockchain data deleted on schema mismatch
- Prevents compatibility issues during PoC development
- Current schema: `v2_api_key`

**Limitations (Proof of Concept):**
- API key security is symmetric (anyone with API key can decrypt)
- No rate limiting on login attempts
- No key rotation mechanism
- No password recovery (keys lost = data lost)
- JWT secret hardcoded in constants (use env var in production)
- No audit logging of authentication events
- Suitable for PoC only, not production use

**Production Hardening Recommendations:**
- Implement rate limiting on authentication endpoints
- Add HTTPS/TLS for all connections
- Use environment variables for JWT secret
- Implement account recovery mechanism (with security questions or backup keys)
- Add audit logging for security events
- Implement IP-based access controls
- Add multi-factor authentication
- Implement key rotation with backward compatibility
- Use hardware security modules (HSM) for validator keys

## License

MIT

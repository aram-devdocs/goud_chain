# Goud Chain CI/CD Workflows

Automated testing and deployment using GitHub Actions.

## 🔄 Workflows

### 1. **test.yml** - Continuous Integration
**Triggers:** Every PR and push to `main` or `develop`

**Jobs:**
- ✅ Rust tests (`cargo test`)
- ✅ Lint checks (`cargo clippy`, `cargo fmt`)
- ✅ Module dependency validation
- ✅ Docker build test (AMD64)
- ✅ Terraform validation
- ✅ Security scanning (Trivy)

**Duration:** ~5-7 minutes
**Free tier usage:** ~7 minutes per run

### 2. **deploy-free-tier.yml** - Continuous Deployment
**Triggers:** Manual or push to `main`

**Jobs:**
1. **Build & Push** - Multi-arch Docker images to OCIR
2. **Terraform Deploy** - Provision/update OCI infrastructure
3. **Deploy Containers** - SSH deploy to VMs
4. **Verify** - Health checks
5. **Notify** - Deployment status

**Duration:** ~10-15 minutes
**Free tier usage:** ~15 minutes per deploy

## 🔐 Required Secrets

Configure these in GitHub: **Settings → Secrets and variables → Actions**

### Oracle Cloud Secrets

| Secret Name | Description | How to get |
|------------|-------------|------------|
| `OCI_TENANCY_OCID` | Tenancy OCID | OCI Console → Profile → Tenancy |
| `OCI_USER_OCID` | User OCID | OCI Console → Profile → User Settings |
| `OCI_FINGERPRINT` | API key fingerprint | After uploading public key |
| `OCI_PRIVATE_KEY` | API private key | Contents of `~/.oci/oci_api_key.pem` |
| `OCI_REGION` | Region (e.g., `us-ashburn-1`) | OCI Console → Region selector |
| `OCI_TENANCY_NAMESPACE` | Tenancy namespace | For OCIR, see Object Storage |
| `OCI_USERNAME` | OCI username | Usually your email |
| `OCI_AUTH_TOKEN` | Auth token for OCIR | OCI Console → User → Auth Tokens |

### SSH Secrets

| Secret Name | Description | How to generate |
|------------|-------------|-----------------|
| `SSH_PUBLIC_KEY` | SSH public key | `cat ~/.ssh/goud_chain_rsa.pub` |
| `SSH_PRIVATE_KEY` | SSH private key | `cat ~/.ssh/goud_chain_rsa` |

## 📋 Setup Instructions

### 1. Generate OCI API Keys

```bash
# Create OCI config directory
mkdir -p ~/.oci

# Generate API key pair
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Get fingerprint
openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | openssl md5 -c
```

**Upload public key:**
1. Go to OCI Console → Profile Icon → User Settings
2. Click "API Keys" → "Add API Key"
3. Paste contents of `~/.oci/oci_api_key_public.pem`
4. Copy the fingerprint shown

### 2. Generate SSH Keys

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/goud_chain_rsa -N ""

# Get public key
cat ~/.ssh/goud_chain_rsa.pub

# Get private key (for GitHub secret)
cat ~/.ssh/goud_chain_rsa
```

### 3. Create OCI Auth Token

1. OCI Console → Profile Icon → User Settings
2. Click "Auth Tokens" → "Generate Token"
3. Description: "GitHub Actions OCIR"
4. **Copy the token immediately** (can't retrieve later!)
5. Save as `OCI_AUTH_TOKEN` secret

### 4. Get Tenancy Namespace

```bash
# Option 1: OCI CLI
oci os ns get

# Option 2: OCI Console
# Object Storage → Buckets → Check the URL
# Format: https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket}/o
```

### 5. Add Secrets to GitHub

```bash
# Go to your repository
https://github.com/YOUR_USERNAME/goud_chain/settings/secrets/actions

# Click "New repository secret" for each:
OCI_TENANCY_OCID      = ocid1.tenancy.oc1..aaaaaaaXXXXXXXX
OCI_USER_OCID         = ocid1.user.oc1..aaaaaaaXXXXXXXX
OCI_FINGERPRINT       = aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99
OCI_PRIVATE_KEY       = -----BEGIN RSA PRIVATE KEY-----
                        MIIEpAIBAAKCAQEA...
                        -----END RSA PRIVATE KEY-----
OCI_REGION            = us-ashburn-1
OCI_TENANCY_NAMESPACE = your-namespace
OCI_USERNAME          = oracleidentitycloudservice/your.email@example.com
OCI_AUTH_TOKEN        = <your-auth-token>
SSH_PUBLIC_KEY        = ssh-rsa AAAAB3NzaC1yc2E...
SSH_PRIVATE_KEY       = -----BEGIN OPENSSH PRIVATE KEY-----
                        b3BlbnNzaC1rZXktdjEA...
                        -----END OPENSSH PRIVATE KEY-----
```

## 🚀 Usage

### Run Tests (Automatic)

Tests run automatically on every PR and push:

```bash
git checkout -b feature/my-feature
# Make changes
git commit -m "Add feature"
git push origin feature/my-feature
# Create PR → Tests run automatically
```

### Deploy to Free Tier

**Option 1: Automatic (on merge to main)**
```bash
git checkout main
git merge feature/my-feature
git push origin main
# Deployment runs automatically
```

**Option 2: Manual trigger**
1. Go to GitHub → Actions → Deploy Free Tier
2. Click "Run workflow"
3. Select branch → Click "Run workflow"

### Monitor Deployment

```bash
# Watch GitHub Actions progress
https://github.com/YOUR_USERNAME/goud_chain/actions

# Check deployment logs
# Click on the running workflow → Expand job logs

# After deployment, check health
curl http://YOUR_VM_IP:8080/lb/health
```

## 📊 GitHub Actions Free Tier Usage

**Free Tier:**
- ✅ 2,000 minutes/month (private repos)
- ✅ Unlimited minutes (public repos)

**Estimated Usage (Private Repo):**
- Test workflow: ~7 min × 50 runs/month = **350 minutes**
- Deploy workflow: ~15 min × 10 deploys/month = **150 minutes**
- **Total: ~500 minutes/month (25% of free tier)**

**Optimization Tips:**
1. Use caching for Cargo and Docker layers (already configured)
2. Skip CI on documentation changes (already configured)
3. Run deployments manually for testing environments
4. Use self-hosted runners for unlimited minutes (advanced)

## 🔧 Customization

### Add More Environments

Create `deploy-staging.yml`:

```yaml
name: Deploy Staging

on:
  workflow_dispatch:
  push:
    branches: [ develop ]

# Same structure as deploy-free-tier.yml
# Change environment variables to 'staging'
```

### Add Slack Notifications

Add to `deploy-free-tier.yml`:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Add Performance Tests

Add to `test.yml`:

```yaml
- name: Run performance tests
  run: |
    cargo build --release
    ./target/release/goud_chain &
    sleep 5
    # Run load tests with wrk or ab
    wrk -t4 -c100 -d30s http://localhost:8080/chain
```

## 🐛 Troubleshooting

### "OCI authentication failed"

1. Verify fingerprint matches uploaded public key
2. Check private key format (must include BEGIN/END lines)
3. Ensure user has proper IAM permissions

### "Docker push failed"

1. Verify OCI auth token is valid (check expiry)
2. Check tenancy namespace is correct
3. Ensure OCIR is enabled in your region

### "SSH connection refused"

1. Verify SSH public key matches the one in OCI
2. Check security list allows port 22
3. Ensure VM is in RUNNING state

### "Terraform apply failed"

1. Check if free tier resources are available
2. Verify all OCI credentials are correct
3. Review Terraform error message in logs

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OCI Terraform Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Terraform GitHub Actions](https://github.com/hashicorp/setup-terraform)

## 💡 Best Practices

1. **Always review Terraform plan** before applying
2. **Use branch protection** to require PR reviews
3. **Enable deployment environments** for approval gates
4. **Rotate secrets regularly** (every 90 days)
5. **Monitor action runs** for failures
6. **Keep workflows DRY** using reusable workflows
7. **Tag releases** for version tracking

---

**Cost:** $0 with GitHub Free tier (2,000 minutes/month)
**Setup time:** ~30 minutes
**Maintenance:** Minimal (automated)

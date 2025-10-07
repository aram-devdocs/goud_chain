# Goud Chain - Terraform Infrastructure

Production-ready Infrastructure as Code for deploying Goud Chain blockchain on Oracle Cloud.

## 📋 Prerequisites

1. **Oracle Cloud Account** (Free Tier - no credit card for Always Free resources)
   - Sign up at: https://www.oracle.com/cloud/free/
   - Note your tenancy OCID, user OCID, and region

2. **Oracle Cloud API Keys**
   ```bash
   # Generate API key pair
   mkdir -p ~/.oci
   openssl genrsa -out ~/.oci/oci_api_key.pem 2048
   openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

   # Get fingerprint
   openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | openssl md5 -c
   ```
   - Upload public key in OCI Console: Identity → Users → Your User → API Keys

3. **SSH Key Pair** for VM access
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/goud_chain_rsa
   ```

4. **Terraform** (>= 1.6.0)
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
   unzip terraform_1.6.6_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

## 🚀 Quick Start (Free Tier)

### 1. Configure Credentials

```bash
cd terraform/environments/free-tier

# Copy example variables
cp terraform.tfvars terraform.tfvars.local

# Edit with your OCI credentials
vim terraform.tfvars.local
```

Fill in:
```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..aaaaaaaXXXXXXXX"
user_ocid        = "ocid1.user.oc1..aaaaaaaXXXXXXXX"
fingerprint      = "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99"
private_key_path = "~/.oci/oci_api_key.pem"
region           = "us-ashburn-1"

ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2E... your-email@example.com"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Deployment

```bash
terraform plan -var-file=terraform.tfvars.local
```

Review the plan - should show:
- ✅ 4 compute instances (ARM A1.Flex)
- ✅ 1 VCN with subnet and security lists
- ✅ 4 block volumes (50 GB each)
- ✅ 2 backup policy assignments

### 4. Deploy Infrastructure

```bash
terraform apply -var-file=terraform.tfvars.local -auto-approve
```

⏱️ Takes ~5-10 minutes

### 5. Get Deployment Info

```bash
terraform output
```

Example output:
```
load_balancer_url = "http://123.45.67.89:8080"
dashboard_url = "http://123.45.67.89:3000"
ssh_command = "ssh ubuntu@123.45.67.89"
node_public_ips = [
  "123.45.67.89",
  "123.45.67.90",
  "123.45.67.91",
  "123.45.67.92",
]
```

## 📦 Post-Deployment Setup

### Mount Block Volumes

SSH into each VM and mount the block storage:

```bash
# SSH to VM1
ssh ubuntu@<VM1_IP>

# Format and mount block volume (first time only)
sudo mkfs.ext4 /dev/oracleoci/oraclevdb
sudo mkdir -p /data/node1
sudo mount /dev/oracleoci/oraclevdb /data/node1
sudo chown -R ubuntu:ubuntu /data/node1

# Auto-mount on reboot
echo '/dev/oracleoci/oraclevdb /data/node1 ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

Repeat for VM2, VM3, VM4 (changing `node1` to `node2`, etc.)

### Deploy Docker Containers

```bash
# Clone repository on VM1 (load balancer node)
cd /opt
sudo git clone https://github.com/your-username/goud_chain.git
sudo chown -R ubuntu:ubuntu goud_chain
cd goud_chain

# Set environment variables for multi-VM deployment
export NODE1_IP=<VM1_PRIVATE_IP>
export NODE2_IP=<VM2_PRIVATE_IP>
export NODE3_IP=<VM3_PRIVATE_IP>
export NODE4_IP=<VM4_PRIVATE_IP>

# Start containers on VM1 (nginx + node1 + dashboard)
docker-compose -f docker-compose.prod.yml up -d nginx node1 dashboard

# SSH to VM2, start node2 + redis
ssh ubuntu@<VM2_IP>
cd /opt/goud_chain
export NODE1_IP=... NODE2_IP=... NODE3_IP=... NODE4_IP=...
docker-compose -f docker-compose.prod.yml up -d node2 redis

# SSH to VM3, start node3
ssh ubuntu@<VM3_IP>
cd /opt/goud_chain
export NODE1_IP=... NODE2_IP=... NODE3_IP=... NODE4_IP=...
docker-compose -f docker-compose.prod.yml up -d node3

# SSH to VM4, start node4
ssh ubuntu@<VM4_IP>
cd /opt/goud_chain
export NODE1_IP=... NODE2_IP=... NODE3_IP=... NODE4_IP=...
docker-compose -f docker-compose.prod.yml up -d node4
```

### Verify Deployment

```bash
# Check load balancer health
curl http://<VM1_PUBLIC_IP>:8080/lb/health

# Check blockchain
curl http://<VM1_PUBLIC_IP>:8080/chain

# Check individual nodes
for ip in <VM1_IP> <VM2_IP> <VM3_IP> <VM4_IP>; do
  echo "Node at $ip:"
  ssh ubuntu@$ip "docker ps"
done
```

## 🔧 Managing Infrastructure

### Update Infrastructure

```bash
# Edit terraform.tfvars.local (e.g., add more nodes)
vim terraform.tfvars.local

# Preview changes
terraform plan -var-file=terraform.tfvars.local

# Apply changes
terraform apply -var-file=terraform.tfvars.local
```

### Destroy Infrastructure

```bash
# DANGER: This deletes everything!
terraform destroy -var-file=terraform.tfvars.local
```

### State Management

```bash
# View current state
terraform show

# List resources
terraform state list

# Get specific resource info
terraform state show oci_core_instance.blockchain_node[0]
```

## 📊 Resource Limits (Free Tier)

| Resource | Free Tier Limit | Used by Goud Chain | Remaining |
|----------|----------------|-------------------|-----------|
| ARM OCPUs | 4 | 4 (1 per VM) | 0 |
| Memory | 24 GB | 24 GB (6 GB per VM) | 0 |
| Block Storage | 200 GB | 200 GB (4×50 GB) | 0 |
| Boot Volumes | Unlimited (50 GB each) | 200 GB (4×50 GB) | N/A |
| Volume Backups | 5 | 2 (nodes 1 & 2) | 3 |
| Public IPv4 | 2 | 1 (load balancer) | 1 |
| Bandwidth | 10 TB/month | ~50-100 GB/month | ~9.9 TB |

## 🏗️ Architecture

```
VM1 (1 OCPU, 6 GB)          VM2 (1 OCPU, 6 GB)
├── nginx (200 MB)          ├── node2 (800 MB)
├── node1 (800 MB)          ├── redis (100 MB)
├── dashboard (150 MB)      └── 50 GB block volume
└── 50 GB block volume

VM3 (1 OCPU, 6 GB)          VM4 (1 OCPU, 6 GB)
├── node3 (800 MB)          ├── node4 (800 MB)
└── 50 GB block volume      └── 50 GB block volume
```

## 🔐 Security Best Practices

1. **Restrict SSH Access**
   ```hcl
   # In terraform.tfvars.local
   allowed_ssh_cidrs = ["YOUR_IP/32"]  # Your IP only
   ```

2. **Enable HTTPS** (after deployment)
   ```bash
   # Install Certbot on VM1
   sudo snap install --classic certbot
   sudo certbot --nginx -d your-domain.com
   ```

3. **Rotate API Keys** regularly
   ```bash
   # Generate new key
   openssl genrsa -out ~/.oci/oci_api_key_new.pem 2048

   # Update in OCI Console
   # Update terraform.tfvars.local
   # Re-run terraform apply
   ```

4. **Use OCI Secrets** for sensitive environment variables

## 📈 Scaling to Production

### Staging Environment (6 nodes, ~$50/month)

```bash
cd terraform/environments/staging
cp terraform.tfvars.example terraform.tfvars.local
# Edit: increase node_count to 6, use mix of free+paid instances
terraform init
terraform apply -var-file=terraform.tfvars.local
```

### Production Environment (12+ nodes, ~$250/month)

```bash
cd terraform/environments/production
cp terraform.tfvars.example terraform.tfvars.local
# Edit: 12 nodes, larger instance shapes, multi-region
terraform init
terraform apply -var-file=terraform.tfvars.local
```

## 🐛 Troubleshooting

### "Out of host capacity" error

Oracle Cloud free tier can be competitive. Try:
1. Different availability domain
2. Different region (us-phoenix-1, eu-frankfurt-1)
3. Wait and retry (capacity fluctuates)

### SSH connection refused

1. Check security list allows your IP:
   ```bash
   terraform output | grep allowed_ssh_cidrs
   ```
2. Verify instance is running:
   ```bash
   terraform state show oci_core_instance.blockchain_node[0]
   ```

### Volume not mounting

```bash
# Check if volume is attached
lsblk

# Verify device path
ls -la /dev/oracleoci/

# Check dmesg for errors
sudo dmesg | grep -i oracle
```

## 📚 Additional Resources

- [Oracle Cloud Documentation](https://docs.oracle.com/iaas)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [OCI Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)
- [Goud Chain Repository](https://github.com/your-username/goud_chain)

## 💡 Tips

- Always use `-var-file` to avoid committing secrets
- Run `terraform plan` before every `apply`
- Use `terraform workspace` for multiple environments
- Enable `remote backend` for team collaboration
- Tag all resources for cost tracking
- Set up monitoring with OCI native tools (free)

---

**Cost:** $0/month on free tier, scales to $50-$2000/month for production
**Deployment time:** ~10 minutes
**Maintenance:** ~1 hour/month (updates, backups)

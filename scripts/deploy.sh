#!/bin/bash
# Deploy Goud Chain infrastructure and application to Google Cloud Platform
# Usage: ./scripts/deploy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TERRAFORM_DIR="terraform/environments/dev"

echo -e "${GREEN}=== Deploying Goud Chain to Google Cloud Platform ===${NC}"
echo ""

# Step 1: Terraform apply
echo -e "${YELLOW}Step 1: Deploying infrastructure with Terraform...${NC}"
cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found${NC}"
    echo "Please create terraform/environments/dev/terraform.tfvars with your GCP credentials"
    echo ""
    echo "Example:"
    echo "  project_id     = \"your-gcp-project-id\""
    echo "  region         = \"us-central1\""
    echo "  zone           = \"us-central1-a\""
    echo "  ssh_public_key = \"ssh-rsa AAAAB3...\""
    echo ""
    echo "Run './scripts/setup-gcp.sh' for guided setup"
    exit 1
fi

terraform init

# Validate configuration before planning
echo "Validating Terraform configuration..."
if ! terraform validate; then
    echo -e "${RED}Error: Terraform validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Terraform configuration is valid${NC}"
echo ""

terraform plan -out=tfplan

terraform apply -auto-approve tfplan

# Check if any resources were created/changed
RESOURCES_CHANGED=$(terraform show -json tfplan | jq -r '[.resource_changes[] | select(.change.actions[] | . == "create" or . == "update")] | length')

# Get outputs
INSTANCE_IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
LOAD_BALANCER_URL=$(terraform output -raw load_balancer_url 2>/dev/null || echo "")
DASHBOARD_URL=$(terraform output -raw dashboard_url 2>/dev/null || echo "")
DNS_ENABLED=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.enabled' || echo "false")

if [ -z "$INSTANCE_IP" ]; then
    echo -e "${RED}Error: Could not get instance IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure deployed${NC}"
echo "Instance IP: $INSTANCE_IP"

if [ "$DNS_ENABLED" == "true" ]; then
    API_FQDN=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.api_fqdn' || echo "")
    DASHBOARD_FQDN=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.dashboard_fqdn' || echo "")
    echo "DNS Enabled: API at $API_FQDN, Dashboard at $DASHBOARD_FQDN"
fi
echo ""

cd ../../..

# Step 2: Wait for VM to be ready (only if resources changed)
if [ "$RESOURCES_CHANGED" -gt 0 ]; then
    echo -e "${YELLOW}Step 2: Waiting for VM to complete startup script (2 minutes)...${NC}"
    echo "This ensures Docker is fully installed and running..."
    sleep 120
else
    echo -e "${YELLOW}Step 2: No infrastructure changes, skipping startup wait${NC}"
fi

# Step 3: Deploy application
echo -e "${YELLOW}Step 3: Deploying blockchain application...${NC}"

# Check SSH connectivity
echo "Testing SSH connection..."
if ! ssh -i ~/.ssh/goud_chain_rsa -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$INSTANCE_IP "echo 'Connected'"; then
    echo -e "${RED}Error: Could not connect to instance $INSTANCE_IP${NC}"
    echo "Make sure your SSH key is at ~/.ssh/goud_chain_rsa"
    exit 1
fi

# Check Docker is running (only if resources were created)
if [ "$RESOURCES_CHANGED" -gt 0 ]; then
    echo "Verifying Docker is ready..."
    ssh -i ~/.ssh/goud_chain_rsa -o StrictHostKeyChecking=no ubuntu@$INSTANCE_IP << 'ENDSSH'
        # Wait for cloud-init to complete (with timeout)
        echo "Waiting for cloud-init to finish..."
        timeout 30 sudo cloud-init status --wait 2>/dev/null || echo "Skipping cloud-init wait"

        # Ensure Docker service is running
        sudo systemctl start docker
        sudo systemctl enable docker

        # Test Docker access
        echo "Testing Docker access..."
        sudo docker ps
ENDSSH
else
    echo "Skipping Docker verification (no infrastructure changes)"
fi

# Deploy application
echo "Deploying application containers..."
ssh -i ~/.ssh/goud_chain_rsa ubuntu@$INSTANCE_IP << 'ENDSSH'
    set -e

    # Create app directory
    sudo mkdir -p /opt/goud-chain
    sudo chown ubuntu:ubuntu /opt/goud-chain
    cd /opt/goud-chain

    # Clone or pull latest code
    if [ -d .git ]; then
        git pull origin main
    else
        git clone https://github.com/aram-devdocs/goud_chain.git .
    fi

    # Create data directories
    sudo mkdir -p /data
    sudo chown -R ubuntu:ubuntu /data

    # Stop and remove old containers to avoid ContainerConfig errors
    echo "Cleaning up old containers and images..."
    sudo docker-compose -f docker-compose.gcp.yml down --remove-orphans 2>/dev/null || true

    # Remove dangling images that may have corrupted metadata
    sudo docker image prune -f

    # Build and start services using GCP-optimized compose file
    # Use sudo for docker commands to avoid group permission issues
    # --force-recreate ensures containers are rebuilt from scratch
    sudo docker-compose -f docker-compose.gcp.yml build --no-cache
    sudo docker-compose -f docker-compose.gcp.yml up -d --force-recreate --remove-orphans

    echo "✅ Application deployed"
    sudo docker-compose -f docker-compose.gcp.yml ps
ENDSSH

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "📊 Access your blockchain:"

if [ "$DNS_ENABLED" == "true" ] && [ -n "$LOAD_BALANCER_URL" ] && [ -n "$DASHBOARD_URL" ]; then
    echo "  API Endpoint:  $LOAD_BALANCER_URL"
    echo "  Dashboard:     $DASHBOARD_URL"
    echo ""
    echo "  (Direct IP):   http://$INSTANCE_IP:8080 (API)"
    echo "  (Direct IP):   http://$INSTANCE_IP:3000 (Dashboard)"
    echo ""
    echo "⚠️  DNS Configuration Required:"
    echo "  1. Go to Cloudflare Dashboard → goudchain.com → SSL/TLS → Overview"
    echo "  2. Set SSL/TLS encryption mode to 'Flexible'"
    echo "  3. (Optional) Enable 'Always Use HTTPS' under SSL/TLS → Edge Certificates"
    echo "  4. Wait 2-5 minutes for DNS propagation and SSL certificate issuance"
else
    echo "  API Endpoint: http://$INSTANCE_IP:8080"
    echo "  Dashboard:    http://$INSTANCE_IP:3000"
fi

echo ""
echo "🔍 Health checks:"
if [ "$DNS_ENABLED" == "true" ] && [ -n "$LOAD_BALANCER_URL" ]; then
    echo "  curl $LOAD_BALANCER_URL/health"
    echo "  curl $LOAD_BALANCER_URL/chain"
else
    echo "  curl http://$INSTANCE_IP:8080/health"
    echo "  curl http://$INSTANCE_IP:8080/chain"
fi

echo ""
echo "💻 SSH access:"
echo "  ssh ubuntu@$INSTANCE_IP"
echo ""
echo "📝 View logs:"
echo "  ssh ubuntu@$INSTANCE_IP 'cd /opt/goud-chain && docker-compose -f docker-compose.gcp.yml logs -f'"

#!/bin/bash
# Deploy Goud Chain infrastructure and application to Oracle Cloud
# Usage: ./scripts/deploy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TERRAFORM_DIR="terraform/environments/dev"

echo -e "${GREEN}=== Deploying Goud Chain to Oracle Cloud ===${NC}"
echo ""

# Step 1: Terraform apply
echo -e "${YELLOW}Step 1: Deploying infrastructure with Terraform...${NC}"
cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found${NC}"
    echo "Please create terraform/environments/dev/terraform.tfvars with your OCI credentials"
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

# Use -parallelism=1 to avoid OCI volume attachment race conditions
# See: https://github.com/oracle/terraform-provider-oci/issues/73
terraform apply -parallelism=1 tfplan

# Get outputs
LOAD_BALANCER_IP=$(terraform output -raw load_balancer_public_ip 2>/dev/null || echo "")
LOAD_BALANCER_URL=$(terraform output -raw load_balancer_url 2>/dev/null || echo "")
DASHBOARD_URL=$(terraform output -raw dashboard_url 2>/dev/null || echo "")
NODE_IPS=$(terraform output -json node_public_ips 2>/dev/null | jq -r '.[]' || echo "")
DNS_ENABLED=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.enabled' || echo "false")

if [ -z "$LOAD_BALANCER_IP" ]; then
    echo -e "${RED}Error: Could not get load balancer IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure deployed${NC}"
echo "Load Balancer IP: $LOAD_BALANCER_IP"

if [ "$DNS_ENABLED" == "true" ]; then
    API_FQDN=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.api_fqdn' || echo "")
    DASHBOARD_FQDN=$(terraform output -json dns_configuration 2>/dev/null | jq -r '.dashboard_fqdn' || echo "")
    echo "DNS Enabled: API at $API_FQDN, Dashboard at $DASHBOARD_FQDN"
fi
echo ""

cd ../../..

# Step 2: Wait for VMs to be ready
echo -e "${YELLOW}Step 2: Waiting for VMs to complete cloud-init (5 minutes)...${NC}"
echo "This ensures Docker is fully installed and running..."
sleep 300

# Step 3: Deploy application
echo -e "${YELLOW}Step 3: Deploying blockchain application...${NC}"

# Convert node IPs to array
NODE_IP_ARRAY=($NODE_IPS)
NODE_COUNT=${#NODE_IP_ARRAY[@]}

# Determine environment (from terraform directory or default to dev)
ENVIRONMENT="${TERRAFORM_DIR##*/}"  # Extract last part of path (dev/staging/prod)
echo "Environment: $ENVIRONMENT"
echo "Node count: $NODE_COUNT"
echo ""

# Deploy to first node (load balancer + nginx + dashboard + node1)
NODE_IP="${NODE_IP_ARRAY[0]}"
echo "Deploying to $NODE_IP (primary node with nginx + dashboard + node1)..."

if ! ssh -i ~/.ssh/goud_chain_rsa -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$NODE_IP "echo 'Connected'"; then
    echo -e "${RED}Error: Could not connect to primary node $NODE_IP${NC}"
    exit 1
fi

# Build PEERS list for node1 (peer IPs of other nodes)
PEERS_NODE1=""
for j in $(seq 1 $((NODE_COUNT - 1))); do
    PEER_IP="${NODE_IP_ARRAY[$j]}"
    PEERS_NODE1="${PEERS_NODE1}${PEER_IP}:9000,"
done
PEERS_NODE1=${PEERS_NODE1%,}  # Remove trailing comma

# Check Docker is running
echo "Verifying Docker is ready..."
ssh -i ~/.ssh/goud_chain_rsa ubuntu@$NODE_IP << 'ENDSSH'
    timeout 60 bash -c 'until docker ps >/dev/null 2>&1; do echo "Waiting for Docker..."; sleep 2; done' || {
        echo "Docker not ready after 60s, trying to start it..."
        sudo systemctl start docker
        sleep 10
    }
    docker ps
ENDSSH

ssh -i ~/.ssh/goud_chain_rsa ubuntu@$NODE_IP << ENDSSH
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
    sudo mkdir -p /data/node1
    sudo chown -R ubuntu:ubuntu /data

    # Create environment-specific docker-compose override
    cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  node1:
    environment:
      - NODE_ID=node1
      - HTTP_PORT=8080
      - P2P_PORT=9000
      - PEERS=${PEERS_NODE1}
EOF

    # Start services (nginx, dashboard, node1 only - not node2)
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d nginx dashboard node1

    echo "✅ Primary node deployed (nginx + dashboard + node1)"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml ps
ENDSSH

# Deploy to remaining nodes
for i in $(seq 1 $((NODE_COUNT - 1))); do
    NODE_IP="${NODE_IP_ARRAY[$i]}"
    NODE_NUM=$((i + 1))
    NODE_ID="node${NODE_NUM}"

    echo ""
    echo "Deploying to $NODE_IP (${NODE_ID})..."

    if ! ssh -i ~/.ssh/goud_chain_rsa -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$NODE_IP "echo 'Connected'"; then
        echo -e "${RED}Warning: Could not connect to $NODE_IP${NC}"
        continue
    fi

    # Build PEERS list for this node (IP of node1 + other nodes, excluding self)
    PEERS="${NODE_IP_ARRAY[0]}:9000"  # Always include node1's IP
    for j in $(seq 1 $((NODE_COUNT - 1))); do
        if [ $j -ne $i ]; then
            PEER_IP="${NODE_IP_ARRAY[$j]}"
            PEERS="${PEERS},${PEER_IP}:9000"
        fi
    done

    # Check Docker is running
    echo "Verifying Docker is ready on $NODE_ID..."
    ssh -i ~/.ssh/goud_chain_rsa ubuntu@$NODE_IP << 'ENDSSH'
        timeout 60 bash -c 'until docker ps >/dev/null 2>&1; do echo "Waiting for Docker..."; sleep 2; done' || {
            echo "Docker not ready after 60s, trying to start it..."
            sudo systemctl start docker
            sleep 10
        }
        docker ps
ENDSSH

    ssh -i ~/.ssh/goud_chain_rsa ubuntu@$NODE_IP << ENDSSH
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

        # Create data directory
        sudo mkdir -p /data/${NODE_ID}
        sudo chown -R ubuntu:ubuntu /data

        # Create environment-specific docker-compose override with actual peer IPs
        cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  ${NODE_ID}:
    environment:
      - NODE_ID=${NODE_ID}
      - HTTP_PORT=8080
      - P2P_PORT=9000
      - PEERS=${PEERS}
    ports:
      - "8080:8080"
      - "9000:9000"
EOF

        # Start only this node's service
        docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d ${NODE_ID}

        echo "✅ ${NODE_ID} deployed and started"
        docker-compose -f docker-compose.${ENVIRONMENT}.yml ps
ENDSSH

done

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "📊 Access your blockchain:"

if [ "$DNS_ENABLED" == "true" ] && [ -n "$LOAD_BALANCER_URL" ] && [ -n "$DASHBOARD_URL" ]; then
    echo "  API Endpoint:  $LOAD_BALANCER_URL"
    echo "  Dashboard:     $DASHBOARD_URL"
    echo ""
    echo "  (Direct IP):   http://$LOAD_BALANCER_IP:8080 (API)"
    echo "  (Direct IP):   http://$LOAD_BALANCER_IP:3000 (Dashboard)"
    echo ""
    echo "⚠️  DNS Configuration Required:"
    echo "  1. Go to Cloudflare Dashboard → goudchain.com → SSL/TLS → Overview"
    echo "  2. Set SSL/TLS encryption mode to 'Flexible'"
    echo "  3. (Optional) Enable 'Always Use HTTPS' under SSL/TLS → Edge Certificates"
    echo "  4. Wait 2-5 minutes for DNS propagation and SSL certificate issuance"
else
    echo "  Load Balancer: http://$LOAD_BALANCER_IP:8080"
    echo "  Dashboard:     http://$LOAD_BALANCER_IP:3000"
fi

echo ""
echo "🔍 Health checks:"
if [ "$DNS_ENABLED" == "true" ] && [ -n "$LOAD_BALANCER_URL" ]; then
    echo "  curl $LOAD_BALANCER_URL/health"
    echo "  curl $LOAD_BALANCER_URL/chain"
else
    echo "  curl http://$LOAD_BALANCER_IP:8080/health"
    echo "  curl http://$LOAD_BALANCER_IP:8080/chain"
fi

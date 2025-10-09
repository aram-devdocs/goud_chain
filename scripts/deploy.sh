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

    # Rolling deployment functions
    wait_for_health() {
        local container=$1
        local max_wait=60
        local elapsed=0

        echo "Waiting for $container to become healthy..."
        while [ $elapsed -lt $max_wait ]; do
            HEALTH=$(sudo docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "none")
            if [ "$HEALTH" = "healthy" ]; then
                echo "✅ $container is healthy"
                return 0
            fi

            # If no health check, verify container is running
            if [ "$HEALTH" = "none" ]; then
                if sudo docker inspect --format='{{.State.Running}}' $container 2>/dev/null | grep -q "true"; then
                    echo "✅ $container is running (no health check configured)"
                    return 0
                fi
            fi

            sleep 2
            elapsed=$((elapsed + 2))
            echo -n "."
        done

        echo ""
        echo "❌ $container failed to become healthy after ${max_wait}s"
        return 1
    }

    rolling_update_node() {
        local node_name=$1
        local node_port=$2
        local p2p_port=$3
        local peers=$4

        echo "===  Rolling update: $node_name ==="

        # Build or pull new image
        if sudo docker pull ghcr.io/aram-devdocs/goud_chain:latest 2>/dev/null; then
            echo "✅ Pulled pre-built image"
            sudo docker tag ghcr.io/aram-devdocs/goud_chain:latest goud-chain:latest
        else
            echo "Building image locally..."
            sudo docker-compose -f docker-compose.gcp.yml build ${node_name}
        fi

        # Start new container alongside old one (temporary port)
        echo "Starting new ${node_name} container..."
        sudo docker run -d \
            --name ${node_name}_new \
            --network goud_network \
            -v ${node_name}_data:/data \
            -e NODE_ID=${node_name} \
            -e HTTP_PORT=8080 \
            -e P2P_PORT=9000 \
            -e PEERS=${peers} \
            goud-chain:latest

        # Wait for new container to be healthy
        if wait_for_health ${node_name}_new; then
            echo "New container healthy, switching over..."

            # Stop old container
            sudo docker stop goud_${node_name} 2>/dev/null || true
            sudo docker rm goud_${node_name} 2>/dev/null || true

            # Rename new container to production name
            sudo docker rename ${node_name}_new goud_${node_name}

            # Update port mappings (requires container restart)
            sudo docker stop goud_${node_name}
            sudo docker rm goud_${node_name}

            # Start with correct ports
            sudo docker run -d \
                --name goud_${node_name} \
                --network goud_network \
                -p ${node_port}:8080 \
                -p ${p2p_port}:9000 \
                -v ${node_name}_data:/data \
                -e NODE_ID=${node_name} \
                -e HTTP_PORT=8080 \
                -e P2P_PORT=9000 \
                -e PEERS=${peers} \
                --restart unless-stopped \
                goud-chain:latest

            # Final health check
            if wait_for_health goud_${node_name}; then
                echo "✅ ${node_name} updated successfully"
                return 0
            else
                echo "❌ ${node_name} failed final health check"
                return 1
            fi
        else
            echo "❌ New container failed health check, keeping old container"
            sudo docker stop ${node_name}_new 2>/dev/null || true
            sudo docker rm ${node_name}_new 2>/dev/null || true
            return 1
        fi
    }

    # Smart deployment with zero-downtime rolling updates
    echo "Starting zero-downtime deployment..."

    # Clean up dangling images to avoid ContainerConfig errors
    echo "Cleaning up dangling images..."
    sudo docker image prune -f 2>/dev/null || true

    # Ensure network exists
    sudo docker network create goud_network 2>/dev/null || true

    # Check if we have a running deployment (all core containers exist)
    NGINX_EXISTS=$(sudo docker ps -a --filter "name=^goud_nginx_lb$" --format "{{.Names}}" 2>/dev/null)
    NODE1_EXISTS=$(sudo docker ps -a --filter "name=^goud_node1$" --format "{{.Names}}" 2>/dev/null)
    NODE2_EXISTS=$(sudo docker ps -a --filter "name=^goud_node2$" --format "{{.Names}}" 2>/dev/null)

    echo "Container status: NGINX=${NGINX_EXISTS:-missing}, Node1=${NODE1_EXISTS:-missing}, Node2=${NODE2_EXISTS:-missing}"

    if [ -z "$NGINX_EXISTS" ] || [ -z "$NODE1_EXISTS" ] || [ -z "$NODE2_EXISTS" ]; then
        echo "Initial deployment or missing containers detected, starting all services..."

        # Clean start - remove any corrupted metadata
        sudo docker-compose -f docker-compose.gcp.yml down --remove-orphans 2>/dev/null || true
        sudo docker system prune -f 2>/dev/null || true

        # Build images
        sudo docker-compose -f docker-compose.gcp.yml build

        # Start all services
        sudo docker-compose -f docker-compose.gcp.yml up -d
        echo "✅ Initial deployment complete"
    else
        echo "Existing deployment detected, performing rolling update..."

        # Update NGINX config manually to avoid docker-compose ContainerConfig bug
        echo "Checking NGINX configuration..."
        if sudo docker exec goud_nginx_lb nginx -t 2>/dev/null; then
            echo "✅ NGINX config is valid"
        else
            echo "⚠️  NGINX config needs update, reloading..."
            sudo docker exec goud_nginx_lb nginx -s reload 2>/dev/null || {
                echo "NGINX reload failed, restarting container..."
                sudo docker restart goud_nginx_lb
            }
        fi

        # Rolling update: node2 first (node1 continues serving traffic)
        rolling_update_node "node2" "8082" "9002" "node1:9000"

        # Rolling update: node1 second (node2 now serves traffic)
        rolling_update_node "node1" "8081" "9001" "node2:9000"

        # Update dashboard (can have brief downtime, non-critical)
        echo "Updating dashboard..."
        if sudo docker pull ghcr.io/aram-devdocs/goud_chain-dashboard:latest 2>/dev/null; then
            echo "✅ Pulled pre-built dashboard image"
            sudo docker tag ghcr.io/aram-devdocs/goud_chain-dashboard:latest goud-chain-dashboard:latest

            # Graceful dashboard update
            sudo docker stop goud_dashboard 2>/dev/null || true
            sudo docker rm goud_dashboard 2>/dev/null || true
            sudo docker run -d \
                --name goud_dashboard \
                --network goud_network \
                -p 3000:8080 \
                --restart unless-stopped \
                goud-chain-dashboard:latest
        else
            echo "Building dashboard locally..."
            cd dashboard
            sudo docker build -t goud-chain-dashboard:latest .
            cd ..

            # Graceful dashboard update
            sudo docker stop goud_dashboard 2>/dev/null || true
            sudo docker rm goud_dashboard 2>/dev/null || true
            sudo docker run -d \
                --name goud_dashboard \
                --network goud_network \
                -p 3000:8080 \
                --restart unless-stopped \
                goud-chain-dashboard:latest
        fi

        echo "✅ Rolling deployment complete"
    fi

    echo ""
    echo "✅ Application deployed"
    sudo docker ps --filter "name=goud_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
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

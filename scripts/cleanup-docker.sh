#!/bin/bash
# Emergency cleanup script for Docker containers and images
# Use this if deployment fails with ContainerConfig errors
# Usage: ./scripts/cleanup-docker.sh [instance-ip]

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if instance IP is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Instance IP required${NC}"
    echo "Usage: $0 <instance-ip>"
    echo "Example: $0 35.239.38.147"
    exit 1
fi

INSTANCE_IP="$1"
SSH_KEY="${SSH_KEY:-~/.ssh/goud_chain_rsa}"

echo -e "${YELLOW}=== Docker Cleanup Script ===${NC}"
echo "Target: ubuntu@$INSTANCE_IP"
echo ""

# Verify SSH connectivity
echo "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$INSTANCE_IP "echo 'Connected'" >/dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to $INSTANCE_IP${NC}"
    echo "Make sure:"
    echo "  1. SSH key exists at $SSH_KEY"
    echo "  2. Instance is running"
    echo "  3. Firewall allows SSH access"
    exit 1
fi

echo -e "${GREEN}✅ Connected${NC}"
echo ""

# Perform cleanup
echo -e "${YELLOW}Performing aggressive Docker cleanup...${NC}"
ssh -i "$SSH_KEY" ubuntu@$INSTANCE_IP << 'ENDSSH'
    set -e
    cd /opt/goud-chain || { echo "Error: /opt/goud-chain not found"; exit 1; }

    echo "1. Stopping all containers..."
    sudo docker-compose -f docker-compose.gcp.yml down --remove-orphans 2>/dev/null || true
    sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true

    echo "2. Removing all containers..."
    sudo docker rm -f $(sudo docker ps -aq) 2>/dev/null || true

    echo "3. Removing all images..."
    sudo docker rmi -f $(sudo docker images -q) 2>/dev/null || true

    echo "4. Removing all volumes..."
    sudo docker volume rm $(sudo docker volume ls -q) 2>/dev/null || true

    echo "5. Pruning system (aggressive)..."
    sudo docker system prune -af --volumes

    echo "6. Verifying Docker state..."
    echo "   Containers: $(sudo docker ps -a | wc -l) (should be 1 - header line)"
    echo "   Images:     $(sudo docker images | wc -l) (should be 1 - header line)"
    echo "   Volumes:    $(sudo docker volume ls | wc -l) (should be 1 - header line)"

    echo ""
    echo "✅ Cleanup complete!"
ENDSSH

echo ""
echo -e "${GREEN}=== Cleanup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Run deployment again: ./scripts/deploy.sh"
echo "  2. Or manually redeploy:"
echo "     ssh ubuntu@$INSTANCE_IP"
echo "     cd /opt/goud-chain"
echo "     sudo docker-compose -f docker-compose.gcp.yml up -d --build"
echo ""

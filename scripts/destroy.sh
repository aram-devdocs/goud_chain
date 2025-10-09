#!/bin/bash
# Destroy Goud Chain infrastructure on Google Cloud Platform
# Usage: ./scripts/destroy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TERRAFORM_DIR="terraform/environments/dev"

echo -e "${RED}=== Destroying Goud Chain Infrastructure on GCP ===${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will permanently delete all infrastructure!${NC}"
echo "  - GCP compute instance (e2-micro VM)"
echo "  - All blockchain data stored on the instance"
echo "  - Firewall rules"
echo "  - Cloudflare DNS records (if enabled)"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Getting infrastructure details...${NC}"
cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}No Terraform state found. Nothing to destroy.${NC}"
    exit 0
fi

# Get instance IP before destroying
INSTANCE_IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")

if [ -n "$INSTANCE_IP" ]; then
    echo "Instance IP: $INSTANCE_IP"

    # Optional: Stop containers gracefully before destroying
    read -p "Attempt to stop Docker containers gracefully first? (y/n): " STOP_CONTAINERS

    if [ "$STOP_CONTAINERS" = "y" ]; then
        echo -e "${YELLOW}Stopping containers on $INSTANCE_IP...${NC}"
        ssh -i ~/.ssh/goud_chain_rsa -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$INSTANCE_IP << 'ENDSSH' || echo "Could not connect to stop containers (continuing anyway)"
            cd /opt/goud-chain 2>/dev/null || exit 0
            if [ -f docker-compose.gcp.yml ]; then
                docker-compose -f docker-compose.gcp.yml down
                echo "✅ Containers stopped"
            fi
ENDSSH
    fi
fi

echo ""
echo -e "${YELLOW}Step 2: Destroying infrastructure with Terraform...${NC}"

terraform destroy -auto-approve

echo ""
echo -e "${GREEN}✅ Infrastructure destroyed successfully${NC}"
echo ""
echo "Resources removed:"
echo "  - GCP compute instance"
echo "  - Firewall rules"
echo "  - Cloudflare DNS records (if configured)"
echo ""
echo "ℹ️  Note: Terraform state files remain in $TERRAFORM_DIR"
echo "   To completely clean up, run: rm -rf $TERRAFORM_DIR/.terraform $TERRAFORM_DIR/terraform.tfstate*"

#!/bin/bash
# Destroy all Goud Chain infrastructure in Oracle Cloud
# Usage: ./scripts/destroy.sh

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

TERRAFORM_DIR="terraform/environments/dev"

echo -e "${RED}=== WARNING: This will destroy ALL Goud Chain infrastructure ===${NC}"
echo ""
echo "This includes:"
echo "  - All VM instances"
echo "  - All block volumes (blockchain data will be lost)"
echo "  - Network configuration (VCN, subnets, etc.)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Destruction cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Destroying infrastructure...${NC}"

cd "$TERRAFORM_DIR"

if [ ! -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}No terraform state found. Nothing to destroy.${NC}"
    exit 0
fi

terraform destroy -auto-approve

echo ""
echo -e "${GREEN}✅ All infrastructure destroyed${NC}"
echo ""
echo "Note: Check Oracle Cloud Console to verify all resources are terminated"

#!/bin/bash
# Setup JWT and Session secrets for Goud Chain
# Generates secrets and stores them in GitHub Secrets only
# Secrets are injected at Docker build time via GitHub Actions
#
# Run this ONCE during initial setup

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Goud Chain Secret Setup ===${NC}"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: gh CLI not found${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl not found${NC}"
    echo "Install via: brew install openssl (macOS) or apt install openssl (Linux)"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check gh authentication
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    read -p "Press Enter after authenticating..."
fi

echo ""

# Generate secrets
echo -e "${YELLOW}Step 1: Generating secrets...${NC}"
JWT_SECRET=$(openssl rand -hex 64)      # 64 bytes = 512 bits
SESSION_SECRET=$(openssl rand -hex 64)

echo -e "${GREEN}✓ Secrets generated (64 bytes each)${NC}"
echo "  JWT Secret:     ${JWT_SECRET:0:16}... (truncated)"
echo "  Session Secret: ${SESSION_SECRET:0:16}... (truncated)"
echo ""

# Save to GitHub Secrets
echo -e "${YELLOW}Step 2: Storing secrets in GitHub Secrets...${NC}"

echo "$JWT_SECRET" | gh secret set JWT_SECRET
echo "$SESSION_SECRET" | gh secret set SESSION_SECRET

echo -e "${GREEN}✓ GitHub secrets updated${NC}"
echo ""

# Summary
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Secrets stored in GitHub Secrets:"
echo "  • JWT_SECRET"
echo "  • SESSION_SECRET"
echo ""
echo "Secrets will be injected at Docker build time via:"
echo "  .github/workflows/build-images.yml"
echo ""
echo "Next steps:"
echo "  1. Push code to trigger Docker image build"
echo "  2. Deploy to GCP: ./scripts/deploy.sh"
echo ""
echo "For rotation, run: ./scripts/rotate-secrets.sh"
echo ""

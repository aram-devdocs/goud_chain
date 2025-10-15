#!/bin/bash
# Rotate JWT and Session secrets for Goud Chain
# Generates new secrets and updates GitHub Secrets
# Requires rebuilding Docker images to take effect
#
# Run this periodically (recommended: every 90 days)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Goud Chain Secret Rotation ===${NC}"
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: gh CLI not found${NC}"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl not found${NC}"
    exit 1
fi

# Warning
echo -e "${YELLOW}⚠️  WARNING: Secret Rotation${NC}"
echo ""
echo "This will:"
echo "  • Generate new JWT and Session secrets"
echo "  • Update GitHub Secrets"
echo "  • Require Docker image rebuild (push to main branch)"
echo "  • Invalidate ALL existing user sessions"
echo ""
echo "Users will need to:"
echo "  • Re-authenticate with their API key (POST /account/login)"
echo ""
echo "⚠️  User data is NOT affected (encrypted with user's API key)"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rotation cancelled"
    exit 0
fi

echo ""

# Check gh authentication
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    read -p "Press Enter after authenticating..."
fi

# Generate new secrets
echo -e "${YELLOW}Step 1: Generating new secrets...${NC}"
JWT_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)

echo -e "${GREEN}✓ New secrets generated${NC}"
echo "  JWT Secret:     ${JWT_SECRET:0:16}... (truncated)"
echo "  Session Secret: ${SESSION_SECRET:0:16}... (truncated)"
echo ""

# Update GitHub Secrets
echo -e "${YELLOW}Step 2: Updating GitHub Secrets...${NC}"

echo "$JWT_SECRET" | gh secret set JWT_SECRET
echo "$SESSION_SECRET" | gh secret set SESSION_SECRET

echo -e "${GREEN}✓ GitHub secrets updated${NC}"
echo ""

# Summary
echo -e "${GREEN}=== Rotation Complete ===${NC}"
echo ""
echo "✓ GitHub Secrets updated (JWT_SECRET, SESSION_SECRET)"
echo ""
echo "Next steps:"
echo "  1. Rebuild Docker images (push to main or manually trigger build workflow)"
echo "  2. Redeploy application: ./scripts/deploy.sh"
echo "  3. Notify users that they need to re-authenticate"
echo ""
echo "Verify secrets:"
echo "  gh secret list"
echo ""
echo "Next rotation recommended: $(date -d '+90 days' '+%Y-%m-%d' 2>/dev/null || date -v+90d '+%Y-%m-%d' 2>/dev/null || echo '90 days from now')"
echo ""

#!/bin/bash
# Setup Google Cloud Platform project and credentials for Goud Chain
# This script guides you through GCP setup and generates terraform.tfvars
# Usage: ./scripts/setup-gcp.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Goud Chain GCP Setup ===${NC}"
echo "This script will help you set up Google Cloud Platform for Goud Chain deployment"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not found${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✅ gcloud CLI found${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: terraform not found${NC}"
    echo "Install it from: https://www.terraform.io/downloads"
    exit 1
fi
echo -e "${GREEN}✅ terraform found${NC}"

# Step 1: GCP Authentication
echo ""
echo -e "${BLUE}=== Step 1: GCP Authentication ===${NC}"
echo "Checking if you're logged in to gcloud..."

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "You need to authenticate with GCloud."
    gcloud auth login
    gcloud auth application-default login
else
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    echo -e "${GREEN}✅ Already logged in as: $CURRENT_ACCOUNT${NC}"
fi

# Step 2: Project Setup
echo ""
echo -e "${BLUE}=== Step 2: GCP Project Setup ===${NC}"
echo "You can either create a new project or use an existing one."
echo ""

read -p "Do you want to create a NEW project? (y/n): " CREATE_PROJECT

if [ "$CREATE_PROJECT" = "y" ]; then
    read -p "Enter a project ID (lowercase, numbers, hyphens only): " PROJECT_ID

    echo "Creating project $PROJECT_ID..."
    if gcloud projects create "$PROJECT_ID" --set-as-default; then
        echo -e "${GREEN}✅ Project created: $PROJECT_ID${NC}"
    else
        echo -e "${RED}Error creating project. It may already exist.${NC}"
        exit 1
    fi
else
    # List existing projects
    echo "Available projects:"
    gcloud projects list --format="table(projectId,name)"
    echo ""
    read -p "Enter the project ID you want to use: " PROJECT_ID

    gcloud config set project "$PROJECT_ID"
    echo -e "${GREEN}✅ Using project: $PROJECT_ID${NC}"
fi

# Step 3: Enable APIs
echo ""
echo -e "${BLUE}=== Step 3: Enabling Required APIs ===${NC}"
echo "Enabling Compute Engine API (required for VM instances)..."

gcloud services enable compute.googleapis.com

echo -e "${GREEN}✅ APIs enabled${NC}"

# Step 4: Service Account
echo ""
echo -e "${BLUE}=== Step 4: Service Account for Terraform ===${NC}"
SERVICE_ACCOUNT_NAME="goud-chain-terraform"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &>/dev/null; then
    echo -e "${YELLOW}Service account already exists: $SERVICE_ACCOUNT_EMAIL${NC}"
else
    echo "Creating service account..."
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Goud Chain Terraform Service Account"

    echo -e "${GREEN}✅ Service account created${NC}"

    # Wait for IAM propagation (GCP needs time to register the service account)
    echo "Waiting for IAM propagation (15 seconds)..."
    sleep 15
fi

# Grant roles
echo "Granting necessary IAM roles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/compute.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"

echo -e "${GREEN}✅ IAM roles granted${NC}"

# Create service account key
KEY_FILE="$HOME/.gcloud/goud-chain-terraform-key.json"
mkdir -p "$HOME/.gcloud"

if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}Service account key already exists at $KEY_FILE${NC}"
    read -p "Overwrite? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ]; then
        echo "Using existing key file"
    else
        gcloud iam service-accounts keys create "$KEY_FILE" \
            --iam-account="$SERVICE_ACCOUNT_EMAIL"
        echo -e "${GREEN}✅ New key created${NC}"
    fi
else
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SERVICE_ACCOUNT_EMAIL"
    echo -e "${GREEN}✅ Service account key created: $KEY_FILE${NC}"
fi

# Step 5: SSH Keys
echo ""
echo -e "${BLUE}=== Step 5: SSH Key Setup ===${NC}"
SSH_KEY_PATH="$HOME/.ssh/goud_chain_rsa"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}SSH key already exists at $SSH_KEY_PATH${NC}"
    SSH_PUBLIC_KEY=$(cat "${SSH_KEY_PATH}.pub")
else
    echo "Generating SSH key pair..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "goud-chain-gcp"
    echo -e "${GREEN}✅ SSH key created: $SSH_KEY_PATH${NC}"
    SSH_PUBLIC_KEY=$(cat "${SSH_KEY_PATH}.pub")
fi

# Step 6: Cloudflare (Optional)
echo ""
echo -e "${BLUE}=== Step 6: Cloudflare DNS Setup (Optional) ===${NC}"
read -p "Do you want to configure Cloudflare DNS? (y/n): " SETUP_DNS

if [ "$SETUP_DNS" = "y" ]; then
    read -p "Enter your domain name (e.g., goudchain.com): " DOMAIN_NAME
    read -p "Enter your Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    read -p "Enter your Cloudflare Zone ID: " CLOUDFLARE_ZONE_ID
    ENABLE_DNS="true"
    ENABLE_CLOUDFLARE_PROXY="true"
else
    DOMAIN_NAME="goudchain.com"
    CLOUDFLARE_API_TOKEN=""
    CLOUDFLARE_ZONE_ID=""
    ENABLE_DNS="false"
    ENABLE_CLOUDFLARE_PROXY="false"
fi

# Step 7: Generate terraform.tfvars
echo ""
echo -e "${BLUE}=== Step 7: Generating Terraform Configuration ===${NC}"

TFVARS_FILE="terraform/environments/dev/terraform.tfvars"
TFVARS_EXAMPLE_FILE="terraform/environments/dev/terraform.tfvars.example"

cat > "$TFVARS_FILE" <<EOF
# Goud Chain Terraform Configuration for GCP
# Generated by scripts/setup-gcp.sh

# GCP Project Configuration
project_id = "$PROJECT_ID"
region     = "us-central1"
zone       = "us-central1-a"

# Environment
environment  = "dev"
project_name = "goud-chain"

# Compute
machine_type      = "e2-micro"  # FREE tier eligible
boot_disk_size_gb = 30

# SSH Access
ssh_username   = "ubuntu"
ssh_public_key = "$SSH_PUBLIC_KEY"

# Network Security
allowed_ssh_cidrs  = ["0.0.0.0/0"]  # IMPORTANT: Restrict this in production!
allowed_http_cidrs = ["0.0.0.0/0"]

# DNS Configuration (Cloudflare)
enable_dns              = $ENABLE_DNS
domain_name             = "$DOMAIN_NAME"
cloudflare_api_token    = "$CLOUDFLARE_API_TOKEN"
cloudflare_zone_id      = "$CLOUDFLARE_ZONE_ID"
enable_cloudflare_proxy = $ENABLE_CLOUDFLARE_PROXY
dashboard_subdomain     = "dashboard"
api_subdomain           = "api"

# Tags
tags = {
  project     = "goud-chain"
  environment = "dev"
  managed_by  = "terraform"
}
EOF

# Also create an example file (without sensitive data)
cat > "$TFVARS_EXAMPLE_FILE" <<EOF
# Goud Chain Terraform Configuration Example
# Copy this to terraform.tfvars and fill in your values

project_id         = "your-gcp-project-id"
region             = "us-central1"
zone               = "us-central1-a"
environment        = "dev"
project_name       = "goud-chain"
machine_type       = "e2-micro"
boot_disk_size_gb  = 30
ssh_username       = "ubuntu"
ssh_public_key     = "ssh-rsa AAAAB3NzaC1yc2E..."
allowed_ssh_cidrs  = ["0.0.0.0/0"]
allowed_http_cidrs = ["0.0.0.0/0"]
enable_dns              = false
domain_name             = "goudchain.com"
cloudflare_api_token    = ""
cloudflare_zone_id      = ""
enable_cloudflare_proxy = false
tags = {
  project     = "goud-chain"
  environment = "dev"
  managed_by  = "terraform"
}
EOF

echo -e "${GREEN}✅ Terraform configuration created: $TFVARS_FILE${NC}"

# Set environment variable for Terraform
export GOOGLE_APPLICATION_CREDENTIALS="$KEY_FILE"

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo "📋 Summary:"
echo "  GCP Project ID:       $PROJECT_ID"
echo "  Service Account:      $SERVICE_ACCOUNT_EMAIL"
echo "  Service Account Key:  $KEY_FILE"
echo "  SSH Key:              $SSH_KEY_PATH"
echo "  Terraform Config:     $TFVARS_FILE"
echo ""
echo "🚀 Next Steps:"
echo "  1. Review your configuration in $TFVARS_FILE"
echo "  2. Deploy infrastructure:"
echo "     ./scripts/deploy.sh"
echo ""
echo "💡 Important Notes:"
echo "  - Keep your service account key secure!"
echo "  - The e2-micro instance is FREE tier eligible (1 instance per project)"
echo "  - FREE tier includes 30GB standard persistent disk"
echo "  - FREE tier includes 1GB egress per month"
echo ""
echo "🔐 GitHub Secrets Setup:"
echo "  To set up GitHub Actions deployment, run:"
echo "     ./scripts/setup-secrets.sh"

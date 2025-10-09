#!/bin/bash
# Setup GCS bucket for Terraform remote state
# This enables sharing Terraform state between local and GitHub Actions

set -e

PROJECT_ID="${1:-goudchain}"
BUCKET_NAME="${PROJECT_ID}-terraform-state"
REGION="us-central1"

echo "Setting up Terraform remote state backend..."
echo "Project: $PROJECT_ID"
echo "Bucket: $BUCKET_NAME"
echo ""

# Check if bucket already exists
if gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
    echo "✅ Bucket $BUCKET_NAME already exists"
else
    echo "Creating GCS bucket for Terraform state..."
    gsutil mb -p $PROJECT_ID -l $REGION -b on gs://$BUCKET_NAME

    # Enable versioning for state file history
    gsutil versioning set on gs://$BUCKET_NAME

    # Set lifecycle policy to keep only recent versions
    cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 10
        }
      }
    ]
  }
}
EOF
    gsutil lifecycle set /tmp/lifecycle.json gs://$BUCKET_NAME
    rm /tmp/lifecycle.json

    echo "✅ Bucket created with versioning enabled"
fi

echo ""
echo "Next steps:"
echo "1. Uncomment the backend configuration in terraform/environments/dev/main.tf"
echo "2. Run: cd terraform/environments/dev && terraform init -migrate-state"
echo "3. Confirm migration when prompted"
echo ""
echo "GitHub Actions will automatically use this backend."

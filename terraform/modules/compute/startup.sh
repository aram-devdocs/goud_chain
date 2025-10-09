#!/bin/bash
# Startup script for Goud Chain blockchain node on GCP
# This runs on instance first boot and sets up Docker environment

set -e

export DEBIAN_FRONTEND=noninteractive

echo "=== Goud Chain Startup Script ==="
echo "Starting at $(date)"

# Update system packages
echo "Updating system packages..."
apt-get update -y

# Install required packages
echo "Installing Docker, Git, and dependencies..."
apt-get install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release

# Enable and start Docker
echo "Enabling Docker service..."
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group
echo "Adding ubuntu user to docker group..."
usermod -aG docker ubuntu

# Create data directory for blockchain storage
echo "Creating data directory..."
mkdir -p /data
chmod 755 /data
chown ubuntu:ubuntu /data

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/goud-chain
chown ubuntu:ubuntu /opt/goud-chain

# Verify Docker installation
echo "Verifying Docker installation..."
docker --version
docker-compose --version

# Pull Docker images (to speed up first deployment)
echo "Pre-pulling Docker images..."
docker pull nginx:alpine || true
docker pull redis:7-alpine || true

echo "=== Startup script completed successfully at $(date) ==="
echo "Instance is ready for deployment"

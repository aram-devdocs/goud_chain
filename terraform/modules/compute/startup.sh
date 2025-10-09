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

# Install Docker Compose V2 (plugin) to replace legacy v1.29.2
echo "Installing Docker Compose V2..."
DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Create symlink for backwards compatibility (docker-compose -> docker compose)
ln -sf $DOCKER_CONFIG/cli-plugins/docker-compose /usr/local/bin/docker-compose

# Remove old docker-compose v1 if installed via apt
apt-get remove -y docker-compose || true

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

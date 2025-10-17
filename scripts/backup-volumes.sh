#!/bin/bash
# Goud Chain Volume Backup Script
# Creates compressed backups of blockchain data with integrity verification
#
# Usage: ./scripts/backup-volumes.sh [OPTIONS]
#
# Options:
#   -e, --environment ENV    Environment (local|gcp) [default: local]
#   -d, --dest DIR          Backup destination directory [default: ./backups]
#   -c, --cloud BUCKET      Cloud storage bucket (gs:// for GCS, s3:// for S3)
#   -k, --keep-running      Skip container shutdown (unsafe but faster)
#   -h, --help              Show this help message

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging helpers
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default values
ENVIRONMENT="local"
BACKUP_DIR="$PROJECT_ROOT/backups"
CLOUD_BUCKET=""
KEEP_RUNNING=false
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="goud-chain-backup-${ENVIRONMENT}-${TIMESTAMP}"

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dest)
                BACKUP_DIR="$2"
                shift 2
                ;;
            -c|--cloud)
                CLOUD_BUCKET="$2"
                shift 2
                ;;
            -k|--keep-running)
                KEEP_RUNNING=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Goud Chain Volume Backup Script

Creates compressed backups of blockchain data with integrity verification.

Usage: $0 [OPTIONS]

Options:
  -e, --environment ENV    Environment (local|gcp) [default: local]
  -d, --dest DIR          Backup destination directory [default: ./backups]
  -c, --cloud BUCKET      Cloud storage bucket (gs:// for GCS, s3:// for S3)
  -k, --keep-running      Skip container shutdown (unsafe but faster)
  -h, --help              Show this help message

Examples:
  # Basic backup (stops containers for consistency)
  $0 --environment local

  # Backup with custom destination
  $0 -e gcp -d /mnt/backups

  # Backup to Google Cloud Storage
  $0 -e gcp -c gs://goud-chain-backups

  # Fast backup without stopping containers (may be inconsistent)
  $0 -e local --keep-running

Notes:
  - Backups include all RocksDB data, checksums, and metadata
  - Containers are stopped by default to ensure consistency
  - Use --keep-running only for testing or if using snapshots
  - Cloud upload requires gsutil (GCS) or aws-cli (S3)

EOF
}

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(local|gcp)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT (must be local or gcp)"
        exit 1
    fi

    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        log_info "Run './config/scripts/generate-configs.sh $ENVIRONMENT' first"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    # Check for required commands
    local required_cmds=("docker" "sha256sum" "tar")
    for cmd in "${required_cmds[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done

    # Check for compression tool (prefer pigz for parallel compression)
    if command -v pigz &> /dev/null; then
        COMPRESS_CMD="pigz"
        COMPRESS_EXT="gz"
    elif command -v gzip &> /dev/null; then
        COMPRESS_CMD="gzip"
        COMPRESS_EXT="gz"
    else
        log_error "No compression tool found (need pigz or gzip)"
        exit 1
    fi

    # Check cloud storage tools if needed
    if [[ -n "$CLOUD_BUCKET" ]]; then
        if [[ "$CLOUD_BUCKET" == gs://* ]]; then
            if ! command -v gsutil &> /dev/null; then
                log_error "gsutil not found (required for GCS upload)"
                exit 1
            fi
        elif [[ "$CLOUD_BUCKET" == s3://* ]]; then
            if ! command -v aws &> /dev/null; then
                log_error "aws-cli not found (required for S3 upload)"
                exit 1
            fi
        else
            log_error "Invalid cloud bucket: $CLOUD_BUCKET (must start with gs:// or s3://)"
            exit 1
        fi
    fi
}

# Get list of volume names
get_volume_names() {
    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    
    # Extract volume names from docker-compose file
    docker compose -f "$compose_file" config --volumes 2>/dev/null | grep "_data$" || true
}

# Stop containers gracefully
stop_containers() {
    if [[ "$KEEP_RUNNING" == true ]]; then
        log_warn "Skipping container shutdown (--keep-running enabled)"
        log_warn "Backup may be inconsistent if writes are in progress"
        return 0
    fi

    log_info "Stopping containers gracefully..."
    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    
    docker compose -f "$compose_file" down || {
        log_error "Failed to stop containers"
        exit 1
    }
    
    log_success "Containers stopped"
}

# Start containers
start_containers() {
    if [[ "$KEEP_RUNNING" == true ]]; then
        return 0
    fi

    log_info "Starting containers..."
    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    
    docker compose -f "$compose_file" up -d || {
        log_error "Failed to start containers"
        exit 1
    }
    
    log_success "Containers started"
}

# Create backup directory
create_backup_directory() {
    mkdir -p "$BACKUP_DIR" || {
        log_error "Failed to create backup directory: $BACKUP_DIR"
        exit 1
    }
    
    log_info "Backup destination: $BACKUP_DIR"
}

# Collect metadata
collect_metadata() {
    local metadata_file="$1"
    
    log_info "Collecting metadata..."
    
    cat > "$metadata_file" << EOF
# Goud Chain Backup Metadata
backup_name: $BACKUP_NAME
timestamp: $TIMESTAMP
environment: $ENVIRONMENT
schema_version: $(grep 'SCHEMA_VERSION' "$PROJECT_ROOT/src/constants.rs" 2>/dev/null | grep -oP '".*?"' | tr -d '"' || echo "unknown")
docker_compose_version: $(docker compose version --short 2>/dev/null || echo "unknown")
compression: $COMPRESS_CMD
EOF

    # Add chain length if we can query it
    if [[ "$KEEP_RUNNING" == true ]]; then
        local api_port=8081
        if curl -s "http://localhost:${api_port}/health" > /dev/null 2>&1; then
            local chain_length=$(curl -s "http://localhost:${api_port}/health" | grep -oP '"chain_length":\s*\K\d+' || echo "unknown")
            echo "chain_length: $chain_length" >> "$metadata_file"
        fi
    fi
    
    log_success "Metadata collected"
}

# Backup volumes
backup_volumes() {
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$backup_path"
    
    log_info "Starting volume backup..."
    
    # Collect metadata first
    collect_metadata "$backup_path/metadata.txt"
    
    # Get all data volumes
    local volumes=$(get_volume_names)
    
    if [[ -z "$volumes" ]]; then
        log_error "No data volumes found for environment: $ENVIRONMENT"
        exit 1
    fi
    
    local volume_count=$(echo "$volumes" | wc -l)
    log_info "Found $volume_count volume(s) to backup"
    
    # Backup each volume
    local current=0
    for volume in $volumes; do
        current=$((current + 1))
        log_info "[$current/$volume_count] Backing up volume: $volume"
        
        # Create tar archive of volume data
        local volume_tar="$backup_path/${volume}.tar"
        
        docker run --rm \
            -v "${volume}:/data:ro" \
            -v "$backup_path:/backup" \
            alpine:latest \
            tar -cf "/backup/${volume}.tar" -C /data . || {
            log_error "Failed to backup volume: $volume"
            exit 1
        }
        
        # Compress the tar archive
        log_info "[$current/$volume_count] Compressing ${volume}.tar..."
        $COMPRESS_CMD "$volume_tar" || {
            log_error "Failed to compress volume backup: $volume"
            exit 1
        }
        
        # Generate checksum
        local archive="${volume}.tar.${COMPRESS_EXT}"
        log_info "[$current/$volume_count] Generating checksum for $archive..."
        (cd "$backup_path" && sha256sum "$archive" > "${archive}.sha256") || {
            log_error "Failed to generate checksum for: $archive"
            exit 1
        }
        
        log_success "[$current/$volume_count] Volume backed up: $volume"
    done
    
    # Create master checksum file for all archives
    log_info "Creating master checksum file..."
    (cd "$backup_path" && sha256sum *.tar.${COMPRESS_EXT} > CHECKSUMS.sha256) || {
        log_error "Failed to create master checksum file"
        exit 1
    }
    
    # Create final compressed archive
    log_info "Creating final backup archive..."
    local final_archive="${BACKUP_DIR}/${BACKUP_NAME}.tar.${COMPRESS_EXT}"
    tar -C "$BACKUP_DIR" -cf - "$BACKUP_NAME" | $COMPRESS_CMD > "$final_archive" || {
        log_error "Failed to create final backup archive"
        exit 1
    }
    
    # Generate final checksum
    (cd "$BACKUP_DIR" && sha256sum "$(basename "$final_archive")" > "${BACKUP_NAME}.sha256") || {
        log_error "Failed to generate final checksum"
        exit 1
    }
    
    # Clean up temporary directory
    rm -rf "$backup_path"
    
    log_success "Backup created: $final_archive"
    
    # Print backup size
    local size=$(du -h "$final_archive" | cut -f1)
    log_info "Backup size: $size"
}

# Upload to cloud storage
upload_to_cloud() {
    if [[ -z "$CLOUD_BUCKET" ]]; then
        return 0
    fi
    
    log_info "Uploading backup to cloud storage: $CLOUD_BUCKET"
    
    local final_archive="${BACKUP_DIR}/${BACKUP_NAME}.tar.${COMPRESS_EXT}"
    local checksum_file="${BACKUP_DIR}/${BACKUP_NAME}.sha256"
    
    if [[ "$CLOUD_BUCKET" == gs://* ]]; then
        # Google Cloud Storage
        gsutil cp "$final_archive" "$CLOUD_BUCKET/" || {
            log_error "Failed to upload backup to GCS"
            exit 1
        }
        gsutil cp "$checksum_file" "$CLOUD_BUCKET/" || {
            log_error "Failed to upload checksum to GCS"
            exit 1
        }
    elif [[ "$CLOUD_BUCKET" == s3://* ]]; then
        # Amazon S3
        aws s3 cp "$final_archive" "$CLOUD_BUCKET/" || {
            log_error "Failed to upload backup to S3"
            exit 1
        }
        aws s3 cp "$checksum_file" "$CLOUD_BUCKET/" || {
            log_error "Failed to upload checksum to S3"
            exit 1
        }
    fi
    
    log_success "Backup uploaded to cloud storage"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"
    log_info "Cleaning up old backups (retention: ${retention_days} days)..."
    
    # Clean local backups
    find "$BACKUP_DIR" -name "goud-chain-backup-*.tar.*" -mtime +"${retention_days}" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "goud-chain-backup-*.sha256" -mtime +"${retention_days}" -delete 2>/dev/null || true
    
    log_success "Old backups cleaned up"
}

# Main backup process
main() {
    parse_args "$@"
    
    log_info "=== Goud Chain Volume Backup ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $TIMESTAMP"
    echo ""
    
    validate_environment
    check_prerequisites
    create_backup_directory
    
    # Execute backup
    stop_containers
    backup_volumes
    start_containers
    
    # Optional cloud upload
    upload_to_cloud
    
    # Cleanup
    cleanup_old_backups
    
    echo ""
    log_success "=== Backup Complete ==="
    log_info "Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.${COMPRESS_EXT}"
    log_info "Checksum file: ${BACKUP_DIR}/${BACKUP_NAME}.sha256"
    
    if [[ -n "$CLOUD_BUCKET" ]]; then
        log_info "Cloud location: ${CLOUD_BUCKET}/${BACKUP_NAME}.tar.${COMPRESS_EXT}"
    fi
    
    echo ""
    log_info "To restore this backup:"
    echo "  ./scripts/restore-volumes.sh --backup ${BACKUP_DIR}/${BACKUP_NAME}.tar.${COMPRESS_EXT}"
}

# Trap errors and ensure containers are restarted
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Backup failed with exit code: $exit_code"
        if [[ "$KEEP_RUNNING" == false ]]; then
            log_info "Attempting to restart containers..."
            start_containers || true
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT

main "$@"

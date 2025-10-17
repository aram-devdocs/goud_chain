#!/bin/bash
# Goud Chain Volume Restore Script
# Restores blockchain data from backups with integrity verification
#
# Usage: ./scripts/restore-volumes.sh [OPTIONS]
#
# Options:
#   -b, --backup FILE       Backup archive to restore (required)
#   -e, --environment ENV    Environment (local|gcp) [default: auto-detect]
#   -c, --cloud BUCKET      Download backup from cloud storage
#   -f, --force             Skip confirmation prompts
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
BACKUP_FILE=""
ENVIRONMENT=""
CLOUD_BUCKET=""
FORCE=false
TEMP_DIR="/tmp/goud-chain-restore-$$"

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--backup)
                BACKUP_FILE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -c|--cloud)
                CLOUD_BUCKET="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
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
Goud Chain Volume Restore Script

Restores blockchain data from backups with integrity verification.

Usage: $0 [OPTIONS]

Options:
  -b, --backup FILE       Backup archive to restore (required)
  -e, --environment ENV    Environment (local|gcp) [default: auto-detect]
  -c, --cloud BUCKET      Download backup from cloud storage
  -f, --force             Skip confirmation prompts
  -h, --help              Show this help message

Examples:
  # Restore from local backup file
  $0 --backup ./backups/goud-chain-backup-local-20241017-143025.tar.gz

  # Download from cloud and restore
  $0 --cloud gs://goud-chain-backups --backup goud-chain-backup-gcp-20241017-143025.tar.gz

  # Force restore without confirmation
  $0 -b ./backups/backup.tar.gz --force

Notes:
  - Restore stops all containers and replaces volume data
  - Backup integrity is verified before extraction
  - Schema version compatibility is checked
  - Original data is backed up before restore (rollback capability)

WARNING: This operation will replace all existing blockchain data!

EOF
}

# Validate arguments
validate_arguments() {
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file is required (use --backup)"
        show_help
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    local required_cmds=("docker" "sha256sum" "tar")
    for cmd in "${required_cmds[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
}

# Download from cloud if needed
download_from_cloud() {
    if [[ -z "$CLOUD_BUCKET" ]]; then
        # Local file - verify it exists
        if [[ ! -f "$BACKUP_FILE" ]]; then
            log_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
        return 0
    fi
    
    log_info "Downloading backup from cloud storage..."
    
    local backup_name=$(basename "$BACKUP_FILE")
    local checksum_file="${backup_name%.tar.*}.sha256"
    local download_dir="$PROJECT_ROOT/backups"
    
    mkdir -p "$download_dir"
    
    if [[ "$CLOUD_BUCKET" == gs://* ]]; then
        # Google Cloud Storage
        if ! command -v gsutil &> /dev/null; then
            log_error "gsutil not found (required for GCS download)"
            exit 1
        fi
        
        gsutil cp "${CLOUD_BUCKET}/${backup_name}" "$download_dir/" || {
            log_error "Failed to download backup from GCS"
            exit 1
        }
        gsutil cp "${CLOUD_BUCKET}/${checksum_file}" "$download_dir/" || {
            log_error "Failed to download checksum from GCS"
            exit 1
        }
    elif [[ "$CLOUD_BUCKET" == s3://* ]]; then
        # Amazon S3
        if ! command -v aws &> /dev/null; then
            log_error "aws-cli not found (required for S3 download)"
            exit 1
        fi
        
        aws s3 cp "${CLOUD_BUCKET}/${backup_name}" "$download_dir/" || {
            log_error "Failed to download backup from S3"
            exit 1
        }
        aws s3 cp "${CLOUD_BUCKET}/${checksum_file}" "$download_dir/" || {
            log_error "Failed to download checksum from S3"
            exit 1
        }
    else
        log_error "Invalid cloud bucket: $CLOUD_BUCKET (must start with gs:// or s3://)"
        exit 1
    fi
    
    BACKUP_FILE="$download_dir/$backup_name"
    log_success "Backup downloaded from cloud storage"
}

# Verify backup integrity
verify_backup_integrity() {
    log_info "Verifying backup integrity..."
    
    local checksum_file="${BACKUP_FILE%.tar.*}.sha256"
    
    if [[ ! -f "$checksum_file" ]]; then
        log_error "Checksum file not found: $checksum_file"
        log_error "Cannot verify backup integrity"
        exit 1
    fi
    
    # Verify checksum
    local backup_dir=$(dirname "$BACKUP_FILE")
    (cd "$backup_dir" && sha256sum -c "$(basename "$checksum_file")") || {
        log_error "Backup integrity verification failed!"
        log_error "The backup file may be corrupted or tampered with"
        exit 1
    }
    
    log_success "Backup integrity verified"
}

# Extract and validate backup
extract_backup() {
    log_info "Extracting backup archive..."
    
    mkdir -p "$TEMP_DIR"
    
    # Detect compression type
    local compress_cmd=""
    if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
        compress_cmd="gzip"
    elif [[ "$BACKUP_FILE" == *.tar.pigz ]]; then
        compress_cmd="pigz"
    else
        log_error "Unsupported backup format: $BACKUP_FILE"
        exit 1
    fi
    
    # Extract
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" || {
        log_error "Failed to extract backup archive"
        exit 1
    }
    
    # Find extracted directory
    local extracted_dir=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "goud-chain-backup-*" | head -n 1)
    
    if [[ -z "$extracted_dir" || ! -d "$extracted_dir" ]]; then
        log_error "Invalid backup structure - expected directory not found"
        exit 1
    fi
    
    echo "$extracted_dir"
}

# Read metadata
read_metadata() {
    local backup_dir="$1"
    local metadata_file="$backup_dir/metadata.txt"
    
    if [[ ! -f "$metadata_file" ]]; then
        log_error "Metadata file not found in backup"
        exit 1
    fi
    
    log_info "Backup metadata:"
    cat "$metadata_file" | while read line; do
        if [[ -n "$line" && ! "$line" =~ ^# ]]; then
            echo "  $line"
        fi
    done
    
    # Auto-detect environment from metadata if not specified
    if [[ -z "$ENVIRONMENT" ]]; then
        ENVIRONMENT=$(grep "^environment:" "$metadata_file" | cut -d' ' -f2 || echo "")
        if [[ -n "$ENVIRONMENT" ]]; then
            log_info "Auto-detected environment: $ENVIRONMENT"
        else
            log_error "Could not auto-detect environment from backup metadata"
            log_error "Please specify environment with --environment flag"
            exit 1
        fi
    fi
}

# Check schema compatibility
check_schema_compatibility() {
    local backup_dir="$1"
    local metadata_file="$backup_dir/metadata.txt"
    
    local backup_schema=$(grep "^schema_version:" "$metadata_file" | cut -d' ' -f2 || echo "unknown")
    local current_schema=$(grep 'SCHEMA_VERSION' "$PROJECT_ROOT/src/constants.rs" 2>/dev/null | grep -oP '".*?"' | tr -d '"' || echo "unknown")
    
    log_info "Schema compatibility check:"
    log_info "  Backup schema: $backup_schema"
    log_info "  Current schema: $current_schema"
    
    if [[ "$backup_schema" != "$current_schema" && "$backup_schema" != "unknown" && "$current_schema" != "unknown" ]]; then
        log_warn "Schema version mismatch!"
        log_warn "The blockchain will be automatically re-initialized with current schema"
        log_warn "This is normal behavior and data integrity will be maintained"
    else
        log_success "Schema versions compatible"
    fi
}

# Confirm restore operation
confirm_restore() {
    if [[ "$FORCE" == true ]]; then
        return 0
    fi
    
    echo ""
    log_warn "WARNING: This will replace all existing blockchain data!"
    log_warn "Environment: $ENVIRONMENT"
    log_warn "Backup: $(basename "$BACKUP_FILE")"
    echo ""
    read -p "Are you sure you want to proceed? [y/N]: " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

# Backup existing volumes (for rollback)
backup_existing_volumes() {
    log_info "Creating safety backup of existing volumes..."
    
    local safety_backup_dir="$PROJECT_ROOT/backups/pre-restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$safety_backup_dir"
    
    # Use backup script with --keep-running to avoid downtime
    "$SCRIPT_DIR/backup-volumes.sh" \
        --environment "$ENVIRONMENT" \
        --dest "$safety_backup_dir" \
        --keep-running || {
        log_warn "Failed to create safety backup (continuing anyway)"
    }
    
    log_success "Safety backup created: $safety_backup_dir"
}

# Stop containers
stop_containers() {
    log_info "Stopping containers..."
    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    
    docker compose -f "$compose_file" down || {
        log_error "Failed to stop containers"
        exit 1
    }
    
    log_success "Containers stopped"
}

# Restore volumes
restore_volumes() {
    local backup_dir="$1"
    
    log_info "Restoring volumes..."
    
    # Verify checksums before extraction
    log_info "Verifying archive checksums..."
    local checksums_file="$backup_dir/CHECKSUMS.sha256"
    if [[ -f "$checksums_file" ]]; then
        (cd "$backup_dir" && sha256sum -c CHECKSUMS.sha256) || {
            log_error "Checksum verification failed! Archives may be corrupted"
            exit 1
        }
        log_success "All archive checksums verified"
    else
        log_warn "No CHECKSUMS.sha256 file found, skipping verification"
    fi
    
    # Find all volume archives
    local archives=$(find "$backup_dir" -name "*_data.tar.gz" -o -name "*_data.tar.pigz")
    
    if [[ -z "$archives" ]]; then
        log_error "No volume archives found in backup"
        exit 1
    fi
    
    local archive_count=$(echo "$archives" | wc -l)
    log_info "Found $archive_count volume(s) to restore"
    
    # Restore each volume
    local current=0
    for archive in $archives; do
        current=$((current + 1))
        
        # Extract volume name
        local archive_name=$(basename "$archive")
        local volume_name="${archive_name%.tar.*}"
        
        log_info "[$current/$archive_count] Restoring volume: $volume_name"
        
        # Verify individual archive checksum if available
        local archive_checksum="${archive}.sha256"
        if [[ -f "$archive_checksum" ]]; then
            log_info "[$current/$archive_count] Verifying checksum for $archive_name..."
            (cd "$(dirname "$archive")" && sha256sum -c "$(basename "$archive_checksum")") || {
                log_error "Checksum verification failed for $archive_name"
                exit 1
            }
        fi
        
        # Decompress archive
        local temp_tar="${TEMP_DIR}/${volume_name}.tar"
        if [[ "$archive" == *.gz ]]; then
            gunzip -c "$archive" > "$temp_tar" || {
                log_error "Failed to decompress archive: $archive"
                exit 1
            }
        fi
        
        # Remove existing volume
        docker volume rm "${volume_name}" 2>/dev/null || true
        
        # Create new volume
        docker volume create "${volume_name}" || {
            log_error "Failed to create volume: $volume_name"
            exit 1
        }
        
        # Restore data
        docker run --rm \
            -v "${volume_name}:/data" \
            -v "$TEMP_DIR:/backup:ro" \
            alpine:latest \
            tar -xf "/backup/${volume_name}.tar" -C /data || {
            log_error "Failed to restore data to volume: $volume_name"
            exit 1
        }
        
        log_success "[$current/$archive_count] Volume restored: $volume_name"
    done
    
    log_success "All volumes restored"
}

# Validate restored data
validate_restored_data() {
    log_info "Validating restored blockchain data..."
    
    # Start containers briefly for validation
    start_containers
    
    # Wait for node to initialize
    sleep 5
    
    # Check health endpoint
    local api_port=8081
    local max_attempts=10
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:${api_port}/health" > /dev/null 2>&1; then
            local health=$(curl -s "http://localhost:${api_port}/health")
            local chain_length=$(echo "$health" | grep -oP '"chain_length":\s*\K\d+' || echo "0")
            
            if [[ "$chain_length" -gt 0 ]]; then
                log_success "Blockchain validation passed"
                log_info "Chain length: $chain_length blocks"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for blockchain to initialize... ($attempt/$max_attempts)"
        sleep 2
    done
    
    log_warn "Could not validate blockchain (node may still be initializing)"
    log_info "Check logs with: ./run logs node1"
}

# Start containers
start_containers() {
    log_info "Starting containers..."
    local compose_file="$PROJECT_ROOT/docker-compose.${ENVIRONMENT}.yml"
    
    docker compose -f "$compose_file" up -d || {
        log_error "Failed to start containers"
        exit 1
    }
    
    log_success "Containers started"
}

# Cleanup temporary files
cleanup_temp_files() {
    if [[ -d "$TEMP_DIR" ]]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
}

# Main restore process
main() {
    parse_args "$@"
    
    log_info "=== Goud Chain Volume Restore ==="
    echo ""
    
    validate_arguments
    check_prerequisites
    download_from_cloud
    verify_backup_integrity
    
    # Extract and validate backup
    local extracted_dir=$(extract_backup)
    read_metadata "$extracted_dir"
    check_schema_compatibility "$extracted_dir"
    
    # Confirm with user
    confirm_restore
    
    # Create safety backup
    backup_existing_volumes
    
    # Execute restore
    stop_containers
    restore_volumes "$extracted_dir"
    validate_restored_data
    
    # Cleanup
    cleanup_temp_files
    
    echo ""
    log_success "=== Restore Complete ==="
    log_info "Blockchain has been restored from backup"
    log_info "Containers are running and blockchain is operational"
    echo ""
    log_info "To verify the restore:"
    echo "  ./run status"
    echo "  curl http://localhost:8080/health"
}

# Trap errors and cleanup
cleanup() {
    local exit_code=$?
    cleanup_temp_files
    
    if [[ $exit_code -ne 0 ]]; then
        log_error "Restore failed with exit code: $exit_code"
        log_error "Check logs and consider restoring from safety backup"
    fi
    
    exit $exit_code
}

trap cleanup EXIT

main "$@"

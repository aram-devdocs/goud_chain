# Goud Chain Operations Guide

Comprehensive guide for operating, maintaining, and troubleshooting Goud Chain blockchain infrastructure.

## Table of Contents

- [Persistent Storage Architecture](#persistent-storage-architecture)
- [Volume Management](#volume-management)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)
- [Disaster Recovery](#disaster-recovery)
- [Production Deployment](#production-deployment)

## Persistent Storage Architecture

### Overview

Goud Chain uses Docker persistent volumes with RocksDB for high-performance blockchain storage. All blockchain data (blocks, checkpoints, metadata) persists across container restarts.

### Storage Hierarchy

```
Docker Volume (node1_data, node2_data, node3_data)
└── /data                          # Container mount point
    ├── rocksdb/                   # RocksDB database directory
    │   ├── CURRENT                # Active manifest file
    │   ├── MANIFEST-*             # Database manifest
    │   ├── *.sst                  # Sorted string table files (blocks)
    │   ├── *.log                  # Write-ahead log
    │   └── OPTIONS-*              # RocksDB options
    ├── jwt_secret                 # JWT signing key (auto-generated)
    └── session_secret             # Session encryption key (auto-generated)
```

### Volume Configuration

**Local Development:**
- Driver: `local` (Docker's default volume driver)
- Location: `/var/lib/docker/volumes/` (Linux) or Docker Desktop storage
- Nodes: 3 volumes (`node1_data`, `node2_data`, `node3_data`)

**GCP Production:**
- Driver: `local` on persistent disk-backed VM
- Alternative: `gcePersistentDisk` for Kubernetes deployments
- Nodes: 2 volumes (`goud_node1_data`, `goud_node2_data`)
- Persistent disk type: `pd-ssd` (recommended for performance)

**AWS Production:**
- Driver: `local` on EBS-backed EC2
- Alternative: `awsElasticBlockStore` for Kubernetes deployments
- Volume type: `gp3` (recommended for cost/performance balance)

### Storage Requirements

**Estimated Growth:**
- Genesis block: ~10 KB
- Block with 10 collections: ~50-100 KB (depends on data size)
- RocksDB overhead: 3-5x amplification during compaction
- Snappy compression: ~50% reduction

**Recommended Provisioning:**
- Development: 10 GB per node
- Production (low traffic): 50 GB per node
- Production (high traffic): 200+ GB per node

**Monitor When:**
- Disk usage exceeds 70% (trigger backup/cleanup)
- Disk usage exceeds 85% (critical - expand volume)

## Volume Management

### Listing Volumes

```bash
# List all blockchain data volumes
./run volumes-list

# Docker command equivalent
docker volume ls | grep "node.*_data"
```

### Inspecting Volumes

```bash
# Inspect specific volume
./run volumes-inspect node1

# Get volume size and details
docker volume inspect node1_data
```

### Volume Health Check

```bash
# Check health of all volumes
./run volumes-check

# Output includes:
# - Volume size (disk usage)
# - Mount point
# - RocksDB status
# - SST file count
```

### Monitoring Volume Metrics

**Via API:**
```bash
# Get volume metrics via JSON API
curl http://localhost:8080/api/metrics | jq '.volume_metrics'

# Response:
{
  "disk_used_bytes": 1048576,
  "disk_used_mb": 1,
  "mount_path": "/data",
  "rocksdb_present": true,
  "sst_file_count": 42
}
```

**Via Prometheus:**
```bash
# Get Prometheus-formatted metrics
curl http://localhost:8080/api/metrics/prometheus | grep goud_volume

# Metrics:
# goud_volume_disk_used_bytes
# goud_volume_disk_used_mb
# goud_volume_rocksdb_present
# goud_volume_sst_files
```

### Manual Volume Operations

**Create volume:**
```bash
docker volume create node1_data
```

**Remove volume (⚠️ DESTRUCTIVE):**
```bash
# Stop containers first
./run stop

# Remove specific volume
docker volume rm node1_data

# Remove all data volumes
docker volume prune -f
```

**Inspect volume filesystem:**
```bash
# Access volume data directly
docker run --rm -it \
  -v node1_data:/data:ro \
  alpine:latest \
  sh

# Inside container:
ls -lh /data
du -sh /data/rocksdb
find /data/rocksdb -name "*.sst" | wc -l
```

## Backup and Recovery

### Automated Backup

**Create backup:**
```bash
# Local environment
./run backup local

# GCP production
./run backup gcp

# Custom destination
./scripts/backup-volumes.sh --environment local --dest /mnt/backups

# Upload to cloud storage
./scripts/backup-volumes.sh -e gcp -c gs://goud-chain-backups
./scripts/backup-volumes.sh -e gcp -c s3://goud-chain-backups
```

**Backup process:**
1. Stops containers gracefully (ensures RocksDB consistency)
2. Creates tar archive of each volume
3. Compresses with gzip/pigz (parallel compression)
4. Generates SHA-256 checksums
5. Creates metadata file (timestamp, schema version, chain length)
6. Optional cloud upload (GCS or S3)
7. Restarts containers
8. Cleans up old backups (30-day retention)

**Backup without downtime:**
```bash
# Use --keep-running flag (may produce inconsistent backup)
./scripts/backup-volumes.sh -e local --keep-running

# Better: Use filesystem snapshots (GCP/AWS)
# GCP Persistent Disk snapshot
gcloud compute disks snapshot DISK_NAME --snapshot-names=goud-backup-$(date +%Y%m%d)

# AWS EBS snapshot
aws ec2 create-snapshot --volume-id vol-xxx --description "Goud Chain backup"
```

### Restore from Backup

**Basic restore:**
```bash
# Restore from local backup file
./run restore ./backups/goud-chain-backup-local-20241017-143025.tar.gz

# Download from cloud and restore
./scripts/restore-volumes.sh \
  --cloud gs://goud-chain-backups \
  --backup goud-chain-backup-gcp-20241017-143025.tar.gz

# Force restore without confirmation
./scripts/restore-volumes.sh -b backup.tar.gz --force
```

**Restore process:**
1. Verifies backup integrity (SHA-256 checksum)
2. Extracts and validates metadata
3. Checks schema version compatibility
4. Creates safety backup of existing data
5. Stops containers
6. Removes existing volumes
7. Creates new volumes
8. Restores data from backup
9. Starts containers
10. Validates blockchain integrity

**Schema version handling:**
- If backup schema ≠ current schema → automatic re-initialization
- Genesis block preserved, pending data cleared
- Normal behavior, maintains blockchain immutability

### Backup Strategy

**Development:**
- Manual backups before major changes
- No automated backup (data regenerable)

**Production:**
- Automated daily backups (cron/systemd timer)
- 30-day local retention
- Cloud storage for disaster recovery
- Test restore quarterly

**Cron example:**
```bash
# /etc/cron.d/goud-chain-backup
0 2 * * * root /opt/goud-chain/scripts/backup-volumes.sh -e gcp -c gs://goud-chain-backups >> /var/log/goud-chain-backup.log 2>&1
```

**Systemd timer example:**
```ini
# /etc/systemd/system/goud-chain-backup.timer
[Unit]
Description=Goud Chain Daily Backup

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target

# /etc/systemd/system/goud-chain-backup.service
[Unit]
Description=Goud Chain Backup Service

[Service]
Type=oneshot
ExecStart=/opt/goud-chain/scripts/backup-volumes.sh -e gcp -c gs://goud-chain-backups
StandardOutput=journal
StandardError=journal
```

### Backup Verification

**Verify checksum:**
```bash
cd backups/
sha256sum -c goud-chain-backup-local-20241017-143025.sha256
```

**Test restore (dry run):**
```bash
# Extract backup without applying
tar -tzf goud-chain-backup-local-20241017-143025.tar.gz

# Validate metadata
tar -xzOf goud-chain-backup-local-20241017-143025.tar.gz \*/metadata.txt
```

## Monitoring and Alerts

### Health Checks

**Node health:**
```bash
./run status

# Check specific node
curl http://localhost:8081/health | jq
```

**Volume health:**
```bash
./run volumes-check
```

**Load balancer:**
```bash
./run lb-status
```

### Metrics Collection

**Prometheus Integration:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'goud-chain'
    static_configs:
      - targets:
        - 'localhost:8080'  # Load balancer endpoint
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s
```

**Grafana Dashboard:**
```json
{
  "dashboard": {
    "title": "Goud Chain Monitoring",
    "panels": [
      {
        "title": "Blockchain Length",
        "targets": [{"expr": "goud_chain_length"}]
      },
      {
        "title": "Volume Disk Usage",
        "targets": [{"expr": "goud_volume_disk_used_mb"}]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{"expr": "goud_key_cache_hit_rate"}]
      }
    ]
  }
}
```

### Alert Thresholds

**Critical Alerts:**
- Disk usage > 85% → Expand volume
- Node offline > 5 minutes → Investigate logs
- Chain length divergence > 10 blocks → Sync issue
- Backup failure 2 consecutive days → Manual intervention

**Warning Alerts:**
- Disk usage > 70% → Plan expansion
- Cache hit rate < 50% → Check workload pattern
- Peer count < 1 → Network connectivity issue
- Block creation time > 5s → Performance degradation

## Troubleshooting

### Volume Not Persisting

**Symptoms:** Blockchain resets to genesis after container restart.

**Diagnosis:**
```bash
# Check volume mount
docker inspect node1 | jq '.[0].Mounts'

# Verify volume exists
docker volume ls | grep node1_data

# Check volume contents
docker run --rm -v node1_data:/data:ro alpine ls -lah /data
```

**Solution:**
1. Verify volume is correctly mounted in `docker-compose.yml`
2. Check volume driver compatibility
3. Ensure RocksDB has write permissions (`chmod 755 /data`)
4. Review container logs: `./run logs node1`

### RocksDB Corruption

**Symptoms:** Container crashes on startup, "Corruption" errors in logs.

**Diagnosis:**
```bash
# Check RocksDB integrity
docker run --rm -v node1_data:/data:ro alpine \
  find /data/rocksdb -type f -name "*.sst"
```

**Solution:**
```bash
# Option 1: Restore from backup
./run restore ./backups/latest-backup.tar.gz

# Option 2: Clear volume and resync from peers
./run stop
docker volume rm node1_data
docker volume create node1_data
./run start
# Node will resync from peers via P2P
```

### Disk Space Exhausted

**Symptoms:** Container cannot write, "No space left on device" errors.

**Immediate Action:**
```bash
# Check disk usage
df -h
docker system df

# Free up space
docker system prune -a --volumes

# Remove old backups
find ./backups -name "*.tar.gz" -mtime +30 -delete
```

**Long-term Solution:**
1. Expand volume size (see [Volume Expansion](#volume-expansion))
2. Implement automated cleanup
3. Adjust backup retention policy
4. Consider data archival strategy

### Schema Version Mismatch

**Symptoms:** "Schema version mismatch" warning on startup.

**Behavior:** Automatic re-initialization with current schema (expected).

**Verification:**
```bash
# Check current schema version
grep SCHEMA_VERSION src/constants.rs

# Verify blockchain started fresh
curl http://localhost:8081/health | jq '.chain_length'
# Should be 1 (only genesis block)
```

**No action required** - this is normal during development.

### Backup Failure

**Symptoms:** Backup script exits with error code.

**Diagnosis:**
```bash
# Run backup with verbose output
./scripts/backup-volumes.sh -e local 2>&1 | tee backup-debug.log

# Check disk space
df -h ./backups

# Verify container status
./run status
```

**Common Causes:**
- Insufficient disk space (need 2x current volume size)
- Permission denied (run as user with Docker access)
- Container already stopped (use `--keep-running`)
- Compression tool missing (install `pigz` or `gzip`)

## Disaster Recovery

### Scenario 1: Single Node Failure

**Recovery Time Objective (RTO):** < 5 minutes  
**Recovery Point Objective (RPO):** 0 (no data loss)

**Steps:**
1. Stop failed node: `docker stop node1`
2. Start replacement node: `docker start node1`
3. Node auto-syncs from peers via P2P
4. Verify sync: `./run status`

**No backup needed** - P2P sync recovers from peers.

### Scenario 2: All Nodes Down

**RTO:** < 30 minutes  
**RPO:** Last backup (24 hours max)

**Steps:**
1. Download latest backup from cloud storage
2. Restore volumes: `./run restore backup.tar.gz`
3. Start all nodes: `./run start`
4. Verify blockchain: `./run status`
5. Check chain length matches backup metadata

### Scenario 3: Corrupted Volume

**RTO:** < 15 minutes  
**RPO:** Last backup

**Steps:**
1. Stop all nodes: `./run stop`
2. Remove corrupted volume: `docker volume rm node1_data`
3. Restore from backup: `./run restore backup.tar.gz`
4. Start nodes: `./run start`
5. Validate: `curl http://localhost:8081/health`

### Scenario 4: Complete Infrastructure Loss

**RTO:** < 2 hours  
**RPO:** Last cloud backup

**Steps:**
1. Provision new infrastructure (GCP VM, Docker, etc.)
2. Deploy Goud Chain: `./scripts/deploy.sh`
3. Download backup: `gsutil cp gs://bucket/backup.tar.gz ./`
4. Restore: `./run restore backup.tar.gz`
5. Update DNS to point to new infrastructure
6. Verify public API: `curl https://dev-api.goudchain.com/health`

## Production Deployment

### Pre-Deployment Checklist

- [ ] Persistent volumes configured (GCP Persistent Disk, AWS EBS)
- [ ] Backup automation configured (cron/systemd timer)
- [ ] Cloud storage bucket created (GCS/S3)
- [ ] Monitoring configured (Prometheus + Grafana)
- [ ] Alerts configured (PagerDuty, Slack, email)
- [ ] Secrets rotated (JWT_SECRET, SESSION_SECRET)
- [ ] Resource limits tuned (`config/base/constants.env`)
- [ ] Firewall rules configured (block P2P ports externally)
- [ ] Load balancer SSL configured (Cloudflare, cert-manager)
- [ ] Disaster recovery tested (restore from backup)

### Volume Expansion

**GCP Persistent Disk:**
```bash
# Stop containers
./run stop

# Resize disk on GCP
gcloud compute disks resize DISK_NAME --size=100GB

# Restart containers
./run start

# Verify new size
df -h
```

**AWS EBS:**
```bash
# Stop containers
./run stop

# Modify volume
aws ec2 modify-volume --volume-id vol-xxx --size 100

# Wait for modification to complete
aws ec2 describe-volumes-modifications --volume-id vol-xxx

# Extend filesystem
sudo resize2fs /dev/xvdf

# Restart containers
./run start
```

### Volume Migration

**Migrate to different volume driver:**
1. Backup current volumes: `./run backup gcp`
2. Update `config/environments/gcp/overrides.env`:
   ```bash
   VOLUME_DRIVER=gcePersistentDisk
   VOLUME_DRIVER_OPTS=...
   ```
3. Regenerate configs: `./config/scripts/generate-configs.sh gcp`
4. Remove old volumes: `docker volume rm goud_node1_data goud_node2_data`
5. Restore from backup: `./run restore backup.tar.gz`
6. Verify: `./run status`

### Security Best Practices

**Volume Permissions:**
- Mount volumes read-only where possible
- Restrict Docker socket access
- Use non-root containers (future enhancement)

**Backup Security:**
- Encrypt backups at rest (cloud provider encryption)
- Restrict access to backup buckets (IAM policies)
- Verify checksums before restore
- Audit backup access logs

**Network Security:**
- Isolate P2P network (internal Docker network)
- Expose only HTTP API via load balancer
- Use HTTPS for public endpoints (Cloudflare SSL)
- Rate limit API endpoints (built-in)

## Appendix

### Configuration Files

**Volume configuration:** `config/base/constants.env`
```bash
DATA_DIR=/data
VOLUME_DRIVER=local
VOLUME_DRIVER_OPTS=
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
```

**Docker Compose volumes:**
```yaml
volumes:
  node1_data:
    driver: local
  node2_data:
    driver: local
```

### Useful Commands

```bash
# Quick health check
./run status

# Volume health check
./run volumes-check

# Create backup
./run backup local

# Restore backup
./run restore ./backups/backup.tar.gz

# View logs
./run logs node1

# Clean everything (⚠️ DESTRUCTIVE)
./run clean

# Prune unused resources
./run prune
```

### Related Documentation

- [README.md](README.md) - Project overview and quick start
- [CLAUDE.md](CLAUDE.md) - Development guidelines
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - API integration guide
- [PERFORMANCE.md](PERFORMANCE.md) - Performance benchmarks
- [docs/SECRET_MANAGEMENT.md](docs/SECRET_MANAGEMENT.md) - Secret rotation procedures

### Support

**Issues:** [GitHub Issues](https://github.com/yourusername/goud-chain/issues)  
**Documentation:** [GitHub Wiki](https://github.com/yourusername/goud-chain/wiki)  
**License:** MIT

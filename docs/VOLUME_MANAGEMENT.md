# Volume Management Guide
**Last Updated:** 2025-10-17  
**Related:** [README.md](../README.md) | [CLAUDE.md](../CLAUDE.md)

Production-grade persistent volume management for Goud Chain blockchain data with automated backup/recovery and disaster recovery procedures.

## Quick Reference

### Volume Commands
```bash
./run volumes-list          # List all data volumes
./run volumes-inspect node1 # Inspect volume details
./run volumes-check         # Health check with disk usage
./run backup local          # Create backup
./run restore backup.tar.gz # Restore from backup
```

### API Metrics
```bash
# JSON metrics
curl http://localhost:8080/api/metrics | jq '.volume_metrics'

# Prometheus metrics  
curl http://localhost:8080/api/metrics/prometheus | grep goud_volume
```

## Storage Architecture

### Volume Structure
```
Docker Volume (node1_data, node2_data, node3_data)
└── /data                    # Container mount point
    ├── rocksdb/             # RocksDB database
    │   ├── CURRENT
    │   ├── MANIFEST-*
    │   ├── *.sst            # Block data files
    │   └── *.log            # Write-ahead log
    ├── jwt_secret           # Auto-generated
    └── session_secret       # Auto-generated
```

### Environment Configuration
- **Local:** Docker default driver, 3 nodes, no backups
- **GCP Production:** Local driver on persistent disk, 2 nodes, automated backups with pigz compression

### Storage Requirements
- **Development:** 10 GB per node
- **Production:** 50-200+ GB per node (depends on traffic)
- **Alert Thresholds:** 70% warning, 85% critical

## Backup & Recovery

### Automated Backup
```bash
# Basic backup (stops containers for consistency)
./run backup local

# Backup with cloud storage
./scripts/backup-volumes.sh -e gcp -c gs://goud-chain-backups

# Fast backup without downtime (may be inconsistent)
./scripts/backup-volumes.sh -e local --keep-running
```

**Backup Process:**
1. Stops containers (ensures RocksDB consistency)
2. Creates tar archives with compression (pigz/gzip)
3. Generates SHA-256 checksums
4. Creates metadata file (timestamp, schema version, chain length)
5. Optional cloud upload (GCS/S3)
6. Restarts containers
7. Cleans up old backups (30-day retention)

### Restore from Backup
```bash
# Restore from local file
./run restore ./backups/goud-chain-backup-local-20241017-143025.tar.gz

# Download from cloud and restore
./scripts/restore-volumes.sh \
  --cloud gs://goud-chain-backups \
  --backup goud-chain-backup-gcp-20241017-143025.tar.gz
```

**Restore Process:**
1. Verifies backup integrity (SHA-256)
2. Checks schema compatibility
3. Creates safety backup of existing data
4. Stops containers
5. Removes existing volumes
6. Creates new volumes and restores data
7. Validates blockchain integrity
8. Starts containers

### Automated Backup Schedule

**Cron example:**
```bash
# Daily backup at 2 AM
0 2 * * * /opt/goud-chain/scripts/backup-volumes.sh -e gcp -c gs://goud-chain-backups
```

**Systemd timer:**
```ini
# /etc/systemd/system/goud-chain-backup.timer
[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true
```

## Monitoring

### Volume Metrics (API)
```bash
curl http://localhost:8080/api/metrics
```

**Response:**
```json
{
  "volume_metrics": {
    "disk_used_bytes": 2621440,
    "disk_used_mb": 2,
    "mount_path": "/data",
    "rocksdb_present": true,
    "sst_file_count": 42
  }
}
```

### Prometheus Metrics
```
goud_volume_disk_used_bytes    # Disk usage in bytes
goud_volume_disk_used_mb       # Disk usage in megabytes  
goud_volume_rocksdb_present    # RocksDB status (1=present)
goud_volume_sst_files          # Number of SST files
```

### Alert Thresholds
- **Critical:** Disk usage > 85% → Expand volume
- **Warning:** Disk usage > 70% → Plan expansion
- **Critical:** Node offline > 5 minutes → Investigate
- **Warning:** Backup failure 2 consecutive days → Manual intervention

## Disaster Recovery

### Scenario 1: Single Node Failure
**RTO:** < 5 minutes | **RPO:** 0 (no data loss)

```bash
docker stop node1
docker start node1  # Auto-syncs from peers via P2P
./run status        # Verify sync
```

### Scenario 2: All Nodes Down  
**RTO:** < 30 minutes | **RPO:** Last backup (24 hours max)

```bash
./run restore backup.tar.gz
./run start
./run status
```

### Scenario 3: Corrupted Volume
**RTO:** < 15 minutes | **RPO:** Last backup

```bash
./run stop
docker volume rm node1_data
./run restore backup.tar.gz
./run start
```

### Scenario 4: Complete Infrastructure Loss
**RTO:** < 2 hours | **RPO:** Last cloud backup

```bash
# Provision new infrastructure
./scripts/deploy.sh

# Download and restore backup
gsutil cp gs://bucket/backup.tar.gz ./
./run restore backup.tar.gz

# Update DNS
# Verify: curl https://dev-api.goudchain.com/health
```

## Troubleshooting

### Volume Not Persisting
**Symptoms:** Blockchain resets after restart

**Diagnosis:**
```bash
docker inspect node1 | jq '.[0].Mounts'
docker volume ls | grep node1_data
docker run --rm -v node1_data:/data:ro alpine ls -lah /data
```

**Solution:** Verify volume mount in docker-compose.yml, check permissions

### RocksDB Corruption
**Symptoms:** Container crashes on startup, "Corruption" errors

**Solution:**
```bash
# Option 1: Restore from backup
./run restore backup.tar.gz

# Option 2: Clear and resync from peers
./run stop
docker volume rm node1_data
docker volume create node1_data
./run start
```

### Disk Space Exhausted
**Immediate Action:**
```bash
df -h
docker system prune -a --volumes
find ./backups -name "*.tar.gz" -mtime +30 -delete
```

**Long-term:** Expand volume, adjust retention policy

### Schema Version Mismatch
**Behavior:** Automatic re-initialization (expected during development)

**Verification:**
```bash
grep SCHEMA_VERSION src/constants.rs
curl http://localhost:8081/health | jq '.chain_length'
```

**No action required** - blockchain auto-reinitializes with current schema

## Production Deployment

### Pre-Deployment Checklist
- [ ] Cloud storage bucket configured (GCS/S3)
- [ ] Automated backup schedule configured
- [ ] Prometheus scraping configured
- [ ] Alerts configured (disk usage, backup failures)
- [ ] Volume expansion tested in staging
- [ ] Restore procedure tested

### Volume Expansion

**GCP:**
```bash
./run stop
gcloud compute disks resize DISK_NAME --size=100GB
./run start
df -h
```

**AWS:**
```bash
./run stop
aws ec2 modify-volume --volume-id vol-xxx --size 100
aws ec2 describe-volumes-modifications --volume-id vol-xxx
sudo resize2fs /dev/xvdf
./run start
```

### Security Best Practices
- Backup files: 0600 permissions (root/docker group only)
- Volume mounts: read-only where possible
- Cloud storage: provider encryption-at-rest enabled
- Checksums: verify before restore
- Access logs: audit backup access

## Configuration

### Environment Variables
```bash
# config/base/constants.env
DATA_DIR=/data
VOLUME_DRIVER=local
BACKUP_ENABLED=false
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=gzip  # or pigz for parallel
```

### Volume Driver Options
- **local:** Docker default (dev/production on VM)
- **gcePersistentDisk:** Google Kubernetes Engine
- **awsElasticBlockStore:** AWS EKS

## Related Documentation
- [README.md](../README.md) - Persistent storage overview
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- Script help: `./scripts/backup-volumes.sh --help`
- Script help: `./scripts/restore-volumes.sh --help`

## Support
- **Issues:** [GitHub Issues](https://github.com/yourusername/goud-chain/issues)
- **License:** MIT

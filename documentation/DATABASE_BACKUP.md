# Database Backup and Recovery Guide

## Overview

This guide provides comprehensive instructions for implementing automated PostgreSQL database backups for the SFL Prompt Studio application. The solution includes two deployment strategies, automated cleanup, and full recovery capabilities.

## Features

- ✅ **Automated Daily Backups**: Configurable scheduling with cron
- ✅ **Two Deployment Strategies**: Docker service or host-based cron
- ✅ **Compressed Backups**: Space-efficient gzip compression
- ✅ **Retention Management**: Automatic cleanup of old backups
- ✅ **Error Handling**: Comprehensive logging and error recovery
- ✅ **Recovery Tools**: Full database restoration capabilities
- ✅ **Production Ready**: Secure, scalable, and well-documented

## Quick Start

### 1. Basic Setup

```bash
# Navigate to project directory
cd /home/b08x/Workspace/Syncopated/SFL-Prompt-Studio

# Set up environment variables
cp scripts/.env.backup scripts/.env.backup.local
vim scripts/.env.backup.local  # Configure your settings

# Test backup manually
source scripts/.env.backup.local
./scripts/backup.sh -v
```

### 2. Choose Deployment Strategy

#### Strategy A: Docker Service (Recommended)

```bash
# Add backup service to docker-compose
docker-compose up -d db-backup

# View logs
docker-compose logs -f db-backup
```

#### Strategy B: Host Cron

```bash
# Set up automated host cron
./scripts/setup-host-cron.sh -v

# Check cron status
crontab -l
```

## Detailed Implementation

### Strategy A: Docker Backup Service

The backup service runs as a dedicated Docker container with the following characteristics:

**Advantages:**

- ✅ Self-contained and portable
- ✅ Uses same network as database
- ✅ Automatic startup with docker-compose
- ✅ Consistent environment

**Configuration:**

```yaml
# Already added to docker-compose.yml
db-backup:
  image: docker.io/pgvector/pgvector:pg16
  container_name: sfl-db-backup
  environment:
    - POSTGRES_HOST=db
    - POSTGRES_PORT=5432
    - POSTGRES_USER=user
    - POSTGRES_PASSWORD=password
    - POSTGRES_DB=sfl_db
    - BACKUP_PATH=/backups
    - BACKUP_RETENTION_DAYS=30
  volumes:
    - ./scripts:/scripts:ro
    - backup-data:/backups
    - ./logs:/logs
  # Runs daily at 2 AM
  command: |
    sh -c "
      apt-get update && apt-get install -y cron && 
      echo '0 2 * * * cd /scripts && ./backup.sh >> /logs/cron.log 2>&1' | crontab - &&
      cron -f
    "
```

**Deployment:**

```bash
# Start the backup service
docker-compose up -d db-backup

# Check service status
docker-compose ps db-backup

# View backup logs
docker-compose logs -f db-backup

# Access backup files
docker-compose exec db-backup ls -la /backups/

# Manual backup trigger
docker-compose exec db-backup /scripts/backup.sh -v
```

### Strategy B: Host Cron System

Runs backups from the host system using docker-compose exec.

**Advantages:**

- ✅ Uses host's cron system (more reliable)
- ✅ Easier to manage and monitor
- ✅ Direct access to backup files
- ✅ No additional containers

**Setup:**

```bash
# Automated setup
./scripts/setup-host-cron.sh --verbose

# Manual setup with custom schedule (weekly)
./scripts/setup-host-cron.sh --schedule "0 2 * * 0" --verbose

# View current configuration
./scripts/setup-host-cron.sh --help

# Remove cron job
./scripts/setup-host-cron.sh --remove
```

**Manual Cron Configuration:**

```bash
# Edit crontab directly
crontab -e

# Add this line for daily backups at 2 AM:
0 2 * * * cd /home/b08x/Workspace/Syncopated/SFL-Prompt-Studio/scripts && ./backup-wrapper.sh >/dev/null 2>&1
```

## Backup Script Configuration

### Environment Variables

Create and customize your environment file:

```bash
# Copy template
cp scripts/.env.backup scripts/.env.backup.local

# Edit configuration
vim scripts/.env.backup.local
```

**Required Variables:**

```bash
POSTGRES_HOST=localhost        # Database host
POSTGRES_PORT=5432            # Database port
POSTGRES_USER=user            # Database username
POSTGRES_PASSWORD=password    # Database password
POSTGRES_DB=sfl_db           # Database name
```

**Optional Variables:**

```bash
BACKUP_PATH=/path/to/backups  # Backup storage directory
BACKUP_RETENTION_DAYS=30      # Days to keep backups
```

### Script Options

```bash
# Basic usage
./scripts/backup.sh

# With retention period (7 days)
./scripts/backup.sh --retention 7

# Verbose output
./scripts/backup.sh --verbose

# Help information
./scripts/backup.sh --help
```

### Backup File Format

Backups are created with descriptive filenames:

```
sfl_db_backup_2024-01-15_143022.sql.gz
│       │        │        │
│       │        │        └── Time (14:30:22)
│       │        └──────────── Date (2024-01-15)
│       └───────────────────── Database name
└───────────────────────────── Prefix
```

## Database Recovery

### Recovery Script Usage

```bash
# Basic restore
./scripts/restore.sh /path/to/backup.sql.gz

# Force restore without confirmation
./scripts/restore.sh --force backup.sql.gz

# Clean restore (drops existing database)
./scripts/restore.sh --clean --force backup.sql.gz

# Verbose restore with confirmation
./scripts/restore.sh --verbose backup.sql.gz
```

### Manual Recovery Steps

1. **Stop Application Services:**

   ```bash
   docker-compose stop backend frontend
   ```

2. **Set Environment Variables:**

   ```bash
   source scripts/.env.backup.local
   ```

3. **Run Restore:**

   ```bash
   ./scripts/restore.sh --verbose /path/to/backup.sql.gz
   ```

4. **Verify Restoration:**

   ```bash
   # Check tables
   PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"
   
   # Check data
   PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM users;"
   ```

5. **Restart Services:**

   ```bash
   docker-compose up -d
   ```

### Recovery from Docker Backup Service

```bash
# List available backups
docker-compose exec db-backup ls -la /backups/

# Copy backup to host
docker-compose cp sfl-db-backup:/backups/sfl_db_backup_2024-01-15_143022.sql.gz ./

# Restore using copied backup
./scripts/restore.sh --force ./sfl_db_backup_2024-01-15_143022.sql.gz
```

## Monitoring and Maintenance

### Log Files

**Backup Logs:**

- Location: `./logs/backup.log`
- Content: Detailed backup operations, errors, and statistics
- Rotation: Managed by script (keeps last 50MB)

**Cron Logs (Strategy A):**

- Location: `./logs/cron.log`
- Content: Cron execution logs
- Access: `docker-compose logs db-backup`

**Restore Logs:**

- Location: `./logs/restore.log`
- Content: Restoration operations and verification

### Monitoring Commands

```bash
# Check backup status
ls -la ./backups/
tail -f ./logs/backup.log

# Verify backup integrity
gunzip -t ./backups/sfl_db_backup_*.sql.gz

# Check disk usage
du -sh ./backups/

# Database connectivity test
PGPASSWORD=password pg_isready -h localhost -p 5432 -U user -d sfl_db
```

### Backup Reports

Each backup generates a detailed report:

```bash
# View latest backup report
cat ./backups/backup_report.txt

# Reports include:
# - Total backups count
# - Storage usage
# - Oldest/newest backups
# - Recent backup history
```

## Advanced Configuration

### Custom Schedules

**Strategy A (Docker Service):**

```yaml
# Edit docker-compose.yml cron line:
echo '0 */6 * * * cd /scripts && ./backup.sh' | crontab -  # Every 6 hours
echo '0 2 * * 0 cd /scripts && ./backup.sh' | crontab -    # Weekly on Sunday
```

**Strategy B (Host Cron):**

```bash
# Every 6 hours
./scripts/setup-host-cron.sh --schedule "0 */6 * * *"

# Weekly on Sunday at 2 AM
./scripts/setup-host-cron.sh --schedule "0 2 * * 0"

# Monthly on the 1st at 2 AM
./scripts/setup-host-cron.sh --schedule "0 2 1 * *"
```

### Cloud Storage Integration

Extend backups to cloud storage:

```bash
# Add to backup.sh or create post-backup hook
upload_to_s3() {
    local backup_file="$1"
    aws s3 cp "$backup_file" s3://your-backup-bucket/postgresql/ \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
}

# Add encryption for sensitive data
encrypt_backup() {
    local backup_file="$1"
    gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
        --s2k-digest-algo SHA512 --s2k-count 65536 \
        --symmetric --output "${backup_file}.gpg" "$backup_file"
}
```

## Security Considerations

### Database Credentials

1. **Use Strong Passwords:**

   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

2. **Environment File Permissions:**

   ```bash
   chmod 600 scripts/.env.backup.local
   ```

3. **Backup File Permissions:**

   ```bash
   # Ensure only owner can read backups
   chmod 600 ./backups/*.sql.gz
   ```

### Network Security

- Database should only be accessible from application containers
- Consider using PostgreSQL connection encryption
- Implement proper firewall rules

### Backup Encryption

For production environments, consider encrypting backups:

```bash
# Example encryption during backup
pg_dump ... | gzip | gpg --symmetric --cipher-algo AES256 > backup.sql.gz.gpg
```

## Troubleshooting

### Common Issues

**1. Permission Denied:**

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix backup directory permissions
mkdir -p ./backups ./logs
chmod 755 ./backups ./logs
```

**2. Database Connection Failed:**

```bash
# Test connection manually
PGPASSWORD=password pg_isready -h localhost -p 5432 -U user -d sfl_db

# Check container status
docker-compose ps

# Check network connectivity
docker-compose exec backend ping db
```

**3. Backup Service Not Starting:**

```bash
# Check container logs
docker-compose logs db-backup

# Restart service
docker-compose restart db-backup

# Rebuild if needed
docker-compose build db-backup
```

**4. Disk Space Issues:**

```bash
# Check disk usage
df -h

# Clean old backups manually
find ./backups -name "*.sql.gz" -mtime +7 -delete

# Adjust retention period
./scripts/backup.sh --retention 7
```

**5. Cron Not Working (Strategy B):**

```bash
# Check cron service status
systemctl status cron

# Check cron logs
journalctl -u cron

# Verify cron job syntax
crontab -l
```

### Recovery Issues

**1. Restore Permission Denied:**

```bash
# Ensure user has createdb privileges
PGPASSWORD=password psql -h localhost -U user -d postgres -c "ALTER USER user CREATEDB;"
```

**2. Database Already Exists:**

```bash
# Use clean restore
./scripts/restore.sh --clean --force backup.sql.gz
```

**3. Backup File Corruption:**

```bash
# Test backup integrity
gunzip -t backup.sql.gz

# For custom format backups
pg_restore --list backup.dump
```

## Maintenance Tasks

### Weekly Tasks

- [ ] Verify backup files exist and are recent
- [ ] Check log files for errors
- [ ] Verify backup file integrity
- [ ] Test database connectivity

### Monthly Tasks

- [ ] Test backup restoration process
- [ ] Review backup retention policy
- [ ] Check disk space usage
- [ ] Update backup scripts if needed

### Quarterly Tasks

- [ ] Full disaster recovery test
- [ ] Review and update documentation
- [ ] Security audit of backup procedures
- [ ] Performance optimization review

## Support and Documentation

### Getting Help

1. **Check Logs:** Always start with log file analysis
2. **Test Components:** Verify database connectivity and script permissions
3. **Manual Testing:** Run scripts manually with verbose output
4. **Documentation:** Refer to PostgreSQL documentation for advanced features

### Useful Commands

```bash
# Quick backup test
source scripts/.env.backup.local && ./scripts/backup.sh -v

# Quick restore test
./scripts/restore.sh -v -f latest_backup.sql.gz

# Database size check
PGPASSWORD=password psql -h localhost -U user -d sfl_db -c "SELECT pg_size_pretty(pg_database_size('sfl_db'));"

# Connection count
PGPASSWORD=password psql -h localhost -U user -d sfl_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname='sfl_db';"
```

This comprehensive backup solution provides enterprise-grade database protection for your SFL Prompt Studio application with both automated daily backups and complete disaster recovery capabilities.

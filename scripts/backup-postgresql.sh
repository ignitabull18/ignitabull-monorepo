#!/bin/bash

# PostgreSQL Backup Script for Ignitabull
# Comprehensive backup strategy with retention, compression, and verification

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_NAME="ignitabull-$(date +%Y%m%d-%H%M%S)"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-ignitabull}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [BACKUP] $1"
}

error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >&2
    exit 1
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump not found. Install PostgreSQL client tools."
    fi
    
    if ! command -v gzip &> /dev/null; then
        error "gzip not found."
    fi
    
    if [[ -n "$S3_BUCKET" ]] && ! command -v aws &> /dev/null; then
        error "aws CLI not found but S3_BUCKET is configured."
    fi
    
    if [[ -n "$ENCRYPTION_KEY" ]] && ! command -v openssl &> /dev/null; then
        error "openssl not found but ENCRYPTION_KEY is configured."
    fi
    
    log "✅ Dependencies check passed"
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Cannot connect to PostgreSQL database"
    fi
    
    log "✅ Database connection successful"
}

# Create backup directory
setup_backup_dir() {
    log "Setting up backup directory: $BACKUP_DIR"
    
    mkdir -p "$BACKUP_DIR"
    chmod 750 "$BACKUP_DIR"
    
    if [[ ! -w "$BACKUP_DIR" ]]; then
        error "Backup directory is not writable: $BACKUP_DIR"
    fi
    
    log "✅ Backup directory ready"
}

# Perform database backup
backup_database() {
    log "Starting PostgreSQL backup..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.sql"
    local compressed_file="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    local encrypted_file="$BACKUP_DIR/${BACKUP_NAME}.sql.gz.enc"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup with verbose output
    log "Creating database dump..."
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --create \
        --clean \
        --if-exists \
        --format=custom \
        --compress=0 \
        --no-owner \
        --no-privileges \
        --file="$backup_file" \
        2>&1 | while read -r line; do
            log "pg_dump: $line"
        done
    
    if [[ ! -f "$backup_file" ]] || [[ ! -s "$backup_file" ]]; then
        error "Backup file was not created or is empty"
    fi
    
    local backup_size=$(du -h "$backup_file" | cut -f1)
    log "✅ Database backup created: $backup_file ($backup_size)"
    
    # Compress backup
    log "Compressing backup..."
    gzip -9 "$backup_file"
    
    if [[ ! -f "$compressed_file" ]]; then
        error "Compressed backup file was not created"
    fi
    
    local compressed_size=$(du -h "$compressed_file" | cut -f1)
    log "✅ Backup compressed: $compressed_file ($compressed_size)"
    
    # Encrypt if key provided
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        log "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -pass pass:"$ENCRYPTION_KEY"
        
        if [[ ! -f "$encrypted_file" ]]; then
            error "Encrypted backup file was not created"
        fi
        
        # Remove unencrypted file
        rm "$compressed_file"
        
        local encrypted_size=$(du -h "$encrypted_file" | cut -f1)
        log "✅ Backup encrypted: $encrypted_file ($encrypted_size)"
        
        backup_file="$encrypted_file"
    else
        backup_file="$compressed_file"
    fi
    
    # Create metadata file
    local metadata_file="$BACKUP_DIR/${BACKUP_NAME}.metadata.json"
    cat > "$metadata_file" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "port": $DB_PORT,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "file_size": "$(stat -c%s "$backup_file")",
  "compressed": true,
  "encrypted": $([ -n "$ENCRYPTION_KEY" ] && echo "true" || echo "false"),
  "pg_dump_version": "$(pg_dump --version | awk '{print $3}')"
}
EOF
    
    log "✅ Backup metadata created: $metadata_file"
    
    echo "$backup_file"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    log "Verifying backup integrity..."
    
    if [[ "$backup_file" == *.enc ]]; then
        if [[ -z "$ENCRYPTION_KEY" ]]; then
            log "⚠️  Cannot verify encrypted backup without encryption key"
            return 0
        fi
        
        # Test decryption
        if ! openssl enc -aes-256-cbc -d -in "$backup_file" -pass pass:"$ENCRYPTION_KEY" | gzip -t &> /dev/null; then
            error "Backup verification failed: encrypted file appears corrupted"
        fi
    elif [[ "$backup_file" == *.gz ]]; then
        # Test gzip integrity
        if ! gzip -t "$backup_file" &> /dev/null; then
            error "Backup verification failed: compressed file appears corrupted"
        fi
    fi
    
    log "✅ Backup integrity verified"
}

# Upload to S3 if configured
upload_to_s3() {
    local backup_file="$1"
    local metadata_file="$2"
    
    if [[ -z "$S3_BUCKET" ]]; then
        log "S3 upload skipped (no bucket configured)"
        return 0
    fi
    
    log "Uploading backup to S3: s3://$S3_BUCKET/postgresql/"
    
    # Upload backup file
    aws s3 cp "$backup_file" "s3://$S3_BUCKET/postgresql/" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=postgresql,database=$DB_NAME,timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    # Upload metadata
    aws s3 cp "$metadata_file" "s3://$S3_BUCKET/postgresql/"
    
    log "✅ Backup uploaded to S3"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "ignitabull-*.sql*" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "ignitabull-*.metadata.json" -type f -mtime +$RETENTION_DAYS -delete
    
    local deleted_local=$(find "$BACKUP_DIR" -name "ignitabull-*" -type f -mtime +$RETENTION_DAYS | wc -l)
    log "✅ Cleaned up $deleted_local old local backup files"
    
    # S3 cleanup if configured
    if [[ -n "$S3_BUCKET" ]]; then
        local cutoff_date=$(date -u -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/postgresql/" --recursive | \
            awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
            while read -r file; do
                aws s3 rm "s3://$S3_BUCKET/postgresql/$file"
            done
        log "✅ Cleaned up old S3 backup files"
    fi
}

# Send notification (if webhook configured)
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -z "${BACKUP_WEBHOOK_URL:-}" ]]; then
        return 0
    fi
    
    local payload=$(cat << EOF
{
  "status": "$status",
  "service": "postgresql-backup",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "message": "$message"
}
EOF
)
    
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time 10 \
        --silent || log "Failed to send notification"
}

# Main backup function
main() {
    log "🚀 Starting PostgreSQL backup for $DB_NAME"
    
    # Validation
    if [[ -z "$DB_PASSWORD" ]]; then
        error "POSTGRES_PASSWORD environment variable is required"
    fi
    
    # Setup
    check_dependencies
    test_connection
    setup_backup_dir
    
    # Backup
    local backup_file
    backup_file=$(backup_database)
    
    # Verify
    verify_backup "$backup_file"
    
    # Upload
    local metadata_file="$BACKUP_DIR/${BACKUP_NAME}.metadata.json"
    upload_to_s3 "$backup_file" "$metadata_file"
    
    # Cleanup
    cleanup_old_backups
    
    # Success notification
    local final_size=$(du -h "$backup_file" | cut -f1)
    local success_message="PostgreSQL backup completed successfully. Size: $final_size"
    log "✅ $success_message"
    send_notification "success" "$success_message"
}

# Handle interrupts
trap 'error "Backup interrupted"' INT TERM

# Help text
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    cat << EOF
PostgreSQL Backup Script for Ignitabull

Usage: $0 [options]

Environment Variables:
  POSTGRES_HOST               Database host (default: localhost)
  POSTGRES_PORT               Database port (default: 5432)
  POSTGRES_DB                 Database name (default: ignitabull)
  POSTGRES_USER               Database user (default: postgres)
  POSTGRES_PASSWORD           Database password (required)
  BACKUP_DIR                  Backup directory (default: /backups/postgresql)
  RETENTION_DAYS              Backup retention in days (default: 30)
  S3_BUCKET                   S3 bucket for remote storage (optional)
  BACKUP_ENCRYPTION_KEY       Encryption key for backups (optional)
  BACKUP_WEBHOOK_URL          Webhook for notifications (optional)

Examples:
  # Basic backup
  POSTGRES_PASSWORD=secret $0
  
  # Backup with S3 upload
  POSTGRES_PASSWORD=secret S3_BUCKET=my-backups $0
  
  # Encrypted backup
  POSTGRES_PASSWORD=secret BACKUP_ENCRYPTION_KEY=mykey123 $0

EOF
    exit 0
fi

# Run main function
main "$@"
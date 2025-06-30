#!/bin/bash

# Neo4j Backup Script for Ignitabull
# Comprehensive backup strategy with graph data export and verification

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups/neo4j}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_NAME="neo4j-$(date +%Y%m%d-%H%M%S)"
S3_BUCKET="${S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Neo4j configuration
NEO4J_URI="${NEO4J_URI:-bolt://localhost:7687}"
NEO4J_USERNAME="${NEO4J_USERNAME:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD}"
NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"

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
    
    if ! command -v cypher-shell &> /dev/null; then
        error "cypher-shell not found. Install Neo4j tools."
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

# Test Neo4j connection
test_connection() {
    log "Testing Neo4j connection..."
    
    if ! cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "RETURN 1" &> /dev/null; then
        error "Cannot connect to Neo4j database"
    fi
    
    log "✅ Neo4j connection successful"
}

# Setup backup directory
setup_backup_dir() {
    log "Setting up backup directory: $BACKUP_DIR"
    
    mkdir -p "$BACKUP_DIR"
    chmod 750 "$BACKUP_DIR"
    
    if [[ ! -w "$BACKUP_DIR" ]]; then
        error "Backup directory is not writable: $BACKUP_DIR"
    fi
    
    log "✅ Backup directory ready"
}

# Get database statistics
get_db_stats() {
    log "Gathering database statistics..."
    
    local stats_query='
    CALL db.schema.visualization() YIELD nodes, relationships 
    RETURN 
        nodes as nodeTypes,
        relationships as relationshipTypes
    UNION ALL
    MATCH (n)
    RETURN 
        count(n) as totalNodes,
        null as relationshipTypes
    UNION ALL
    MATCH ()-[r]->()
    RETURN 
        null as nodeTypes,
        count(r) as totalRelationships
    '
    
    cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "$stats_query" > "$BACKUP_DIR/${BACKUP_NAME}.stats.txt"
    
    log "✅ Database statistics gathered"
}

# Export all data using APOC
export_data() {
    log "Exporting Neo4j data..."
    
    local export_file="$BACKUP_DIR/${BACKUP_NAME}.cypher"
    
    # Export all nodes and relationships
    local export_query='
    CALL apoc.export.cypher.all("'$export_file'", {
        format: "cypher-shell",
        useOptimizations: {type: "UNWIND_BATCH", unwindBatchSize: 20},
        batchSize: 1000,
        streamStatements: true,
        separateFiles: false
    })
    YIELD file, batches, source, format, nodes, relationships, properties, time, rows, batchSize, batches as batchCount, done
    RETURN file, nodes, relationships, properties, time, done
    '
    
    cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "$export_query"
    
    if [[ ! -f "$export_file" ]] || [[ ! -s "$export_file" ]]; then
        error "Export file was not created or is empty"
    fi
    
    local export_size=$(du -h "$export_file" | cut -f1)
    log "✅ Data exported: $export_file ($export_size)"
    
    echo "$export_file"
}

# Export schema separately
export_schema() {
    log "Exporting Neo4j schema..."
    
    local schema_file="$BACKUP_DIR/${BACKUP_NAME}.schema.cypher"
    
    # Export schema (constraints, indexes)
    local schema_query='
    CALL apoc.export.cypher.schema("'$schema_file'", {})
    YIELD file, batches, source, format, nodes, relationships, properties, time, rows, batchSize, batches as batchCount, done
    RETURN file, nodes, relationships, properties, time, done
    '
    
    cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "$schema_query"
    
    if [[ -f "$schema_file" ]]; then
        local schema_size=$(du -h "$schema_file" | cut -f1)
        log "✅ Schema exported: $schema_file ($schema_size)"
        echo "$schema_file"
    else
        log "⚠️  Schema export file not created (may be empty)"
        echo ""
    fi
}

# Compress and encrypt backup files
process_backup_files() {
    local data_file="$1"
    local schema_file="$2"
    
    log "Processing backup files..."
    
    # Create tar archive
    local archive_file="$BACKUP_DIR/${BACKUP_NAME}.tar"
    tar -cf "$archive_file" -C "$BACKUP_DIR" "$(basename "$data_file")" "$(basename "$schema_file")" "${BACKUP_NAME}.stats.txt" "${BACKUP_NAME}.metadata.json"
    
    # Compress
    local compressed_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    gzip -9 "$archive_file"
    mv "${archive_file}.gz" "$compressed_file"
    
    if [[ ! -f "$compressed_file" ]]; then
        error "Compressed backup file was not created"
    fi
    
    local compressed_size=$(du -h "$compressed_file" | cut -f1)
    log "✅ Backup compressed: $compressed_file ($compressed_size)"
    
    # Encrypt if key provided
    local final_file="$compressed_file"
    if [[ -n "$ENCRYPTION_KEY" ]]; then
        log "Encrypting backup..."
        local encrypted_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz.enc"
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -pass pass:"$ENCRYPTION_KEY"
        
        if [[ ! -f "$encrypted_file" ]]; then
            error "Encrypted backup file was not created"
        fi
        
        # Remove unencrypted file
        rm "$compressed_file"
        
        local encrypted_size=$(du -h "$encrypted_file" | cut -f1)
        log "✅ Backup encrypted: $encrypted_file ($encrypted_size)"
        
        final_file="$encrypted_file"
    fi
    
    # Clean up individual files
    rm -f "$data_file" "$schema_file" "$BACKUP_DIR/${BACKUP_NAME}.stats.txt"
    
    echo "$final_file"
}

# Create metadata file
create_metadata() {
    local data_file="$1"
    local schema_file="$2"
    
    log "Creating backup metadata..."
    
    # Get database statistics
    local node_count=$(cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "MATCH (n) RETURN count(n) as count" --format plain | tail -n +2)
    local rel_count=$(cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" -d "$NEO4J_DATABASE" "MATCH ()-[r]->() RETURN count(r) as count" --format plain | tail -n +2)
    
    local metadata_file="$BACKUP_DIR/${BACKUP_NAME}.metadata.json"
    cat > "$metadata_file" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "database": "$NEO4J_DATABASE",
  "uri": "$NEO4J_URI",
  "username": "$NEO4J_USERNAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "node_count": $node_count,
  "relationship_count": $rel_count,
  "data_file_size": "$(stat -c%s "$data_file" 2>/dev/null || echo 0)",
  "schema_file_size": "$(stat -c%s "$schema_file" 2>/dev/null || echo 0)",
  "compressed": true,
  "encrypted": $([ -n "$ENCRYPTION_KEY" ] && echo "true" || echo "false"),
  "neo4j_version": "$(cypher-shell --version | awk '{print $2}' || echo 'unknown')"
}
EOF
    
    log "✅ Backup metadata created: $metadata_file"
    echo "$metadata_file"
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
        
        # Test decryption and tar integrity
        if ! openssl enc -aes-256-cbc -d -in "$backup_file" -pass pass:"$ENCRYPTION_KEY" | tar -tz &> /dev/null; then
            error "Backup verification failed: encrypted archive appears corrupted"
        fi
    else
        # Test tar integrity
        if ! tar -tzf "$backup_file" &> /dev/null; then
            error "Backup verification failed: archive appears corrupted"
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
    
    log "Uploading backup to S3: s3://$S3_BUCKET/neo4j/"
    
    # Upload backup file
    aws s3 cp "$backup_file" "s3://$S3_BUCKET/neo4j/" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=neo4j,database=$NEO4J_DATABASE,timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    # Upload metadata
    aws s3 cp "$metadata_file" "s3://$S3_BUCKET/neo4j/"
    
    log "✅ Backup uploaded to S3"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Local cleanup
    find "$BACKUP_DIR" -name "neo4j-*" -type f -mtime +$RETENTION_DAYS -delete
    
    local deleted_local=$(find "$BACKUP_DIR" -name "neo4j-*" -type f -mtime +$RETENTION_DAYS | wc -l)
    log "✅ Cleaned up $deleted_local old local backup files"
    
    # S3 cleanup if configured
    if [[ -n "$S3_BUCKET" ]]; then
        local cutoff_date=$(date -u -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/neo4j/" --recursive | \
            awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' | \
            while read -r file; do
                aws s3 rm "s3://$S3_BUCKET/neo4j/$file"
            done
        log "✅ Cleaned up old S3 backup files"
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -z "${BACKUP_WEBHOOK_URL:-}" ]]; then
        return 0
    fi
    
    local payload=$(cat << EOF
{
  "status": "$status",
  "service": "neo4j-backup", 
  "database": "$NEO4J_DATABASE",
  "uri": "$NEO4J_URI",
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
    log "🚀 Starting Neo4j backup for $NEO4J_DATABASE"
    
    # Validation
    if [[ -z "$NEO4J_PASSWORD" ]]; then
        error "NEO4J_PASSWORD environment variable is required"
    fi
    
    # Setup
    check_dependencies
    test_connection
    setup_backup_dir
    
    # Get statistics
    get_db_stats
    
    # Export data
    local data_file
    data_file=$(export_data)
    
    # Export schema
    local schema_file
    schema_file=$(export_schema)
    
    # Create metadata
    local metadata_file
    metadata_file=$(create_metadata "$data_file" "$schema_file")
    
    # Process files (compress/encrypt)
    local backup_file
    backup_file=$(process_backup_files "$data_file" "$schema_file")
    
    # Verify
    verify_backup "$backup_file"
    
    # Upload
    upload_to_s3 "$backup_file" "$metadata_file"
    
    # Cleanup
    cleanup_old_backups
    
    # Success notification
    local final_size=$(du -h "$backup_file" | cut -f1)
    local success_message="Neo4j backup completed successfully. Size: $final_size"
    log "✅ $success_message"
    send_notification "success" "$success_message"
}

# Handle interrupts
trap 'error "Backup interrupted"' INT TERM

# Help text
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    cat << EOF
Neo4j Backup Script for Ignitabull

Usage: $0 [options]

Environment Variables:
  NEO4J_URI                   Neo4j URI (default: bolt://localhost:7687)
  NEO4J_USERNAME              Neo4j username (default: neo4j)
  NEO4J_PASSWORD              Neo4j password (required)
  NEO4J_DATABASE              Neo4j database (default: neo4j)
  BACKUP_DIR                  Backup directory (default: /backups/neo4j)
  RETENTION_DAYS              Backup retention in days (default: 30)
  S3_BUCKET                   S3 bucket for remote storage (optional)
  BACKUP_ENCRYPTION_KEY       Encryption key for backups (optional)
  BACKUP_WEBHOOK_URL          Webhook for notifications (optional)

Requirements:
  - Neo4j with APOC procedures installed
  - cypher-shell command line tool

Examples:
  # Basic backup
  NEO4J_PASSWORD=secret $0
  
  # Backup with S3 upload
  NEO4J_PASSWORD=secret S3_BUCKET=my-backups $0
  
  # Encrypted backup
  NEO4J_PASSWORD=secret BACKUP_ENCRYPTION_KEY=mykey123 $0

EOF
    exit 0
fi

# Run main function
main "$@"
#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=7
DATABASE_URL="$DATABASE_URL"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to perform backup
perform_backup() {
    echo "Starting database backup..."
    
    # Create backup file
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    # Compress backup
    gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    echo "Backup completed: backup_$TIMESTAMP.sql.gz"
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "Backup file not found: $backup_file"
        exit 1
    fi
    
    echo "Starting database restore from $backup_file..."
    
    # Decompress backup if it's gzipped
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | psql "$DATABASE_URL"
    else
        psql "$DATABASE_URL" < "$backup_file"
    fi
    
    echo "Restore completed"
}

# Function to clean up old backups
cleanup_old_backups() {
    echo "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
}

# Main script
case "$1" in
    "backup")
        perform_backup
        cleanup_old_backups
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "Please specify backup file to restore from"
            exit 1
        fi
        restore_backup "$2"
        ;;
    "list")
        echo "Available backups:"
        ls -lh "$BACKUP_DIR"/backup_*.sql.gz
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>|list}"
        exit 1
        ;;
esac 
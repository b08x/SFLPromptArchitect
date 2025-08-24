#!/bin/bash

# =============================================================================
# PostgreSQL Database Backup Script for SFL Prompt Studio
# =============================================================================
# This script creates compressed backups of the PostgreSQL database using pg_dump.
# It includes error handling, logging, and configurable retention policies.
#
# Usage:
#   ./backup.sh [OPTIONS]
#
# Options:
#   -r, --retention DAYS    Number of days to retain backups (default: 30)
#   -v, --verbose          Enable verbose logging
#   -h, --help             Show this help message
#
# Environment Variables (required):
#   POSTGRES_HOST         Database host (default: localhost)
#   POSTGRES_PORT         Database port (default: 5432)
#   POSTGRES_USER         Database username
#   POSTGRES_PASSWORD     Database password
#   POSTGRES_DB           Database name
#   BACKUP_PATH           Directory to store backups (default: ./backups)
#
# =============================================================================

set -euo pipefail
# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../logs/backup.log"

# Default values
DEFAULT_RETENTION_DAYS=30
DEFAULT_BACKUP_PATH="${SCRIPT_DIR}/../backups"
DEFAULT_HOST="localhost"
DEFAULT_PORT="5432"

# Initialize variables
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}"
VERBOSE=false

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # Log to stdout if verbose or error/warning
    if [[ "$VERBOSE" == "true" ]] || [[ "$level" =~ ^(ERROR|WARNING)$ ]]; then
        echo "[$timestamp] [$level] $message" >&2
    fi
}

log_info() {
    log "INFO" "$@"
}

log_warning() {
    log "WARNING" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

# =============================================================================
# Utility Functions
# =============================================================================

show_help() {
    cat << EOF
PostgreSQL Database Backup Script for SFL Prompt Studio

Usage: $SCRIPT_NAME [OPTIONS]

OPTIONS:
    -r, --retention DAYS    Number of days to retain backups (default: $DEFAULT_RETENTION_DAYS)
    -v, --verbose          Enable verbose logging
    -h, --help             Show this help message

ENVIRONMENT VARIABLES:
    POSTGRES_HOST         Database host (default: $DEFAULT_HOST)
    POSTGRES_PORT         Database port (default: $DEFAULT_PORT)
    POSTGRES_USER         Database username (required)
    POSTGRES_PASSWORD     Database password (required)
    POSTGRES_DB           Database name (required)
    BACKUP_PATH           Directory to store backups (default: $DEFAULT_BACKUP_PATH)

EXAMPLES:
    # Basic backup
    ./backup.sh

    # Backup with 7-day retention and verbose output
    ./backup.sh -r 7 -v

    # Using environment file
    source .env && ./backup.sh

EXIT CODES:
    0    Success
    1    General error
    2    Missing required environment variables
    3    Database connection failed
    4    Backup creation failed
    5    Cleanup failed

EOF
}

validate_requirements() {
    log_info "Validating requirements..."
    
    # Check required environment variables
    local required_vars=("POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_error "Please set the required variables or check your .env file"
        return 2
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump >/dev/null 2>&1; then
        log_error "pg_dump command not found. Please install PostgreSQL client tools."
        return 1
    fi
    
    # Set default values for optional variables
    export POSTGRES_HOST="${POSTGRES_HOST:-$DEFAULT_HOST}"
    export POSTGRES_PORT="${POSTGRES_PORT:-$DEFAULT_PORT}"
    export BACKUP_PATH="${BACKUP_PATH:-$DEFAULT_BACKUP_PATH}"
    
    # Create backup directory
    if ! mkdir -p "$BACKUP_PATH"; then
        log_error "Failed to create backup directory: $BACKUP_PATH"
        return 1
    fi
    
    log_info "Requirements validated successfully"
    return 0
}

test_database_connection() {
    log_info "Testing database connection..."
    
    # Use pg_isready to test connection
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" >/dev/null 2>&1; then
        log_error "Database connection failed"
        log_error "Host: $POSTGRES_HOST:$POSTGRES_PORT"
        log_error "Database: $POSTGRES_DB"
        log_error "User: $POSTGRES_USER"
        return 3
    fi
    
    log_info "Database connection successful"
    return 0
}

create_backup() {
    local timestamp=$(date '+%Y-%m-%d_%H%M%S')
    local backup_filename="${POSTGRES_DB}_backup_${timestamp}.sql.gz"
    local backup_filepath="${BACKUP_PATH}/${backup_filename}"
    local temp_filepath="${backup_filepath}.tmp"
    
    log_info "Creating backup: $backup_filename"
    
    # Create backup with compression
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        --compress=9 \
        --file="$temp_filepath" 2>> "$LOG_FILE"; then
        
        log_error "Failed to create backup"
        rm -f "$temp_filepath"
        return 4
    fi
    
    # Move temp file to final location atomically
    if ! mv "$temp_filepath" "$backup_filepath"; then
        log_error "Failed to finalize backup file"
        rm -f "$temp_filepath"
        return 4
    fi
    
    # Verify backup file exists and has content
    if [[ ! -f "$backup_filepath" ]] || [[ ! -s "$backup_filepath" ]]; then
        log_error "Backup verification failed: file is missing or empty"
        return 4
    fi
    
    local backup_size=$(du -h "$backup_filepath" | cut -f1)
    log_success "Backup created successfully: $backup_filename ($backup_size)"
    
    # Store backup info for cleanup function
    echo "$backup_filepath" > "${BACKUP_PATH}/.last_backup"
    
    return 0
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    local find_command="find \"$BACKUP_PATH\" -name \"${POSTGRES_DB}_backup_*.sql.gz\" -type f -mtime +$RETENTION_DAYS"
    
    # First, count how many files will be deleted
    local files_to_delete
    files_to_delete=$(eval "$find_command" 2>/dev/null || true)
    
    if [[ -n "$files_to_delete" ]]; then
        while IFS= read -r file; do
            if rm -f "$file"; then
                log_info "Deleted old backup: $(basename "$file")"
                ((deleted_count++))
            else
                log_warning "Failed to delete: $(basename "$file")"
            fi
        done <<< "$files_to_delete"
    fi
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "Cleanup completed: $deleted_count old backup(s) deleted"
    else
        log_info "Cleanup completed: no old backups to delete"
    fi
    
    return 0
}

generate_backup_report() {
    log_info "Generating backup report..."
    
    local report_file="${BACKUP_PATH}/backup_report.txt"
    local total_backups=$(find "$BACKUP_PATH" -name "${POSTGRES_DB}_backup_*.sql.gz" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_PATH" 2>/dev/null | cut -f1 || echo "unknown")
    local oldest_backup=$(find "$BACKUP_PATH" -name "${POSTGRES_DB}_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | head -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")
    local newest_backup=$(find "$BACKUP_PATH" -name "${POSTGRES_DB}_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "none")
    
    cat > "$report_file" << EOF
SFL Prompt Studio Database Backup Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')

Database: $POSTGRES_DB
Host: $POSTGRES_HOST:$POSTGRES_PORT
Backup Path: $BACKUP_PATH

Statistics:
- Total Backups: $total_backups
- Total Size: $total_size
- Retention Period: $RETENTION_DAYS days
- Oldest Backup: $oldest_backup
- Newest Backup: $newest_backup

Recent Backups:
EOF
    
    find "$BACKUP_PATH" -name "${POSTGRES_DB}_backup_*.sql.gz" -type f -printf '%T@ %TY-%Tm-%Td %TH:%TM %s %f\n' 2>/dev/null | \
        sort -nr | head -10 | \
        awk '{printf "- %s %s %s (%d bytes)\n", $2, $3, $5, $4}' >> "$report_file"
    
    log_info "Backup report generated: $report_file"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    local exit_code=0
    
    log_info "Starting database backup process..."
    log_info "Script: $SCRIPT_NAME"
    log_info "PID: $$"
    
    # Validate requirements
    if ! validate_requirements; then
        exit_code=$?
        log_error "Requirements validation failed"
        exit $exit_code
    fi
    
    # Test database connection
    if ! test_database_connection; then
        exit_code=$?
        log_error "Database connection test failed"
        exit $exit_code
    fi
    
    # Create backup
    if ! create_backup; then
        exit_code=$?
        log_error "Backup creation failed"
        exit $exit_code
    fi
    
    # Cleanup old backups
    if ! cleanup_old_backups; then
        exit_code=$?
        log_warning "Backup cleanup encountered issues"
        # Don't exit on cleanup failure, as backup was successful
    fi
    
    # Generate report
    generate_backup_report
    
    log_success "Database backup process completed successfully"
    return $exit_code
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
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

# Validate retention days
if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || [[ "$RETENTION_DAYS" -lt 1 ]]; then
    log_error "Invalid retention days: $RETENTION_DAYS (must be a positive integer)"
    exit 1
fi

# Set up signal handlers for graceful shutdown
cleanup_on_exit() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script exited with code $exit_code"
        # Clean up any temporary files
        rm -f "${BACKUP_PATH}"/*.tmp 2>/dev/null || true
    fi
    exit $exit_code
}

trap cleanup_on_exit EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

# Run main function
main "$@"

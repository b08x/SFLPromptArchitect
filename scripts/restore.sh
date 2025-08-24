#!/bin/bash

# =============================================================================
# PostgreSQL Database Restore Script for SFL Prompt Studio
# =============================================================================
# This script restores a PostgreSQL database from a backup created by backup.sh
# It supports both compressed and uncompressed backup files.
#
# Usage:
#   ./restore.sh [OPTIONS] BACKUP_FILE
#
# Options:
#   -f, --force            Force restore without confirmation prompt
#   -c, --clean            Drop existing database before restore (dangerous!)
#   -v, --verbose          Enable verbose logging
#   -h, --help             Show this help message
#
# Environment Variables (required):
#   POSTGRES_HOST         Database host (default: localhost)
#   POSTGRES_PORT         Database port (default: 5432)
#   POSTGRES_USER         Database username (must have createdb privileges)
#   POSTGRES_PASSWORD     Database password
#   POSTGRES_DB           Target database name
#
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../logs/restore.log"

# Default values
DEFAULT_HOST="localhost"
DEFAULT_PORT="5432"

# Initialize variables
BACKUP_FILE=""
FORCE_RESTORE=false
CLEAN_DATABASE=false
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
    if [[ "$VERBOSE" == "true" ]] || [[ "$level" =~ ^(ERROR|WARNING|SUCCESS)$ ]]; then
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
PostgreSQL Database Restore Script for SFL Prompt Studio

Usage: $SCRIPT_NAME [OPTIONS] BACKUP_FILE

ARGUMENTS:
    BACKUP_FILE           Path to the backup file to restore
                         Supports: .sql, .sql.gz, and pg_dump custom format files

OPTIONS:
    -f, --force           Force restore without confirmation prompt
    -c, --clean           Drop existing database before restore (DANGEROUS!)
    -v, --verbose         Enable verbose logging
    -h, --help            Show this help message

ENVIRONMENT VARIABLES:
    POSTGRES_HOST         Database host (default: $DEFAULT_HOST)
    POSTGRES_PORT         Database port (default: $DEFAULT_PORT)
    POSTGRES_USER         Database username (must have createdb privileges)
    POSTGRES_PASSWORD     Database password
    POSTGRES_DB           Target database name

EXAMPLES:
    # Basic restore
    ./restore.sh /path/to/backup.sql.gz

    # Force restore without confirmation
    ./restore.sh -f backup_2024-01-01_120000.sql.gz

    # Clean restore (drops and recreates database)
    ./restore.sh -c -f backup.sql

    # Verbose restore
    ./restore.sh -v backup.sql.gz

SAFETY NOTES:
    - This script will OVERWRITE the target database
    - Always backup your current database before restoring
    - Use --clean option only if you want to completely replace the database
    - Ensure the backup file is compatible with your PostgreSQL version

EXIT CODES:
    0    Success
    1    General error
    2    Missing required parameters or files
    3    Database connection failed
    4    Restore operation failed

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
    
    # Set default values for optional variables
    export POSTGRES_HOST="${POSTGRES_HOST:-$DEFAULT_HOST}"
    export POSTGRES_PORT="${POSTGRES_PORT:-$DEFAULT_PORT}"
    
    # Validate backup file
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Backup file not specified"
        return 2
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        return 2
    fi
    
    if [[ ! -s "$BACKUP_FILE" ]]; then
        log_error "Backup file is empty: $BACKUP_FILE"
        return 2
    fi
    
    # Check if required PostgreSQL tools are available
    local required_tools=("psql" "pg_restore" "createdb" "dropdb")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required PostgreSQL tools: ${missing_tools[*]}"
        log_error "Please install PostgreSQL client tools"
        return 1
    fi
    
    log_info "Requirements validated successfully"
    return 0
}

test_database_connection() {
    log_info "Testing database connection..."
    
    # Test connection to PostgreSQL server (not necessarily the target database)
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "postgres" \
        -c "SELECT version();" >/dev/null 2>&1; then
        log_error "Cannot connect to PostgreSQL server"
        log_error "Host: $POSTGRES_HOST:$POSTGRES_PORT"
        log_error "User: $POSTGRES_USER"
        return 3
    fi
    
    log_info "Database server connection successful"
    return 0
}

check_database_exists() {
    log_info "Checking if target database exists..."
    
    local db_exists
    db_exists=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "postgres" \
        -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB';" 2>/dev/null || echo "")
    
    if [[ "$db_exists" == "1" ]]; then
        log_warning "Database '$POSTGRES_DB' already exists"
        return 0
    else
        log_info "Database '$POSTGRES_DB' does not exist"
        return 1
    fi
}

get_backup_info() {
    log_info "Analyzing backup file: $BACKUP_FILE"
    
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    local file_type=""
    
    # Determine file type
    if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
        file_type="Compressed SQL dump"
        local uncompressed_size=$(zcat "$BACKUP_FILE" | wc -c | numfmt --to=iec)
        log_info "File type: $file_type"
        log_info "Compressed size: $file_size"
        log_info "Uncompressed size: $uncompressed_size"
    elif [[ "$BACKUP_FILE" == *.sql ]]; then
        file_type="Plain SQL dump"
        log_info "File type: $file_type"
        log_info "File size: $file_size"
    else
        # Try to detect pg_dump custom format
        if file "$BACKUP_FILE" | grep -q "PostgreSQL custom database dump"; then
            file_type="PostgreSQL custom format"
            log_info "File type: $file_type"
            log_info "File size: $file_size"
        else
            file_type="Unknown format"
            log_warning "File type: $file_type - proceeding anyway"
            log_info "File size: $file_size"
        fi
    fi
    
    # Try to get backup timestamp from filename
    local timestamp_pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{6}"
    if [[ "$BACKUP_FILE" =~ $timestamp_pattern ]]; then
        local backup_timestamp=$(basename "$BACKUP_FILE" | grep -o "$timestamp_pattern" || echo "unknown")
        log_info "Backup timestamp: $backup_timestamp"
    fi
}

confirm_restore() {
    if [[ "$FORCE_RESTORE" == "true" ]]; then
        return 0
    fi
    
    echo ""
    echo "======================================"
    echo "DATABASE RESTORE CONFIRMATION"
    echo "======================================"
    echo "Host: $POSTGRES_HOST:$POSTGRES_PORT"
    echo "Database: $POSTGRES_DB"
    echo "Backup file: $(basename "$BACKUP_FILE")"
    echo ""
    
    if [[ "$CLEAN_DATABASE" == "true" ]]; then
        echo "⚠️  WARNING: --clean option specified"
        echo "⚠️  This will DROP the existing database completely!"
        echo ""
    fi
    
    echo "This will OVERWRITE the existing database content."
    echo "Make sure you have a backup of the current database!"
    echo ""
    
    read -p "Do you want to continue? [y/N] " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

drop_database() {
    log_warning "Dropping database: $POSTGRES_DB"
    
    # Terminate all connections to the database
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "postgres" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
    
    # Drop the database
    if ! PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$POSTGRES_DB" 2>/dev/null; then
        log_error "Failed to drop database: $POSTGRES_DB"
        return 4
    fi
    
    log_success "Database dropped successfully"
    return 0
}

create_database() {
    log_info "Creating database: $POSTGRES_DB"
    
    if ! PGPASSWORD="$POSTGRES_PASSWORD" createdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$POSTGRES_DB"; then
        log_error "Failed to create database: $POSTGRES_DB"
        return 4
    fi
    
    log_success "Database created successfully"
    return 0
}

restore_database() {
    log_info "Starting database restore..."
    
    local restore_command=""
    local temp_file=""
    
    # Determine restore method based on file type
    if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
        # Compressed SQL dump
        log_info "Restoring from compressed SQL dump..."
        restore_command="zcat '$BACKUP_FILE' | PGPASSWORD='$POSTGRES_PASSWORD' psql -h '$POSTGRES_HOST' -p '$POSTGRES_PORT' -U '$POSTGRES_USER' -d '$POSTGRES_DB' -v ON_ERROR_STOP=1"
        
    elif [[ "$BACKUP_FILE" == *.sql ]]; then
        # Plain SQL dump
        log_info "Restoring from plain SQL dump..."
        restore_command="PGPASSWORD='$POSTGRES_PASSWORD' psql -h '$POSTGRES_HOST' -p '$POSTGRES_PORT' -U '$POSTGRES_USER' -d '$POSTGRES_DB' -v ON_ERROR_STOP=1 -f '$BACKUP_FILE'"
        
    else
        # Try pg_restore for custom format
        log_info "Attempting restore with pg_restore..."
        restore_command="PGPASSWORD='$POSTGRES_PASSWORD' pg_restore -h '$POSTGRES_HOST' -p '$POSTGRES_PORT' -U '$POSTGRES_USER' -d '$POSTGRES_DB' --verbose --clean --if-exists '$BACKUP_FILE'"
    fi
    
    # Execute restore command
    log_info "Executing restore command..."
    if eval "$restore_command" 2>> "$LOG_FILE"; then
        log_success "Database restore completed successfully"
    else
        log_error "Database restore failed"
        log_error "Check log file for details: $LOG_FILE"
        return 4
    fi
    
    return 0
}

verify_restore() {
    log_info "Verifying restored database..."
    
    # Check if database exists and is accessible
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "\dt" >/dev/null 2>&1; then
        log_error "Cannot access restored database"
        return 4
    fi
    
    # Get table count
    local table_count
    table_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    log_info "Restored database contains $table_count tables"
    
    # Check for expected core tables
    local expected_tables=("users" "prompts" "workflows")
    local missing_tables=()
    
    for table in "${expected_tables[@]}"; do
        local table_exists
        table_exists=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" 2>/dev/null || echo "")
        
        if [[ "$table_exists" != "1" ]]; then
            missing_tables+=("$table")
        fi
    done
    
    if [[ ${#missing_tables[@]} -gt 0 ]]; then
        log_warning "Some expected tables are missing: ${missing_tables[*]}"
        log_warning "This might be normal depending on the backup content"
    else
        log_info "All expected core tables found"
    fi
    
    log_success "Database verification completed"
    return 0
}

generate_restore_report() {
    log_info "Generating restore report..."
    
    local report_file="${SCRIPT_DIR}/../logs/restore_report_$(date '+%Y%m%d_%H%M%S').txt"
    
    cat > "$report_file" << EOF
SFL Prompt Studio Database Restore Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')

Restore Details:
- Source Backup: $(basename "$BACKUP_FILE")
- Target Database: $POSTGRES_DB
- Host: $POSTGRES_HOST:$POSTGRES_PORT
- User: $POSTGRES_USER
- Clean Mode: $CLEAN_DATABASE
- Forced: $FORCE_RESTORE

Backup Information:
- File Size: $(du -h "$BACKUP_FILE" | cut -f1)
- File Path: $BACKUP_FILE

Database State After Restore:
EOF
    
    # Add table information
    echo "" >> "$report_file"
    echo "Tables in restored database:" >> "$report_file"
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "\dt" >> "$report_file" 2>/dev/null || echo "Unable to list tables" >> "$report_file"
    
    log_info "Restore report generated: $report_file"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_info "Starting database restore process..."
    log_info "Script: $SCRIPT_NAME"
    log_info "PID: $$"
    
    # Validate requirements
    if ! validate_requirements; then
        local exit_code=$?
        log_error "Requirements validation failed"
        exit $exit_code
    fi
    
    # Test database connection
    if ! test_database_connection; then
        local exit_code=$?
        log_error "Database connection test failed"
        exit $exit_code
    fi
    
    # Get backup file information
    get_backup_info
    
    # Confirm restore operation
    confirm_restore
    
    # Check if database exists
    local db_exists=false
    if check_database_exists; then
        db_exists=true
    fi
    
    # Handle database cleanup if requested
    if [[ "$CLEAN_DATABASE" == "true" ]] && [[ "$db_exists" == "true" ]]; then
        if ! drop_database; then
            local exit_code=$?
            log_error "Failed to drop database"
            exit $exit_code
        fi
        db_exists=false
    fi
    
    # Create database if it doesn't exist
    if [[ "$db_exists" == "false" ]]; then
        if ! create_database; then
            local exit_code=$?
            log_error "Failed to create database"
            exit $exit_code
        fi
    fi
    
    # Perform restore
    if ! restore_database; then
        local exit_code=$?
        log_error "Database restore failed"
        exit $exit_code
    fi
    
    # Verify restore
    if ! verify_restore; then
        local exit_code=$?
        log_warning "Database verification encountered issues"
        # Don't exit on verification failure, as restore might still be successful
    fi
    
    # Generate report
    generate_restore_report
    
    log_success "Database restore process completed successfully"
    return 0
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE_RESTORE=true
            shift
            ;;
        -c|--clean)
            CLEAN_DATABASE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$BACKUP_FILE" ]]; then
                BACKUP_FILE="$1"
            else
                log_error "Multiple backup files specified"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate that backup file was provided
if [[ -z "$BACKUP_FILE" ]]; then
    log_error "Backup file not specified"
    show_help
    exit 2
fi

# Convert to absolute path
BACKUP_FILE=$(realpath "$BACKUP_FILE" 2>/dev/null || echo "$BACKUP_FILE")

# Set up signal handlers for graceful shutdown
cleanup_on_exit() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script exited with code $exit_code"
    fi
    exit $exit_code
}

trap cleanup_on_exit EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

# Run main function
main "$@"
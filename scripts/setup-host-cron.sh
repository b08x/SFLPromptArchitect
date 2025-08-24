#!/bin/bash

# =============================================================================
# Host Cron Setup Script for PostgreSQL Database Backup - Strategy B
# =============================================================================
# This script sets up a cron job on the host machine to run database backups
# using docker-compose exec to access the PostgreSQL container.
#
# Usage:
#   ./setup-host-cron.sh [OPTIONS]
#
# Options:
#   -s, --schedule CRON    Cron schedule (default: "0 2 * * *" - daily at 2 AM)
#   -u, --user USER        User to run cron job as (default: current user)
#   -d, --docker-path PATH Path to docker-compose.yml (default: current directory)
#   -r, --remove           Remove existing cron job instead of adding
#   -v, --verbose          Enable verbose output
#   -h, --help             Show this help message
#
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Default values
DEFAULT_CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM
DEFAULT_DOCKER_PATH="$(dirname "$SCRIPT_DIR")"
DEFAULT_USER="$(whoami)"

# Initialize variables
CRON_SCHEDULE="$DEFAULT_CRON_SCHEDULE"
DOCKER_PATH="$DEFAULT_DOCKER_PATH"
CRON_USER="$DEFAULT_USER"
REMOVE_CRON=false
VERBOSE=false

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
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

show_help() {
    cat << EOF
Host Cron Setup Script for Database Backup - Strategy B

This script configures the host machine's cron daemon to run database backups
using docker-compose exec to access the PostgreSQL container.

Usage: $SCRIPT_NAME [OPTIONS]

OPTIONS:
    -s, --schedule CRON    Cron schedule (default: "$DEFAULT_CRON_SCHEDULE")
                          Examples:
                            "0 2 * * *"     - Daily at 2:00 AM
                            "0 2 * * 0"     - Weekly on Sunday at 2:00 AM
                            "0 */6 * * *"   - Every 6 hours
                            "0 2 1 * *"     - Monthly on 1st at 2:00 AM
    
    -u, --user USER        User to run cron job as (default: $DEFAULT_USER)
    -d, --docker-path PATH Path to docker-compose.yml directory (default: $DEFAULT_DOCKER_PATH)
    -r, --remove           Remove existing cron job instead of adding
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

REQUIREMENTS:
    - Docker and docker-compose installed
    - User has permissions to run docker-compose
    - SFL Prompt Studio containers are running

EXAMPLES:
    # Setup daily backup at 2 AM
    ./setup-host-cron.sh

    # Setup weekly backup on Sunday at 3 AM
    ./setup-host-cron.sh -s "0 3 * * 0"

    # Setup backup with custom docker path
    ./setup-host-cron.sh -d /path/to/sfl-prompt-studio

    # Remove existing cron job
    ./setup-host-cron.sh -r

    # Setup with verbose output
    ./setup-host-cron.sh -v

EOF
}

validate_requirements() {
    log_info "Validating requirements..."
    
    # Check if docker is available
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed or not in PATH"
        return 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed or not in PATH"
        return 1
    fi
    
    # Validate docker path
    if [[ ! -f "$DOCKER_PATH/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found at: $DOCKER_PATH"
        return 1
    fi
    
    # Check if backup script exists
    if [[ ! -f "$SCRIPT_DIR/backup.sh" ]]; then
        log_error "backup.sh script not found at: $SCRIPT_DIR/backup.sh"
        return 1
    fi
    
    # Check if user can run docker commands
    if ! docker ps >/dev/null 2>&1; then
        log_error "Cannot run docker commands. Please check Docker permissions."
        log_error "You may need to add your user to the docker group:"
        log_error "  sudo usermod -aG docker \$USER"
        return 1
    fi
    
    log_info "Requirements validated successfully"
    return 0
}

validate_cron_schedule() {
    local schedule="$1"
    
    # Basic validation - should have 5 fields
    local field_count=$(echo "$schedule" | wc -w)
    if [[ $field_count -ne 5 ]]; then
        log_error "Invalid cron schedule format: $schedule"
        log_error "Expected format: 'minute hour day month weekday'"
        log_error "Example: '0 2 * * *' (daily at 2 AM)"
        return 1
    fi
    
    # Test the cron expression
    if command -v crontab >/dev/null 2>&1; then
        # Create a temporary crontab to test the schedule
        local temp_cron=$(mktemp)
        echo "$schedule /bin/true" > "$temp_cron"
        
        if ! crontab -T "$temp_cron" >/dev/null 2>&1; then
            log_warning "Cron schedule may be invalid, but proceeding anyway"
        fi
        
        rm -f "$temp_cron"
    fi
    
    return 0
}

create_backup_wrapper() {
    local wrapper_script="$SCRIPT_DIR/backup-wrapper.sh"
    
    log_info "Creating backup wrapper script..."
    
    cat > "$wrapper_script" << EOF
#!/bin/bash

# =============================================================================
# Database Backup Wrapper Script for Host Cron - Strategy B
# =============================================================================
# This wrapper script is called by cron to run database backups using
# docker-compose exec to access the PostgreSQL container.
#
# Generated by: $SCRIPT_NAME
# Generated on: $(date)
# =============================================================================

set -euo pipefail

# Configuration
DOCKER_PATH="$DOCKER_PATH"
SCRIPT_DIR="$SCRIPT_DIR"
LOG_FILE="\${SCRIPT_DIR}/../logs/host-cron-backup.log"

# Ensure log directory exists
mkdir -p "\$(dirname "\$LOG_FILE")"

# Function to log with timestamp
log_with_timestamp() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$*" >> "\$LOG_FILE"
}

# Change to docker-compose directory
cd "\$DOCKER_PATH"

log_with_timestamp "Starting host cron backup process..."

# Check if containers are running
if ! docker-compose ps db | grep -q "Up"; then
    log_with_timestamp "ERROR: Database container is not running"
    exit 1
fi

# Set environment variables for backup
export POSTGRES_HOST=db
export POSTGRES_PORT=5432
export POSTGRES_USER=user
export POSTGRES_PASSWORD=password
export POSTGRES_DB=sfl_db
export BACKUP_PATH="\${SCRIPT_DIR}/../backups"

# Ensure backup directory exists on host
mkdir -p "\$BACKUP_PATH"

# Copy backup script into container and run it
if docker-compose exec -T db bash -c "
    # Install required packages if needed
    apt-get update >/dev/null 2>&1 || true
    apt-get install -y gzip >/dev/null 2>&1 || true
    
    # Set environment variables
    export POSTGRES_HOST=localhost
    export POSTGRES_PORT=5432
    export POSTGRES_USER=user
    export POSTGRES_PASSWORD=password
    export POSTGRES_DB=sfl_db
    export BACKUP_PATH=/tmp/backup
    
    # Create temp backup directory
    mkdir -p /tmp/backup
    
    # Run pg_dump directly
    TIMESTAMP=\\\$(date '+%Y-%m-%d_%H%M%S')
    BACKUP_FILE=\"sfl_db_backup_\\\${TIMESTAMP}.sql.gz\"
    
    echo \"Creating backup: \\\$BACKUP_FILE\"
    
    pg_dump -U user -d sfl_db --no-password --verbose --clean --if-exists --create | gzip > \"/tmp/backup/\\\$BACKUP_FILE\"
    
    if [[ -f \"/tmp/backup/\\\$BACKUP_FILE\" ]] && [[ -s \"/tmp/backup/\\\$BACKUP_FILE\" ]]; then
        echo \"Backup created successfully: \\\$BACKUP_FILE\"
        echo \"/tmp/backup/\\\$BACKUP_FILE\"
    else
        echo \"ERROR: Backup creation failed\"
        exit 1
    fi
"; then
    # Get the backup file path from container output
    CONTAINER_BACKUP=\$(docker-compose exec -T db bash -c "ls -t /tmp/backup/*.sql.gz | head -1" 2>/dev/null | tr -d '\r')
    
    if [[ -n "\$CONTAINER_BACKUP" ]]; then
        # Copy backup from container to host
        BACKUP_NAME=\$(basename "\$CONTAINER_BACKUP")
        docker-compose cp "db:\$CONTAINER_BACKUP" "\$BACKUP_PATH/\$BACKUP_NAME"
        
        if [[ -f "\$BACKUP_PATH/\$BACKUP_NAME" ]]; then
            log_with_timestamp "SUCCESS: Backup copied to host: \$BACKUP_NAME"
            
            # Cleanup old backups (keep last 30 days)
            find "\$BACKUP_PATH" -name "sfl_db_backup_*.sql.gz" -type f -mtime +30 -delete 2>/dev/null || true
            
            # Clean up container backup
            docker-compose exec -T db rm -f "\$CONTAINER_BACKUP" 2>/dev/null || true
        else
            log_with_timestamp "ERROR: Failed to copy backup to host"
            exit 1
        fi
    else
        log_with_timestamp "ERROR: No backup file found in container"
        exit 1
    fi
else
    log_with_timestamp "ERROR: Backup command failed"
    exit 1
fi

log_with_timestamp "Host cron backup process completed successfully"
EOF

    chmod +x "$wrapper_script"
    log_success "Backup wrapper script created: $wrapper_script"
    
    return 0
}

get_current_cron() {
    local backup_marker="# SFL Prompt Studio Database Backup"
    crontab -l 2>/dev/null | grep -A1 "$backup_marker" | tail -1 | grep -v "$backup_marker" || true
}

remove_cron_job() {
    log_info "Removing existing cron job..."
    
    local backup_marker="# SFL Prompt Studio Database Backup"
    local temp_cron=$(mktemp)
    
    # Get current crontab without the backup job
    crontab -l 2>/dev/null | grep -v -A1 "$backup_marker" | grep -v "backup-wrapper.sh" > "$temp_cron" || true
    
    # Install the updated crontab
    if crontab "$temp_cron"; then
        log_success "Cron job removed successfully"
    else
        log_error "Failed to remove cron job"
        rm -f "$temp_cron"
        return 1
    fi
    
    rm -f "$temp_cron"
    
    # Remove wrapper script
    local wrapper_script="$SCRIPT_DIR/backup-wrapper.sh"
    if [[ -f "$wrapper_script" ]]; then
        rm -f "$wrapper_script"
        log_info "Backup wrapper script removed"
    fi
    
    return 0
}

add_cron_job() {
    log_info "Adding cron job for database backup..."
    
    # Create backup wrapper
    if ! create_backup_wrapper; then
        log_error "Failed to create backup wrapper script"
        return 1
    fi
    
    local backup_marker="# SFL Prompt Studio Database Backup"
    local wrapper_script="$SCRIPT_DIR/backup-wrapper.sh"
    local cron_command="$CRON_SCHEDULE $wrapper_script >/dev/null 2>&1"
    local temp_cron=$(mktemp)
    
    # Get current crontab (if any)
    crontab -l 2>/dev/null > "$temp_cron" || true
    
    # Remove any existing backup job
    grep -v -A1 "$backup_marker" "$temp_cron" | grep -v "backup-wrapper.sh" > "${temp_cron}.new" || true
    mv "${temp_cron}.new" "$temp_cron"
    
    # Add new backup job
    echo "" >> "$temp_cron"
    echo "$backup_marker" >> "$temp_cron"
    echo "$cron_command" >> "$temp_cron"
    
    # Install the updated crontab
    if crontab "$temp_cron"; then
        log_success "Cron job added successfully"
        log_info "Schedule: $CRON_SCHEDULE"
        log_info "Command: $wrapper_script"
    else
        log_error "Failed to add cron job"
        rm -f "$temp_cron"
        return 1
    fi
    
    rm -f "$temp_cron"
    return 0
}

show_cron_status() {
    log_info "Current cron job status:"
    
    local current_job=$(get_current_cron)
    if [[ -n "$current_job" ]]; then
        echo "Active backup cron job:"
        echo "  $current_job"
        
        # Show next run time if possible
        if command -v crontab >/dev/null 2>&1; then
            echo ""
            echo "Next scheduled backups:"
            crontab -l | grep "backup-wrapper.sh" | head -3 || true
        fi
    else
        echo "No active backup cron job found"
    fi
    
    echo ""
    echo "All cron jobs for user $CRON_USER:"
    crontab -l 2>/dev/null || echo "No cron jobs found"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_info "Starting host cron setup for database backup..."
    
    # Validate requirements
    if ! validate_requirements; then
        log_error "Requirements validation failed"
        return 1
    fi
    
    # Validate cron schedule
    if ! validate_cron_schedule "$CRON_SCHEDULE"; then
        log_error "Cron schedule validation failed"
        return 1
    fi
    
    if [[ "$REMOVE_CRON" == "true" ]]; then
        # Remove cron job
        if remove_cron_job; then
            log_success "Cron job removal completed successfully"
        else
            log_error "Cron job removal failed"
            return 1
        fi
    else
        # Add cron job
        if add_cron_job; then
            log_success "Cron job setup completed successfully"
            echo ""
            show_cron_status
        else
            log_error "Cron job setup failed"
            return 1
        fi
    fi
    
    return 0
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--schedule)
            CRON_SCHEDULE="$2"
            shift 2
            ;;
        -u|--user)
            CRON_USER="$2"
            shift 2
            ;;
        -d|--docker-path)
            DOCKER_PATH="$2"
            shift 2
            ;;
        -r|--remove)
            REMOVE_CRON=true
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
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Convert relative paths to absolute
DOCKER_PATH=$(cd "$DOCKER_PATH" && pwd)

# Run main function
main "$@"
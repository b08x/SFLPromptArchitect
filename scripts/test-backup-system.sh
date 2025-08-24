#!/bin/bash

# =============================================================================
# Backup System Test Script for SFL Prompt Studio
# =============================================================================
# This script performs comprehensive testing of the backup and restore system
# to ensure everything is working correctly before deployment.
#
# Usage:
#   ./test-backup-system.sh [OPTIONS]
#
# Options:
#   -s, --skip-restore     Skip restore testing
#   -v, --verbose          Enable verbose output
#   -h, --help             Show this help message
#
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_LOG="${SCRIPT_DIR}/../logs/test-backup-system.log"

# Test configuration
TEST_DATABASE="sfl_db_test_$(date +%s)"
SKIP_RESTORE=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$TEST_LOG")"
    
    # Log to file
    echo "[$timestamp] [$level] $message" >> "$TEST_LOG"
    
    # Log to stdout with colors
    case "$level" in
        "ERROR")
            echo -e "${RED}[$timestamp] [$level] $message${NC}" >&2
            ;;
        "SUCCESS")
            echo -e "${GREEN}[$timestamp] [$level] $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$timestamp] [$level] $message${NC}"
            ;;
        "INFO")
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "${BLUE}[$timestamp] [$level] $message${NC}"
            fi
            ;;
        *)
            echo "[$timestamp] [$level] $message"
            ;;
    esac
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
Backup System Test Script for SFL Prompt Studio

This script validates the entire backup and restore system by:
1. Testing database connectivity
2. Creating a test database with sample data
3. Running backup script
4. Verifying backup file integrity
5. Testing restore process
6. Validating restored data
7. Cleaning up test resources

Usage: $SCRIPT_NAME [OPTIONS]

OPTIONS:
    -s, --skip-restore     Skip restore testing (faster testing)
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

REQUIREMENTS:
    - Docker and docker-compose running
    - SFL Prompt Studio database container running
    - Environment variables configured in .env.backup

EXAMPLES:
    # Full system test
    ./test-backup-system.sh -v

    # Test only backup creation (skip restore)
    ./test-backup-system.sh -s

EXIT CODES:
    0    All tests passed
    1    General test failure
    2    Environment setup failed
    3    Backup test failed
    4    Restore test failed

EOF
}

# =============================================================================
# Test Functions
# =============================================================================

setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Load environment variables
    if [[ -f "$SCRIPT_DIR/.env.backup" ]]; then
        source "$SCRIPT_DIR/.env.backup"
        log_info "Loaded environment from .env.backup"
    else
        log_error "Environment file not found: $SCRIPT_DIR/.env.backup"
        return 2
    fi
    
    # Override database name for testing
    export POSTGRES_DB="$TEST_DATABASE"
    export BACKUP_PATH="${SCRIPT_DIR}/../backups/test"
    
    # Create test backup directory
    mkdir -p "$BACKUP_PATH"
    
    log_success "Test environment setup completed"
    return 0
}

test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    # Test connection to PostgreSQL server
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_isready \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "postgres" >/dev/null 2>&1; then
        log_error "Cannot connect to PostgreSQL server"
        return 3
    fi
    
    log_success "Database connectivity test passed"
    return 0
}

create_test_database() {
    log_info "Creating test database: $TEST_DATABASE"
    
    # Drop test database if it exists
    PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$TEST_DATABASE" 2>/dev/null || true
    
    # Create test database
    if ! PGPASSWORD="$POSTGRES_PASSWORD" createdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$TEST_DATABASE"; then
        log_error "Failed to create test database"
        return 3
    fi
    
    log_success "Test database created successfully"
    return 0
}

populate_test_data() {
    log_info "Populating test database with sample data..."
    
    # Create test schema and data
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$TEST_DATABASE" \
        -c "
        CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
        
        CREATE TABLE test_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        CREATE TABLE test_prompts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES test_users(id),
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        INSERT INTO test_users (email, name) VALUES
            ('test1@example.com', 'Test User 1'),
            ('test2@example.com', 'Test User 2'),
            ('test3@example.com', 'Test User 3');
        
        INSERT INTO test_prompts (user_id, title, body)
        SELECT 
            u.id,
            'Test Prompt ' || generate_series(1, 5),
            'This is a test prompt body with sample content for testing backup and restore functionality.'
        FROM test_users u
        CROSS JOIN generate_series(1, 5);
        " >/dev/null 2>&1
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to populate test database"
        return 3
    fi
    
    # Verify data was inserted
    local user_count
    user_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$TEST_DATABASE" \
        -tAc "SELECT COUNT(*) FROM test_users;" 2>/dev/null)
    
    local prompt_count
    prompt_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$TEST_DATABASE" \
        -tAc "SELECT COUNT(*) FROM test_prompts;" 2>/dev/null)
    
    log_info "Test data created: $user_count users, $prompt_count prompts"
    log_success "Test database populated successfully"
    return 0
}

test_backup_creation() {
    log_info "Testing backup creation..."
    
    # Run backup script
    local backup_command="$SCRIPT_DIR/backup.sh"
    if [[ "$VERBOSE" == "true" ]]; then
        backup_command="$backup_command -v"
    fi
    
    if ! $backup_command 2>> "$TEST_LOG"; then
        log_error "Backup creation failed"
        return 3
    fi
    
    # Find the most recent backup file
    local backup_file
    backup_file=$(find "$BACKUP_PATH" -name "${TEST_DATABASE}_backup_*.sql.gz" -type f | sort | tail -1)
    
    if [[ -z "$backup_file" ]] || [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found after backup creation"
        return 3
    fi
    
    # Verify backup file integrity
    if ! gunzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file integrity check failed"
        return 3
    fi
    
    # Check backup file size (should be reasonable)
    local file_size
    file_size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
    
    if [[ $file_size -lt 100 ]]; then
        log_error "Backup file appears to be too small ($file_size bytes)"
        return 3
    fi
    
    log_info "Backup file created: $(basename "$backup_file") ($file_size bytes)"
    log_success "Backup creation test passed"
    
    # Store backup file path for restore test
    echo "$backup_file" > "$BACKUP_PATH/.test_backup_file"
    
    return 0
}

test_backup_restore() {
    if [[ "$SKIP_RESTORE" == "true" ]]; then
        log_info "Skipping restore test as requested"
        return 0
    fi
    
    log_info "Testing backup restore..."
    
    # Get the backup file path
    local backup_file
    if [[ -f "$BACKUP_PATH/.test_backup_file" ]]; then
        backup_file=$(cat "$BACKUP_PATH/.test_backup_file")
    else
        log_error "Test backup file path not found"
        return 4
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Test backup file does not exist: $backup_file"
        return 4
    fi
    
    # Create a new test database for restore
    local restore_database="${TEST_DATABASE}_restore"
    export POSTGRES_DB="$restore_database"
    
    # Drop restore database if it exists
    PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$restore_database" 2>/dev/null || true
    
    # Run restore script
    local restore_command="$SCRIPT_DIR/restore.sh -f"
    if [[ "$VERBOSE" == "true" ]]; then
        restore_command="$restore_command -v"
    fi
    restore_command="$restore_command \"$backup_file\""
    
    if ! eval $restore_command 2>> "$TEST_LOG"; then
        log_error "Restore operation failed"
        return 4
    fi
    
    # Verify restored data
    local restored_users
    restored_users=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$restore_database" \
        -tAc "SELECT COUNT(*) FROM test_users;" 2>/dev/null || echo "0")
    
    local restored_prompts
    restored_prompts=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$restore_database" \
        -tAc "SELECT COUNT(*) FROM test_prompts;" 2>/dev/null || echo "0")
    
    if [[ "$restored_users" != "3" ]] || [[ "$restored_prompts" != "15" ]]; then
        log_error "Restored data count mismatch. Users: $restored_users (expected 3), Prompts: $restored_prompts (expected 15)"
        return 4
    fi
    
    # Test data integrity
    local sample_user
    sample_user=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$restore_database" \
        -tAc "SELECT email FROM test_users WHERE email = 'test1@example.com';" 2>/dev/null || echo "")
    
    if [[ "$sample_user" != "test1@example.com" ]]; then
        log_error "Data integrity check failed - sample user not found"
        return 4
    fi
    
    log_info "Restored data verified: $restored_users users, $restored_prompts prompts"
    log_success "Backup restore test passed"
    
    # Clean up restore database
    PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$restore_database" 2>/dev/null || true
    
    return 0
}

test_script_functionality() {
    log_info "Testing script functionality and error handling..."
    
    # Test backup script help
    if ! "$SCRIPT_DIR/backup.sh" --help >/dev/null 2>&1; then
        log_error "Backup script help option failed"
        return 1
    fi
    
    # Test restore script help
    if ! "$SCRIPT_DIR/restore.sh" --help >/dev/null 2>&1; then
        log_error "Restore script help option failed"
        return 1
    fi
    
    # Test backup script with invalid retention
    if "$SCRIPT_DIR/backup.sh" --retention -1 >/dev/null 2>&1; then
        log_error "Backup script should have failed with invalid retention"
        return 1
    fi
    
    # Test restore script with non-existent file
    if "$SCRIPT_DIR/restore.sh" --force /nonexistent/file.sql.gz >/dev/null 2>&1; then
        log_error "Restore script should have failed with non-existent file"
        return 1
    fi
    
    log_success "Script functionality tests passed"
    return 0
}

test_environment_validation() {
    log_info "Testing environment validation..."
    
    # Backup current environment
    local orig_user="$POSTGRES_USER"
    local orig_pass="$POSTGRES_PASSWORD"
    local orig_db="$POSTGRES_DB"
    
    # Test with missing user
    unset POSTGRES_USER
    if "$SCRIPT_DIR/backup.sh" >/dev/null 2>&1; then
        log_error "Backup script should have failed with missing POSTGRES_USER"
        export POSTGRES_USER="$orig_user"
        return 1
    fi
    export POSTGRES_USER="$orig_user"
    
    # Test with missing password
    unset POSTGRES_PASSWORD
    if "$SCRIPT_DIR/backup.sh" >/dev/null 2>&1; then
        log_error "Backup script should have failed with missing POSTGRES_PASSWORD"
        export POSTGRES_PASSWORD="$orig_pass"
        return 1
    fi
    export POSTGRES_PASSWORD="$orig_pass"
    
    # Test with missing database
    unset POSTGRES_DB
    if "$SCRIPT_DIR/backup.sh" >/dev/null 2>&1; then
        log_error "Backup script should have failed with missing POSTGRES_DB"
        export POSTGRES_DB="$orig_db"
        return 1
    fi
    export POSTGRES_DB="$orig_db"
    
    log_success "Environment validation tests passed"
    return 0
}

cleanup_test_resources() {
    log_info "Cleaning up test resources..."
    
    # Drop test databases
    PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "$TEST_DATABASE" 2>/dev/null || true
    
    PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        "${TEST_DATABASE}_restore" 2>/dev/null || true
    
    # Remove test backup files
    rm -rf "$BACKUP_PATH" 2>/dev/null || true
    
    log_success "Test cleanup completed"
    return 0
}

# =============================================================================
# Main Test Function
# =============================================================================

run_tests() {
    local test_start_time=$(date +%s)
    local tests_passed=0
    local tests_failed=0
    
    echo ""
    echo "======================================="
    echo "SFL Prompt Studio Backup System Test"
    echo "======================================="
    echo "Start time: $(date)"
    echo ""
    
    # Test 1: Environment Setup
    echo -n "Test 1: Environment Setup... "
    if setup_test_environment; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
        return 1
    fi
    
    # Test 2: Database Connectivity
    echo -n "Test 2: Database Connectivity... "
    if test_database_connectivity; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
        return 1
    fi
    
    # Test 3: Environment Validation
    echo -n "Test 3: Environment Validation... "
    if test_environment_validation; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
    fi
    
    # Test 4: Script Functionality
    echo -n "Test 4: Script Functionality... "
    if test_script_functionality; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
    fi
    
    # Test 5: Test Database Creation
    echo -n "Test 5: Test Database Creation... "
    if create_test_database && populate_test_data; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
        cleanup_test_resources
        return 1
    fi
    
    # Test 6: Backup Creation
    echo -n "Test 6: Backup Creation... "
    if test_backup_creation; then
        echo -e "${GREEN}PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}FAILED${NC}"
        ((tests_failed++))
        cleanup_test_resources
        return 1
    fi
    
    # Test 7: Backup Restore (optional)
    if [[ "$SKIP_RESTORE" != "true" ]]; then
        echo -n "Test 7: Backup Restore... "
        if test_backup_restore; then
            echo -e "${GREEN}PASSED${NC}"
            ((tests_passed++))
        else
            echo -e "${RED}FAILED${NC}"
            ((tests_failed++))
        fi
    else
        echo "Test 7: Backup Restore... ${YELLOW}SKIPPED${NC}"
    fi
    
    # Cleanup
    cleanup_test_resources
    
    local test_end_time=$(date +%s)
    local test_duration=$((test_end_time - test_start_time))
    
    echo ""
    echo "======================================="
    echo "Test Results Summary"
    echo "======================================="
    echo -e "Tests Passed: ${GREEN}$tests_passed${NC}"
    echo -e "Tests Failed: ${RED}$tests_failed${NC}"
    echo "Test Duration: ${test_duration}s"
    echo "End time: $(date)"
    echo ""
    
    if [[ $tests_failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed! Your backup system is ready for production.${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed. Please check the log file: $TEST_LOG${NC}"
        return 1
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--skip-restore)
            SKIP_RESTORE=true
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

# Run tests
run_tests "$@"
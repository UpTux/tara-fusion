#!/bin/bash
#
# TARA Fusion Build Script
# This script provides a reproducible build process for SLSA compliance
#
# Usage: ./scripts/build.sh [options]
#
# Options:
#   --clean     Clean build directories before building
#   --test      Run tests before building
#   --lint      Run linter before building
#   --verify    Run all checks (test + lint + type-check)
#   --version   Specify version string (default: dev)
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_ROOT/src"
DIST_DIR="$SRC_DIR/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
CLEAN=false
RUN_TESTS=false
RUN_LINT=false
RUN_VERIFY=false
VERSION="${VERSION:-dev}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --test)
            RUN_TESTS=true
            shift
            ;;
        --lint)
            RUN_LINT=true
            shift
            ;;
        --verify)
            RUN_VERIFY=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        -h|--help)
            grep '^#' "$0" | cut -c 4-
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
    log_info "Node version: $(node --version)"
    log_info "npm version: $(npm --version)"
}

clean_build() {
    log_info "Cleaning build directories..."
    
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
        log_success "Removed $DIST_DIR"
    fi
    
    # Clean node_modules if requested (optional, not default)
    if [ "${CLEAN_MODULES:-false}" = "true" ]; then
        if [ -d "$SRC_DIR/node_modules" ]; then
            rm -rf "$SRC_DIR/node_modules"
            log_success "Removed node_modules"
        fi
    fi
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$SRC_DIR"
    
    # Use npm ci for reproducible builds (requires package-lock.json)
    if [ -f "package-lock.json" ]; then
        npm ci
        log_success "Dependencies installed via npm ci (reproducible)"
    else
        log_warning "package-lock.json not found, using npm install"
        npm install
    fi
}

run_tests() {
    log_info "Running tests..."
    
    cd "$SRC_DIR"
    npm run test:run
    
    log_success "All tests passed"
}

run_lint() {
    log_info "Running linter..."
    
    cd "$SRC_DIR"
    npm run lint:ci
    
    log_success "Linting passed"
}

run_type_check() {
    log_info "Running type check..."
    
    cd "$SRC_DIR"
    npm run type-check
    
    log_success "Type checking passed"
}

build_application() {
    log_info "Building application..."
    
    cd "$SRC_DIR"
    
    # Set build timestamp
    export BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export BUILD_VERSION="$VERSION"
    
    npm run build
    
    log_success "Build completed successfully"
    log_info "Build output: $DIST_DIR"
}

generate_checksums() {
    log_info "Generating checksums..."
    
    cd "$DIST_DIR"
    
    # Generate SHA-256 checksums for all files
    find . -type f -exec sha256sum {} \; > checksums.txt
    
    log_success "Checksums generated: $DIST_DIR/checksums.txt"
}

generate_build_info() {
    log_info "Generating build information..."
    
    cd "$PROJECT_ROOT"
    
    cat > "$DIST_DIR/build-info.json" <<EOF
{
  "version": "$VERSION",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "builder": "${USER}@$(hostname)",
  "buildScript": "scripts/build.sh"
}
EOF
    
    log_success "Build info generated: $DIST_DIR/build-info.json"
    cat "$DIST_DIR/build-info.json"
}

create_archive() {
    log_info "Creating distribution archive..."
    
    cd "$SRC_DIR"
    
    local archive_name="tara-fusion-${VERSION}.tar.gz"
    tar -czf "$PROJECT_ROOT/$archive_name" -C dist .
    
    log_success "Archive created: $PROJECT_ROOT/$archive_name"
    
    # Generate checksum for the archive
    cd "$PROJECT_ROOT"
    sha256sum "$archive_name" > "${archive_name}.sha256"
    
    log_success "Archive checksum: ${archive_name}.sha256"
}

# Main execution
main() {
    log_info "Starting TARA Fusion build process"
    log_info "Version: $VERSION"
    echo ""
    
    # Check dependencies
    check_dependencies
    echo ""
    
    # Clean if requested
    if [ "$CLEAN" = true ]; then
        clean_build
        echo ""
    fi
    
    # Install dependencies
    install_dependencies
    echo ""
    
    # Run verification steps if requested
    if [ "$RUN_VERIFY" = true ] || [ "$RUN_TESTS" = true ]; then
        run_tests
        echo ""
    fi
    
    if [ "$RUN_VERIFY" = true ] || [ "$RUN_LINT" = true ]; then
        run_lint
        echo ""
    fi
    
    if [ "$RUN_VERIFY" = true ]; then
        run_type_check
        echo ""
    fi
    
    # Build
    build_application
    echo ""
    
    # Generate artifacts
    generate_checksums
    generate_build_info
    echo ""
    
    # Create archive
    create_archive
    echo ""
    
    log_success "🎉 Build completed successfully!"
    log_info "Output directory: $DIST_DIR"
    log_info "Archive: tara-fusion-${VERSION}.tar.gz"
}

# Run main function
main

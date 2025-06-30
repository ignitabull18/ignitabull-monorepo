#!/bin/bash

# Production Deployment Script for Ignitabull
# This script builds and deploys the application using Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
    
    # Check if production compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Production compose file '$COMPOSE_FILE' not found."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file '$ENV_FILE' not found. Using default values."
        log_warning "Please create $ENV_FILE with your production environment variables."
    fi
    
    log_success "Prerequisites check passed"
}

# Validate environment variables
validate_environment() {
    log_info "Validating environment variables..."
    
    # Source the environment file if it exists
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi
    
    # Required environment variables
    REQUIRED_VARS=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "SUPABASE_ANON_KEY"
        "ENCRYPTION_SECRET"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        printf '%s\n' "${MISSING_VARS[@]}"
        log_error "Please set these variables in $ENV_FILE"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Create backup of current deployment
create_backup() {
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Creating backup of current deployment..."
        
        mkdir -p "$BACKUP_DIR"
        
        # Export current container images
        docker-compose -f "$COMPOSE_FILE" config > "$BACKUP_DIR/docker-compose.yml"
        
        # Save environment
        cp "$ENV_FILE" "$BACKUP_DIR/.env" 2>/dev/null || true
        
        log_success "Backup created at $BACKUP_DIR"
    else
        log_info "No running containers found, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log_info "Starting deployment..."
    
    # Pull latest images for base images
    log_info "Pulling latest base images..."
    docker pull node:18-alpine
    docker pull nginx:alpine
    docker pull redis:7-alpine
    
    # Build new images
    log_info "Building application images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    local services=("web" "server")
    local failed_services=()
    
    for service in "${services[@]}"; do
        log_info "Checking $service..."
        
        # Get container ID
        container_id=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | head -n1)
        
        if [ -z "$container_id" ]; then
            log_error "Container for $service not found"
            failed_services+=("$service")
            continue
        fi
        
        # Check if container is running
        if ! docker inspect "$container_id" --format='{{.State.Running}}' | grep -q true; then
            log_error "$service container is not running"
            failed_services+=("$service")
            continue
        fi
        
        # Check health status
        health_status=$(docker inspect "$container_id" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-health-check")
        
        if [ "$health_status" = "healthy" ] || [ "$health_status" = "no-health-check" ]; then
            log_success "$service is healthy"
        else
            log_warning "$service health status: $health_status"
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "Some services failed to start properly:"
        printf '%s\n' "${failed_services[@]}"
        return 1
    fi
    
    log_success "All services are running"
    return 0
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [ "$1" = "--aggressive" ]; then
        log_warning "Removing unused volumes (aggressive cleanup)"
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

# Show logs
show_logs() {
    log_info "Showing recent logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
}

# Rollback function
rollback() {
    log_warning "Rolling back to previous deployment..."
    
    # Find latest backup
    if [ -d "./backups" ]; then
        latest_backup=$(ls -1t ./backups/ | head -n1)
        if [ -n "$latest_backup" ]; then
            backup_path="./backups/$latest_backup"
            log_info "Using backup from $backup_path"
            
            # Stop current deployment
            docker-compose -f "$COMPOSE_FILE" down
            
            # Restore from backup
            if [ -f "$backup_path/docker-compose.yml" ]; then
                cp "$backup_path/docker-compose.yml" ./docker-compose.rollback.yml
                docker-compose -f ./docker-compose.rollback.yml up -d
                log_success "Rollback completed"
            else
                log_error "Backup configuration not found"
                exit 1
            fi
        else
            log_error "No backups found"
            exit 1
        fi
    else
        log_error "Backup directory not found"
        exit 1
    fi
}

# Main execution
main() {
    case "$1" in
        "deploy")
            check_prerequisites
            validate_environment
            create_backup
            deploy
            ;;
        "rollback")
            rollback
            ;;
        "logs")
            show_logs
            ;;
        "health")
            check_health
            ;;
        "cleanup")
            cleanup "$2"
            ;;
        "stop")
            log_info "Stopping all services..."
            docker-compose -f "$COMPOSE_FILE" down
            log_success "Services stopped"
            ;;
        "restart")
            log_info "Restarting all services..."
            docker-compose -f "$COMPOSE_FILE" restart
            log_success "Services restarted"
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|logs|health|cleanup|stop|restart}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application to production"
            echo "  rollback - Rollback to the previous deployment"
            echo "  logs     - Show recent logs from all services"
            echo "  health   - Check health status of all services"
            echo "  cleanup  - Clean up old Docker images (use --aggressive for volumes)"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            exit 1
            ;;
    esac
}

# Create .env.production template if it doesn't exist
if [ ! -f "$ENV_FILE" ] && [ "$1" = "deploy" ]; then
    log_info "Creating $ENV_FILE template..."
    cat > "$ENV_FILE" << 'EOF'
# Production Environment Variables for Ignitabull

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Application Secrets
ENCRYPTION_SECRET=your-32-character-encryption-secret
CRON_SECRET_KEY=your-cron-secret-key

# API Configuration
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (optional)
REDIS_PASSWORD=your-redis-password

# Monitoring (optional)
GRAFANA_PASSWORD=your-grafana-password
EOF
    log_warning "Created $ENV_FILE template. Please fill in your actual values before deploying."
    exit 1
fi

main "$@"
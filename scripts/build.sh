#!/bin/bash
# Build script for Ignitabull applications

set -e

echo "🏗️  Building Ignitabull applications..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
BUILD_TARGET=${1:-all}
BUILD_ENV=${2:-development}

print_status "Building target: $BUILD_TARGET"
print_status "Environment: $BUILD_ENV"

# Create necessary directories
mkdir -p nginx/ssl
mkdir -p logs
mkdir -p monitoring

# Build specific application or all
case $BUILD_TARGET in
    "web")
        print_status "Building web application..."
        docker build -f Dockerfile.web -t ignitabull/web:latest .
        print_success "Web application built successfully"
        ;;
    "server")
        print_status "Building server application..."
        docker build -f Dockerfile.server -t ignitabull/server:latest .
        print_success "Server application built successfully"
        ;;
    "marketing")
        print_status "Building marketing website..."
        docker build -f Dockerfile.marketing -t ignitabull/marketing:latest .
        print_success "Marketing website built successfully"
        ;;
    "all")
        print_status "Building all applications..."
        
        # Build in parallel for faster builds
        print_status "Building web application..."
        docker build -f Dockerfile.web -t ignitabull/web:latest . &
        WEB_PID=$!
        
        print_status "Building server application..."
        docker build -f Dockerfile.server -t ignitabull/server:latest . &
        SERVER_PID=$!
        
        print_status "Building marketing website..."
        docker build -f Dockerfile.marketing -t ignitabull/marketing:latest . &
        MARKETING_PID=$!
        
        # Wait for all builds to complete
        wait $WEB_PID
        if [ $? -eq 0 ]; then
            print_success "Web application built successfully"
        else
            print_error "Web application build failed"
            exit 1
        fi
        
        wait $SERVER_PID
        if [ $? -eq 0 ]; then
            print_success "Server application built successfully"
        else
            print_error "Server application build failed"
            exit 1
        fi
        
        wait $MARKETING_PID
        if [ $? -eq 0 ]; then
            print_success "Marketing website built successfully"
        else
            print_error "Marketing website build failed"
            exit 1
        fi
        
        print_success "All applications built successfully"
        ;;
    *)
        print_error "Invalid build target. Use: web, server, marketing, or all"
        exit 1
        ;;
esac

# Tag images with environment
if [ "$BUILD_ENV" != "development" ]; then
    print_status "Tagging images for $BUILD_ENV environment..."
    
    case $BUILD_TARGET in
        "web"|"all")
            docker tag ignitabull/web:latest ignitabull/web:$BUILD_ENV
            ;;
    esac
    
    case $BUILD_TARGET in
        "server"|"all")
            docker tag ignitabull/server:latest ignitabull/server:$BUILD_ENV
            ;;
    esac
    
    case $BUILD_TARGET in
        "marketing"|"all")
            docker tag ignitabull/marketing:latest ignitabull/marketing:$BUILD_ENV
            ;;
    esac
fi

# Show built images
print_status "Built images:"
docker images | grep ignitabull

# Prune build cache to save space
print_status "Cleaning up build cache..."
docker builder prune -f

print_success "Build completed successfully! 🎉"

if [ "$BUILD_ENV" = "development" ]; then
    print_status "To start the development environment, run:"
    echo "  docker-compose up -d"
elif [ "$BUILD_ENV" = "production" ]; then
    print_status "To start the production environment, run:"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
fi
#!/bin/bash
# Start all Docker services

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Synchronize configuration with .env before starting
echo "🔄 Synchronizing configuration..."
if [ -f "$SCRIPT_DIR/sync-env.sh" ]; then
    "$SCRIPT_DIR/sync-env.sh"
    echo ""
fi

echo "🚀 Starting Base2 Docker Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please review and update it if needed."
    else
        echo "❌ Error: .env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Parse command line arguments
BUILD=false
DETACHED=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --build|-b)
            BUILD=true
            shift
            ;;
        --foreground|-f)
            DETACHED=false
            shift
            ;;
        --help|-h)
            echo "Usage: ./start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -b, --build       Rebuild images before starting"
            echo "  -f, --foreground  Run in foreground (don't detach)"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build if requested
if [ "$BUILD" = true ]; then
    echo "🔨 Building services..."
    docker-compose -f "$COMPOSE_FILE" build
fi

# Start services
if [ "$DETACHED" = true ]; then
    echo "🐳 Starting services in detached mode..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "🌐 Access services at:"
    echo "  - React App:         http://localhost:3000"
    echo "  - Nginx:             http://localhost:8080"
    echo "  - pgAdmin:           http://localhost:5050"
    echo "  - Traefik Dashboard: http://localhost:8082/dashboard/"
    echo "  - Traefik API:       http://localhost:8082/api/rawdata"
    echo "  - PostgreSQL:        localhost:5432"
    echo ""
    echo "💡 View logs: ./scripts/logs.sh"
else
    echo "🐳 Starting services in foreground mode..."
    docker-compose -f "$COMPOSE_FILE" up
fi

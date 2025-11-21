#!/bin/bash
# Stop all Docker services

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🛑 Stopping Base2 Docker Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Parse command line arguments
REMOVE_VOLUMES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --volumes|-v)
            REMOVE_VOLUMES=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./stop.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --volumes     Remove volumes (WARNING: deletes data)"
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

# Stop services
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "⚠️  WARNING: This will remove all volumes and delete data!"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "🗑️  Stopping services and removing volumes..."
        docker-compose -f "$COMPOSE_FILE" down -v
        echo "✅ Services stopped and volumes removed"
    else
        echo "❌ Operation cancelled"
        exit 1
    fi
else
    echo "🐳 Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    echo "✅ Services stopped successfully"
fi

echo ""
echo "💡 Start services again: ./scripts/start.sh"

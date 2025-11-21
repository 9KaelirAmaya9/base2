#!/bin/bash
# Clean up Docker resources

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🧹 Cleaning Base2 Docker Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Parse command line arguments
CLEAN_ALL=false
CLEAN_VOLUMES=false
CLEAN_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all|-a)
            CLEAN_ALL=true
            shift
            ;;
        --volumes|-v)
            CLEAN_VOLUMES=true
            shift
            ;;
        --images|-i)
            CLEAN_IMAGES=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./clean.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -a, --all         Clean everything (containers, volumes, images)"
            echo "  -v, --volumes     Clean volumes only (WARNING: deletes data)"
            echo "  -i, --images      Clean images only"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./clean.sh              # Stop and remove containers"
            echo "  ./clean.sh -v           # Remove containers and volumes"
            echo "  ./clean.sh -i           # Remove containers and images"
            echo "  ./clean.sh -a           # Remove everything"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Determine what to clean
if [ "$CLEAN_ALL" = true ]; then
    CLEAN_VOLUMES=true
    CLEAN_IMAGES=true
fi

# Stop and remove containers
echo "🛑 Stopping and removing containers..."
if [ "$CLEAN_VOLUMES" = true ]; then
    echo "⚠️  WARNING: This will remove volumes and delete all data!"
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        docker-compose -f "$COMPOSE_FILE" down -v
        echo "✅ Containers and volumes removed"
    else
        echo "❌ Operation cancelled"
        exit 1
    fi
else
    docker-compose -f "$COMPOSE_FILE" down
    echo "✅ Containers removed"
fi

# Remove images
if [ "$CLEAN_IMAGES" = true ]; then
    echo ""
    echo "🗑️  Removing images..."
    
    # Get all images for this project
    IMAGES=$(docker images --filter=reference='base2*' -q)
    
    if [ -z "$IMAGES" ]; then
        echo "ℹ️  No base2 images found"
    else
        echo "Found images:"
        docker images --filter=reference='base2*'
        echo ""
        read -p "Remove these images? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            docker rmi $IMAGES
            echo "✅ Images removed"
        else
            echo "❌ Image removal cancelled"
        fi
    fi
fi

echo ""
echo "🧹 Cleanup completed!"
echo ""
echo "💡 To also clean Docker system resources:"
echo "   docker system prune -a"

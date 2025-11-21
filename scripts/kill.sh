#!/bin/bash
# Nuclear option: Stop and completely remove ALL Docker resources for this project
# WARNING: This will delete EVERYTHING including all data!

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "💀 KILL ALL - Base2 Docker Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ⚠️  ⚠️  DANGER ZONE ⚠️  ⚠️  ⚠️"
echo ""
echo "This will PERMANENTLY DELETE:"
echo "  • All containers (base2_*)"
echo "  • All volumes (base2_*) - ALL DATA WILL BE LOST"
echo "  • All images (base2_*)"
echo "  • All networks (base2_*)"
echo ""
echo "This action CANNOT be undone!"
echo ""

# Parse command line arguments
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./kill.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -f, --force       Skip confirmation prompt"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "WARNING: This will permanently delete all containers, volumes,"
            echo "images, and networks associated with this project."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Confirmation prompt
if [ "$FORCE" = false ]; then
    echo "Type 'DELETE EVERYTHING' to confirm:"
    read -r confirmation
    
    if [ "$confirmation" != "DELETE EVERYTHING" ]; then
        echo ""
        echo "❌ Operation cancelled"
        exit 0
    fi
fi

echo ""
echo "🔥 Starting complete removal process..."
echo ""

# 1. Stop and remove containers with volumes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 Stopping and removing containers..."
docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
echo "✅ Containers removed"

# 2. Force remove any remaining base2 containers
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Force removing any remaining containers..."
CONTAINERS=$(docker ps -aq --filter "name=base2_" 2>/dev/null || true)
if [ -n "$CONTAINERS" ]; then
    echo "Found containers to remove:"
    docker ps -a --filter "name=base2_" --format "table {{.Names}}\t{{.Status}}"
    docker rm -f $CONTAINERS
    echo "✅ Force removed remaining containers"
else
    echo "ℹ️  No containers found"
fi


# 4. Remove all base2 images
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖼️  Removing all images..."
IMAGES=$(docker images -q --filter "reference=base2*" 2>/dev/null || true)
if [ -n "$IMAGES" ]; then
    echo "Found images to remove:"
    docker images --filter "reference=base2*"
    docker rmi -f $IMAGES 2>/dev/null || true
    echo "✅ Images removed"
else
    echo "ℹ️  No images found"
fi

# Also remove images by project name pattern
IMAGES_ALT=$(docker images -q --filter "reference=*base2*" 2>/dev/null || true)
if [ -n "$IMAGES_ALT" ]; then
    docker rmi -f $IMAGES_ALT 2>/dev/null || true
fi

# 5. Remove base2 network
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Removing networks..."
NETWORKS=$(docker network ls -q --filter "name=base2" 2>/dev/null || true)
if [ -n "$NETWORKS" ]; then
    echo "Found networks to remove:"
    docker network ls --filter "name=base2"
    docker network rm $NETWORKS 2>/dev/null || true
    echo "✅ Networks removed"
else
    echo "ℹ️  No networks found"
fi

# 6. Clean up any dangling resources
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Cleaning up dangling resources..."
docker system prune -f --volumes 2>/dev/null || true
echo "✅ Dangling resources cleaned"

# 7. Final volume cleanup - check and remove any remaining base2 volumes
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Final volume cleanup check..."

# List all volumes with base2 in the name
VOLUMES=$(docker volume ls -q --filter "name=base2" 2>/dev/null || true)

if [ -n "$VOLUMES" ]; then
    echo "⚠️  Found remaining volumes to remove:"
    docker volume ls --filter "name=base2" --format "table {{.Name}}\t{{.Driver}}\t{{.Mountpoint}}"
    echo ""
    echo "🗑️  Forcefully removing volumes..."
    
    # Try to remove each volume individually
    for volume in $VOLUMES; do
        echo "  Removing: $volume"
        docker volume rm -f "$volume" 2>/dev/null || \
            echo "  ⚠️  Could not remove $volume (may be in use)"
    done
    
    # Check if any volumes remain
    REMAINING=$(docker volume ls -q --filter "name=base2" 2>/dev/null || true)
    if [ -n "$REMAINING" ]; then
        echo ""
        echo "⚠️  Some volumes could not be removed. They may be in use."
        echo "   Remaining volumes:"
        docker volume ls --filter "name=base2"
        echo ""
        echo "   Try stopping all Docker containers and run this script again:"
        echo "   docker stop \$(docker ps -aq) && ./scripts/kill.sh --force"
    else
        echo "✅ All volumes successfully removed"
    fi
else
    echo "✅ No volumes found (already clean)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💀 Complete removal finished!"
echo ""
echo "All Base2 Docker resources have been permanently deleted."
echo ""
echo "💡 To start fresh: ./scripts/start.sh --build"

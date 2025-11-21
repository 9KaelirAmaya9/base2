#!/bin/bash
# Access shell in a Docker container

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Parse command line arguments
SERVICE=""
SHELL_TYPE="sh"

while [[ $# -gt 0 ]]; do
    case $1 in
        --bash|-b)
            SHELL_TYPE="bash"
            shift
            ;;
        --help|-h)
            echo "Usage: ./shell.sh [OPTIONS] SERVICE"
            echo ""
            echo "Arguments:"
            echo "  SERVICE           Service to access (required)"
            echo "                    Options: react-app, nginx, postgres, pgadmin, traefik"
            echo ""
            echo "Options:"
            echo "  -b, --bash        Use bash instead of sh (if available)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./shell.sh postgres         # Access postgres container with sh"
            echo "  ./shell.sh -b react-app     # Access react-app with bash"
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

if [ -z "$SERVICE" ]; then
    echo "❌ Error: SERVICE argument is required"
    echo "Use --help for usage information"
    exit 1
fi

container_name="base2_${SERVICE}"

echo "🐚 Accessing shell for: $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if container is running
if ! docker ps --filter "name=${container_name}" --format "{{.Names}}" | grep -q "${container_name}"; then
    echo "❌ Container $container_name is not running"
    echo ""
    echo "💡 Start services: ./scripts/start.sh"
    exit 1
fi

echo "🔗 Connecting to $container_name..."
echo "💡 Type 'exit' to leave the shell"
echo ""

# Try to use specified shell, fall back to sh if not available
if [ "$SHELL_TYPE" = "bash" ]; then
    docker exec -it "${container_name}" bash 2>/dev/null || \
    docker exec -it "${container_name}" sh
else
    docker exec -it "${container_name}" sh
fi

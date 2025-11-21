#!/bin/bash
# View Docker service logs

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Parse command line arguments
SERVICE=""
FOLLOW=false
TAIL="100"

while [[ $# -gt 0 ]]; do
    case $1 in
        --follow|-f)
            FOLLOW=true
            shift
            ;;
        --tail|-t)
            TAIL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./logs.sh [OPTIONS] [SERVICE]"
            echo ""
            echo "Arguments:"
            echo "  SERVICE           Specific service to view logs (optional)"
            echo "                    Options: react-app, nginx, postgres, pgadmin, traefik"
            echo ""
            echo "Options:"
            echo "  -f, --follow      Follow log output"
            echo "  -t, --tail N      Number of lines to show (default: 100)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./logs.sh                 # View last 100 lines of all services"
            echo "  ./logs.sh -f              # Follow all service logs"
            echo "  ./logs.sh nginx           # View nginx logs"
            echo "  ./logs.sh -f postgres     # Follow postgres logs"
            echo "  ./logs.sh -t 50 nginx     # View last 50 lines of nginx"
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

echo "📋 Viewing logs for Base2 Docker Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build docker-compose logs command
CMD="docker-compose -f $COMPOSE_FILE logs --tail=$TAIL"

if [ "$FOLLOW" = true ]; then
    CMD="$CMD -f"
fi

if [ -n "$SERVICE" ]; then
    CMD="$CMD $SERVICE"
    echo "Service: $SERVICE"
else
    echo "Services: All"
fi

echo "Follow: $FOLLOW | Lines: $TAIL"
echo ""

# Execute the command
eval $CMD

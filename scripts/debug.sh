#!/bin/bash
# Debug Docker services - inspect containers, networks, and volumes

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🐛 Debugging Base2 Docker Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Parse command line arguments
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Usage: ./debug.sh [SERVICE]"
            echo ""
            echo "Arguments:"
            echo "  SERVICE           Specific service to debug (optional)"
            echo "                    Options: react-app, nginx, postgres, pgadmin, traefik"
            echo ""
            echo "Examples:"
            echo "  ./debug.sh              # Debug all services"
            echo "  ./debug.sh postgres     # Debug postgres service"
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

if [ -n "$SERVICE" ]; then
    container_name="base2_${SERVICE}"
    
    echo "🔍 Debugging service: $SERVICE"
    echo ""
    
    # Check if container exists
    if ! docker ps -a --filter "name=${container_name}" --format "{{.Names}}" | grep -q "${container_name}"; then
        echo "❌ Container $container_name not found"
        exit 1
    fi
    
    # Container info
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Container Information:"
    docker inspect "${container_name}" --format='
Container: {{.Name}}
Status: {{.State.Status}}
Started: {{.State.StartedAt}}
Health: {{.State.Health.Status}}
Image: {{.Config.Image}}
'
    
    # Environment variables
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Environment Variables:"
    docker inspect "${container_name}" --format='{{range .Config.Env}}{{println .}}{{end}}' | sort
    
    # Port mappings
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Port Mappings:"
    docker port "${container_name}" 2>/dev/null || echo "No port mappings"
    
    # Networks
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔗 Networks:"
    docker inspect "${container_name}" --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}: {{$v.IPAddress}}{{println}}{{end}}'
    
    # Volumes
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💾 Volumes:"
    docker inspect "${container_name}" --format='{{range .Mounts}}{{.Type}}: {{.Source}} -> {{.Destination}}{{println}}{{end}}' || echo "No volumes"
    
    # Recent logs
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Recent Logs (last 20 lines):"
    docker logs --tail 20 "${container_name}"
    
else
    echo "🔍 Debugging all services"
    echo ""
    
    # Overall status
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Network info
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔗 Network Information:"
    docker network inspect base2_network --format='
Network: {{.Name}}
Driver: {{.Driver}}
Subnet: {{range .IPAM.Config}}{{.Subnet}}{{end}}

Connected Containers:
{{range $k, $v := .Containers}}  - {{$v.Name}} ({{$v.IPv4Address}})
{{end}}' 2>/dev/null || echo "Network not found"
    
    # Volume info
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💾 Volume Information:"
    docker volume ls --filter "name=base2" --format "table {{.Name}}\t{{.Driver}}\t{{.Mountpoint}}"
    
    # Resource usage
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📈 Resource Usage:"
    if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        docker stats --no-stream $(docker-compose -f "$COMPOSE_FILE" ps -q)
    else
        echo "No running containers"
    fi
    
    echo ""
    echo "💡 Debug specific service: ./scripts/debug.sh [service-name]"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

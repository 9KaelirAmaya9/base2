#!/bin/bash
# Traefik Container Diagnostic Script
# Comprehensive check for Traefik container status, logs, and configuration

set -e

COMPOSE_FILE="local.docker.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Traefik Container Diagnostic Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if container exists
CONTAINER_NAME="${COMPOSE_PROJECT_NAME:-base2}_traefik"
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Traefik container does not exist${NC}"
    echo "Run './scripts/start.sh' to create the container"
    exit 1
fi

# 1. Container Status
echo -e "${BLUE}📦 Container Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Container State Details
echo -e "${BLUE}🔧 Container State Details${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STATE=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Status}}')
RUNNING=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Running}}')
PAUSED=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Paused}}')
RESTARTING=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Restarting}}')
EXIT_CODE=$(docker inspect ${CONTAINER_NAME} --format='{{.State.ExitCode}}')
STARTED_AT=$(docker inspect ${CONTAINER_NAME} --format='{{.State.StartedAt}}')

echo "Status: ${STATE}"
echo "Running: ${RUNNING}"
echo "Paused: ${PAUSED}"
echo "Restarting: ${RESTARTING}"
echo "Exit Code: ${EXIT_CODE}"
echo "Started At: ${STARTED_AT}"

if [ "${STATE}" != "running" ]; then
    echo -e "${RED}⚠️  Container is not running!${NC}"
    ERROR=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Error}}')
    if [ -n "${ERROR}" ]; then
        echo -e "${RED}Error: ${ERROR}${NC}"
    fi
fi
echo ""

# 3. Health Check Status
echo -e "${BLUE}❤️  Health Check Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(docker inspect ${CONTAINER_NAME} --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check configured")
echo "Health Status: ${HEALTH}"

if [ "${HEALTH}" != "No health check configured" ] && [ "${HEALTH}" != "healthy" ]; then
    echo -e "${YELLOW}Health Check Logs:${NC}"
    docker inspect ${CONTAINER_NAME} --format='{{range .State.Health.Log}}{{.Output}}{{end}}' 2>/dev/null || echo "No health check logs available"
fi
echo ""

# 4. Port Bindings
echo -e "${BLUE}🌐 Port Bindings${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker port ${CONTAINER_NAME} 2>/dev/null || echo "No port bindings found"
echo ""

# Check for port conflicts
echo -e "${BLUE}🔌 Port Conflict Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TRAEFIK_PORTS=$(docker port ${CONTAINER_NAME} 2>/dev/null | awk '{print $3}' | cut -d: -f2)
if [ -n "${TRAEFIK_PORTS}" ]; then
    for port in ${TRAEFIK_PORTS}; do
        echo "Checking port ${port}..."
        lsof -i :${port} 2>/dev/null | grep -v "${CONTAINER_NAME}" || echo "  ✓ No conflicts on port ${port}"
    done
else
    echo -e "${YELLOW}⚠️  No ports are bound${NC}"
fi
echo ""

# 5. Environment Variables
echo -e "${BLUE}🔐 Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec ${CONTAINER_NAME} env | grep -E "TRAEFIK|LOG" | sort || echo "Could not retrieve environment variables"
echo ""

# 6. Network Information
echo -e "${BLUE}🌐 Network Information${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker inspect ${CONTAINER_NAME} --format='{{range $key, $value := .NetworkSettings.Networks}}Network: {{$key}}
IP Address: {{$value.IPAddress}}
Gateway: {{$value.Gateway}}{{end}}'
echo ""

# 7. Container Resource Usage
echo -e "${BLUE}💻 Resource Usage${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats ${CONTAINER_NAME} --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# 8. Full Container Logs
echo -e "${BLUE}📋 Complete Container Logs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Fetching all logs..."
echo ""
docker logs ${CONTAINER_NAME} 2>&1
echo ""

# 9. Error Analysis
echo -e "${BLUE}🔍 Error Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ERROR_COUNT=$(docker logs ${CONTAINER_NAME} 2>&1 | grep -i "error" | wc -l | tr -d ' ')
WARNING_COUNT=$(docker logs ${CONTAINER_NAME} 2>&1 | grep -i "warning" | wc -l | tr -d ' ')
FATAL_COUNT=$(docker logs ${CONTAINER_NAME} 2>&1 | grep -i "fatal" | wc -l | tr -d ' ')

echo "Error count: ${ERROR_COUNT}"
echo "Warning count: ${WARNING_COUNT}"
echo "Fatal count: ${FATAL_COUNT}"
echo ""

if [ ${ERROR_COUNT} -gt 0 ]; then
    echo -e "${RED}Errors found:${NC}"
    docker logs ${CONTAINER_NAME} 2>&1 | grep -i "error" | tail -20
    echo ""
fi

if [ ${WARNING_COUNT} -gt 0 ]; then
    echo -e "${YELLOW}Warnings found:${NC}"
    docker logs ${CONTAINER_NAME} 2>&1 | grep -i "warning" | tail -20
    echo ""
fi

if [ ${FATAL_COUNT} -gt 0 ]; then
    echo -e "${RED}Fatal errors found:${NC}"
    docker logs ${CONTAINER_NAME} 2>&1 | grep -i "fatal"
    echo ""
fi

# 10. Recent Activity
echo -e "${BLUE}📊 Recent Activity (Last 50 Lines)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker logs ${CONTAINER_NAME} --tail 50 2>&1
echo ""

# 11. Container Inspect (Full)
echo -e "${BLUE}🔬 Full Container Inspection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Saving full inspection to traefik-inspect.json..."
docker inspect ${CONTAINER_NAME} > traefik-inspect.json
echo -e "${GREEN}✅ Full inspection saved to traefik-inspect.json${NC}"
echo ""

# Summary
echo -e "${BLUE}📝 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "${STATE}" == "running" ] && [ "${HEALTH}" == "healthy" ]; then
    echo -e "${GREEN}✅ Traefik container is running and healthy${NC}"
elif [ "${STATE}" == "running" ]; then
    echo -e "${YELLOW}⚠️  Traefik container is running but health status is: ${HEALTH}${NC}"
else
    echo -e "${RED}❌ Traefik container is not running (State: ${STATE})${NC}"
fi

echo ""
echo "💡 Troubleshooting Tips:"
echo "  - Check error logs above for specific issues"
echo "  - Verify port bindings are not conflicting"
echo "  - Review traefik-inspect.json for detailed configuration"
echo "  - Run './scripts/logs.sh traefik -f' to follow live logs"
echo "  - Run './scripts/restart.sh traefik' to restart the container"
echo ""

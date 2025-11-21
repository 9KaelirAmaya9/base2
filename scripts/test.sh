#!/bin/bash

# Test Script - Run all tests for backend and frontend
# Usage: ./scripts/test.sh [--coverage] [--watch]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
COVERAGE_FLAG=""
WATCH_FLAG=""

for arg in "$@"
do
    case $arg in
        --coverage)
        COVERAGE_FLAG="--coverage"
        shift
        ;;
        --watch)
        WATCH_FLAG="--watch"
        shift
        ;;
        *)
        shift
        ;;
    esac
done

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Running All Tests${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Run backend tests
echo -e "${GREEN}Running Backend Tests...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo -e "${RED}Backend dependencies not installed. Run 'npm install' first.${NC}"
    exit 1
fi

if [ -n "$WATCH_FLAG" ]; then
    npm run test:watch
elif [ -n "$COVERAGE_FLAG" ]; then
    npm run test
else
    npm run test:ci
fi

BACKEND_EXIT_CODE=$?

cd ..

echo ""
echo -e "${GREEN}Running Frontend Tests...${NC}"
cd react-app

if [ ! -d "node_modules" ]; then
    echo -e "${RED}Frontend dependencies not installed. Run 'npm install' first.${NC}"
    exit 1
fi

if [ -n "$WATCH_FLAG" ]; then
    npm run test:watch
elif [ -n "$COVERAGE_FLAG" ]; then
    npm run test
else
    npm run test:ci
fi

FRONTEND_EXIT_CODE=$?

cd ..

echo ""
echo -e "${BLUE}================================================${NC}"

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${BLUE}================================================${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo -e "${BLUE}================================================${NC}"
    exit 1
fi

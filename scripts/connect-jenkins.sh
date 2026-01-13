#!/bin/bash

# ===========================================
# Dev-RPG Jenkins Integration Script
# Connects existing Jenkins container to Dev-RPG network
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK_NAME="dev-rpg-network"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Dev-RPG Jenkins Integration Script                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ===========================================
# Auto-detect Jenkins container if not provided
# ===========================================
if [ -z "$1" ]; then
    echo -e "${BLUE}[AUTO] Searching for Jenkins containers...${NC}"
    
    # Look for containers with 'jenkins' in the name
    JENKINS_CANDIDATES=$(docker ps --format '{{.Names}}' | grep -i jenkins || true)
    
    if [ -z "$JENKINS_CANDIDATES" ]; then
        echo -e "${RED}✗ No Jenkins container found!${NC}"
        echo ""
        echo "Running containers:"
        docker ps --format '  - {{.Names}}'
        echo ""
        echo "Usage: $0 <jenkins_container_name>"
        exit 1
    fi
    
    # Count candidates
    CANDIDATE_COUNT=$(echo "$JENKINS_CANDIDATES" | wc -l)
    
    if [ "$CANDIDATE_COUNT" -eq 1 ]; then
        JENKINS_CONTAINER_NAME="$JENKINS_CANDIDATES"
        echo -e "${GREEN}✓ Found Jenkins container: $JENKINS_CONTAINER_NAME${NC}"
    else
        echo -e "${YELLOW}⚠ Multiple Jenkins containers found:${NC}"
        echo "$JENKINS_CANDIDATES" | while read name; do echo "  - $name"; done
        echo ""
        echo "Please specify: $0 <container_name>"
        exit 1
    fi
else
    JENKINS_CONTAINER_NAME="$1"
fi

# ===========================================
# Step 1: Check Network
# ===========================================
echo ""
echo -e "${BLUE}[1/4] Checking Dev-RPG network...${NC}"
if ! docker network inspect $NETWORK_NAME > /dev/null 2>&1; then
    echo -e "${RED}✗ Dev-RPG network not found!${NC}"
    echo "Please run 'docker compose up -d' first to create the network."
    exit 1
fi
echo -e "${GREEN}✓ Network '$NETWORK_NAME' exists${NC}"

# ===========================================
# Step 2: Check Jenkins Container
# ===========================================
echo ""
echo -e "${BLUE}[2/4] Checking Jenkins container...${NC}"
if ! docker ps --format '{{.Names}}' | grep -q "^${JENKINS_CONTAINER_NAME}$"; then
    echo -e "${RED}✗ Jenkins container '$JENKINS_CONTAINER_NAME' not found or not running!${NC}"
    echo ""
    echo "Available containers:"
    docker ps --format '  - {{.Names}}'
    exit 1
fi
echo -e "${GREEN}✓ Jenkins container '$JENKINS_CONTAINER_NAME' is running${NC}"

# ===========================================
# Step 3: Connect to Network
# ===========================================
echo ""
echo -e "${BLUE}[3/4] Connecting Jenkins to Dev-RPG network...${NC}"
if docker network inspect $NETWORK_NAME | grep -q "\"$JENKINS_CONTAINER_NAME\""; then
    echo -e "${GREEN}✓ Jenkins already connected to '$NETWORK_NAME'${NC}"
else
    docker network connect $NETWORK_NAME $JENKINS_CONTAINER_NAME
    echo -e "${GREEN}✓ Jenkins connected to '$NETWORK_NAME'${NC}"
fi

# Bağlantıyı test et
echo ""
echo "[4/4] Testing connectivity..."

# Backend'e erişim testi
echo -n "  Testing backend connection... "
if docker exec $JENKINS_CONTAINER_NAME curl -s -f http://backend:3210/health > /dev/null 2>&1; then
    echo "✓ OK"
else
    echo -e "${RED}✗ FAILED (Backend might not be ready yet)${NC}"
fi

# n8n connection test
echo -n "  Testing n8n connection... "
if docker exec $JENKINS_CONTAINER_NAME curl -s -f http://n8n:5678 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ FAILED (n8n might not be ready yet)${NC}"
fi

# ===========================================
# Summary
# ===========================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Integration Complete!                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Jenkins can now access Dev-RPG services:                    ║"
echo "║                                                               ║"
echo "║  Backend API:  http://backend:3210                           ║"
echo "║  n8n Webhook:  http://n8n:5678/webhook/analyze-code          ║"
echo "║                                                               ║"
echo "║  Configure these URLs in Jenkins:                            ║"
echo "║  - Go to Jenkins > Manage Jenkins > Configure System         ║"
echo "║  - Or set as environment variables in your Jenkinsfile       ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Create Jenkins environment variables file
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cat > "$PROJECT_DIR/jenkins-env.properties" << EOF
# Dev-RPG Jenkins Environment Variables
# Use this file with EnvInject Plugin in Jenkins
# Generated on: $(date)

DEV_RPG_API_URL=http://backend:3210
DEV_RPG_N8N_URL=http://n8n:5678
DEV_RPG_FRONTEND_URL=http://frontend:80
DEV_RPG_OLLAMA_URL=http://ollama:11434

# MCP Agents (for debugging)
LIGHTHOUSE_MCP_URL=http://lighthouse_mcp:8000
CODE_QUALITY_MCP_URL=http://code_quality_mcp:8000
ARCHITECT_MCP_URL=http://architect_mcp:8000
EVENT_LOOP_MCP_URL=http://event_loop_mcp:8000
COST_MCP_URL=http://cost_mcp:8000
EOF

echo ""
echo -e "${GREEN}✓ Created jenkins-env.properties with environment variables${NC}"
echo ""

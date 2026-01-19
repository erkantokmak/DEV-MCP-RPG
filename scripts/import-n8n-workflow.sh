#!/bin/bash
# ===========================================
# n8n Workflow Import Helper
# ===========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW_FILE="$PROJECT_DIR/n8n-workflows/code-analysis-pipeline.json"
N8N_URL="${N8N_URL:-http://localhost:3220}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                n8n Workflow Import Helper                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo -e "${RED}✗ Workflow file not found: $WORKFLOW_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Workflow file found${NC}"
echo ""

# Check if n8n is running
echo -n "Checking n8n status... "
if curl -s "$N8N_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}Running${NC}"
else
    echo -e "${RED}Not responding${NC}"
    echo ""
    echo "Make sure n8n is running: docker compose up -d n8n"
    exit 1
fi

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  n8n requires manual workflow import through the web interface ${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Follow these steps:"
echo ""
echo -e "  ${BLUE}1.${NC} Open n8n in your browser:"
echo -e "     ${GREEN}$N8N_URL${NC}"
echo ""
echo -e "  ${BLUE}2.${NC} If first visit, create an account"
echo ""
echo -e "  ${BLUE}3.${NC} Go to: ${GREEN}Workflows${NC} → ${GREEN}Import from File${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} Select this file:"
echo -e "     ${GREEN}$WORKFLOW_FILE${NC}"
echo ""
echo -e "  ${BLUE}5.${NC} ${YELLOW}IMPORTANT:${NC} Activate the workflow (toggle switch)"
echo ""
echo ""

# Try to open browser automatically
if command -v xdg-open &> /dev/null; then
    read -p "Open n8n in browser now? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        xdg-open "$N8N_URL" 2>/dev/null &
        echo -e "${GREEN}Opening browser...${NC}"
    fi
elif command -v open &> /dev/null; then
    read -p "Open n8n in browser now? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        open "$N8N_URL" 2>/dev/null &
        echo -e "${GREEN}Opening browser...${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Tip: After import, test the webhook with:${NC}"
echo ""
echo "  curl -X POST $N8N_URL/webhook/analyze-code \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"code\": \"print(42)\", \"language\": \"python\"}'"
echo ""

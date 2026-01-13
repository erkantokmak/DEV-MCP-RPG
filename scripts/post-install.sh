#!/bin/bash
# ===========================================
# Dev-RPG Post-Installation Test Script
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              Dev-RPG Post-Installation Tests                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local url=$2
    local expected=${3:-200}
    
    echo -n "Testing $name... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo -e "${GREEN}✓ OK (HTTP $HTTP_CODE)${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE, expected $expected)${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

test_json_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    RESPONSE=$(curl -s "$url" 2>/dev/null)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] && echo "$RESPONSE" | jq . > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK (Valid JSON)${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE or Invalid JSON)${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# ===========================================
# Test MCP Services
# ===========================================
echo -e "${BLUE}[1/4] Testing MCP Services...${NC}"
echo "─────────────────────────────────────────────"

test_endpoint "Lighthouse MCP" "http://localhost:3201/health"
test_endpoint "Code Quality MCP" "http://localhost:3202/health"
test_endpoint "Architect MCP" "http://localhost:3203/health"
test_endpoint "Event Loop MCP" "http://localhost:3204/health"
test_endpoint "Cost MCP" "http://localhost:3205/health"

# ===========================================
# Test Backend API
# ===========================================
echo ""
echo -e "${BLUE}[2/4] Testing Backend API...${NC}"
echo "─────────────────────────────────────────────"

test_endpoint "Backend Health" "http://localhost:3210/health"
test_json_endpoint "MCP Status" "http://localhost:3210/api/mcp-status"
test_json_endpoint "API Docs" "http://localhost:3210/openapi.json"

# ===========================================
# Test Frontend
# ===========================================
echo ""
echo -e "${BLUE}[3/4] Testing Frontend...${NC}"
echo "─────────────────────────────────────────────"

test_endpoint "Frontend" "http://localhost:3200"

# ===========================================
# Test n8n
# ===========================================
echo ""
echo -e "${BLUE}[4/4] Testing n8n & Ollama...${NC}"
echo "─────────────────────────────────────────────"

test_endpoint "n8n Interface" "http://localhost:3220"
test_json_endpoint "Ollama API" "http://localhost:3260/api/tags"

# ===========================================
# Test Analysis Endpoint (Optional)
# ===========================================
echo ""
echo -e "${BLUE}[BONUS] Testing Full Analysis Pipeline...${NC}"
echo "─────────────────────────────────────────────"

echo -n "Testing /api/analyze endpoint... "
ANALYZE_RESPONSE=$(curl -s -X POST "http://localhost:3210/api/analyze" \
    -H "Content-Type: application/json" \
    -d '{"code": "function test() { return 42; }", "language": "javascript"}' 2>/dev/null)

if echo "$ANALYZE_RESPONSE" | jq '.lighthouse' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Analysis endpoint working${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Analysis endpoint may need more time or Ollama model${NC}"
fi

# ===========================================
# Summary
# ===========================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
TOTAL=$((PASSED + FAILED))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! ($PASSED/$TOTAL)${NC}"
    echo ""
    echo "Your Dev-RPG installation is complete and working!"
else
    echo -e "${YELLOW}⚠ $PASSED/$TOTAL tests passed${NC}"
    echo ""
    echo "Some services may still be starting. Wait a minute and try again:"
    echo "  ./scripts/post-install.sh"
fi

echo ""
exit $FAILED

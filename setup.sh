#!/bin/bash
# ===========================================
# Dev-RPG Setup Script v3.0
# AI-Powered CI/CD Tool with Groq API Integration
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Dev-RPG - AI-Powered CI/CD Tool Setup v3.0          ║"
echo "║                   Groq API Integration                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Project Directory: ${PROJECT_DIR}${NC}"
echo ""

# ===========================================
# Helper Functions
# ===========================================
log_step() {
    echo -e "\n${BLUE}[STEP $1] $2${NC}"
    echo "─────────────────────────────────────────────"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    echo -n "Waiting for $name"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo ""
            log_success "$name is ready"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""
    log_warning "$name is not responding yet (may still be starting)"
    return 1
}

# ===========================================
# Step 1: Check Prerequisites
# ===========================================
log_step "1/6" "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
log_success "Docker is installed: $(docker --version)"

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    log_success "Docker Compose V2 is available"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    log_success "Docker Compose V1 is available"
else
    log_error "Docker Compose is not installed."
    exit 1
fi

# Check if user can run docker without sudo
if ! docker ps > /dev/null 2>&1; then
    log_error "Cannot connect to Docker daemon. Try: sudo usermod -aG docker \$USER"
    exit 1
fi

# Check available disk space (need at least 5GB)
AVAILABLE_SPACE=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    log_warning "Low disk space: ${AVAILABLE_SPACE}GB available (recommended: 5GB+)"
fi

# ===========================================
# Step 2: Configure Groq API Key
# ===========================================
log_step "2/6" "Configuring Groq API..."

# Check for API key file
if [ -f "$PROJECT_DIR/apikey" ]; then
    GROQ_API_KEY=$(cat "$PROJECT_DIR/apikey" | tr -d '\n\r ')
    log_success "Found Groq API key in apikey file"
elif [ -n "$GROQ_API_KEY" ]; then
    log_success "Using GROQ_API_KEY from environment"
else
    log_error "Groq API key not found!"
    echo ""
    echo "Please provide your Groq API key. You can get one free at:"
    echo -e "${CYAN}https://console.groq.com/keys${NC}"
    echo ""
    echo "Option 1: Create an 'apikey' file in project root:"
    echo "  echo 'your-api-key-here' > $PROJECT_DIR/apikey"
    echo ""
    echo "Option 2: Set environment variable:"
    echo "  export GROQ_API_KEY='your-api-key-here'"
    echo ""
    exit 1
fi

# Validate API key format
if [[ ! "$GROQ_API_KEY" =~ ^gsk_ ]]; then
    log_warning "API key doesn't start with 'gsk_' - this may not be a valid Groq API key"
fi

# ===========================================
# Step 3: Create Environment File
# ===========================================
log_step "3/6" "Creating environment configuration..."

# Generate random password for PostgreSQL
RANDOM_PASS=$(openssl rand -hex 8 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16)

cat > "$PROJECT_DIR/.env" << EOF
# Dev-RPG Environment Configuration
# Generated on: $(date)

# Groq API (Cloud LLM - Free Tier)
GROQ_API_KEY=${GROQ_API_KEY}
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.1-8b-instant

# Database
POSTGRES_USER=dev_rpg_user
POSTGRES_PASSWORD=dev_rpg_secret_${RANDOM_PASS}
POSTGRES_DB=dev_rpg

# n8n
N8N_BASIC_AUTH_ACTIVE=false
N8N_SECURE_COOKIE=false

# Timezone
TZ=Europe/Istanbul

# Server IP (change this to your server's IP)
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
EOF

log_success "Created .env file with Groq API configuration"

# ===========================================
# Step 4: Build Docker Images (Sequential)
# ===========================================
log_step "4/6" "Building Docker images..."

cd "$PROJECT_DIR"

# Load environment
set -a
source "$PROJECT_DIR/.env"
set +a

# Build frontend first (to ensure it's ready before starting)
echo "Building frontend image..."
$COMPOSE_CMD build frontend
log_success "Frontend image built"

# Build backend
echo "Building backend image..."
$COMPOSE_CMD build backend
log_success "Backend image built"

# Build MCP agents
echo "Building MCP agent images..."
$COMPOSE_CMD build lighthouse_mcp code_quality_mcp architect_mcp event_loop_mcp cost_mcp
log_success "All MCP agents built"

log_success "All Docker images built successfully"

# ===========================================
# Step 5: Start Services (Sequential)
# ===========================================
log_step "5/6" "Starting services..."

# Start PostgreSQL first
echo "Starting PostgreSQL..."
$COMPOSE_CMD up -d postgres
sleep 5

# Wait for PostgreSQL to be ready
MAX_RETRIES=30
RETRY=0
until docker exec dev-rpg-postgres pg_isready -U dev_rpg_user -d dev_rpg > /dev/null 2>&1; do
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        log_warning "PostgreSQL is taking longer than expected..."
        break
    fi
    echo -n "."
    sleep 2
done
echo ""
log_success "PostgreSQL is ready"

# Start backend
echo "Starting Backend API..."
$COMPOSE_CMD up -d backend
sleep 3

# Start MCP agents
echo "Starting MCP agents..."
$COMPOSE_CMD up -d lighthouse_mcp code_quality_mcp architect_mcp event_loop_mcp cost_mcp
sleep 5

# Start n8n
echo "Starting n8n workflow engine..."
$COMPOSE_CMD up -d n8n
sleep 3

# Start frontend
echo "Starting Frontend..."
$COMPOSE_CMD up -d frontend
sleep 3

log_success "All services started"

# ===========================================
# Step 6: Verify Services
# ===========================================
log_step "6/6" "Verifying services..."

echo "Waiting for services to initialize..."
sleep 10

# Load SERVER_IP from .env
source "$PROJECT_DIR/.env" 2>/dev/null || true

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                    Service Health Check                     │"
echo "├───────────────────────┬───────────┬─────────────────────────┤"
printf "│ %-21s │ %-9s │ %-23s │\n" "Service" "Port" "Status"
echo "├───────────────────────┼───────────┼─────────────────────────┤"

check_service() {
    local name=$1
    local port=$2
    local endpoint=${3:-""}
    
    if [ "$name" = "PostgreSQL" ]; then
        if docker exec dev-rpg-postgres pg_isready -U dev_rpg_user > /dev/null 2>&1; then
            printf "│ %-21s │ %-9s │ ${GREEN}%-23s${NC} │\n" "$name" "$port" "● Running"
        else
            printf "│ %-21s │ %-9s │ ${RED}%-23s${NC} │\n" "$name" "$port" "○ Down"
        fi
    else
        if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            printf "│ %-21s │ %-9s │ ${GREEN}%-23s${NC} │\n" "$name" "$port" "● Running"
        else
            printf "│ %-21s │ %-9s │ ${YELLOW}%-23s${NC} │\n" "$name" "$port" "◐ Starting..."
        fi
    fi
}

check_service "Frontend" "3200" ""
check_service "Lighthouse MCP" "3201" "/health"
check_service "Code Quality MCP" "3202" "/health"
check_service "Architect MCP" "3203" "/health"
check_service "Event Loop MCP" "3204" "/health"
check_service "Cost MCP" "3205" "/health"
check_service "Backend API" "3210" "/health"
check_service "n8n Workflow" "3220" ""
check_service "PostgreSQL" "3231" ""

echo "└───────────────────────┴───────────┴─────────────────────────┘"

# ===========================================
# Final Output
# ===========================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ SETUP COMPLETE!                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Access Points:${NC}"
echo "   • Dashboard:      http://${SERVER_IP:-localhost}:3200"
echo "   • API Docs:       http://${SERVER_IP:-localhost}:3210/docs"
echo "   • n8n Workflows:  http://${SERVER_IP:-localhost}:3220"
echo ""
echo -e "${CYAN}🤖 LLM Provider: Groq API (Cloud)${NC}"
echo "   • Model: llama-3.1-8b-instant"
echo "   • Free tier: ~500 requests/day"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo ""
echo "   1️⃣  Import n8n Workflow:"
echo "       • Open http://${SERVER_IP:-localhost}:3220"
echo "       • Create account on first visit"
echo "       • Go to Workflows → Import from File"
echo "       • Select: n8n-workflows/code-analysis-pipeline.json"
echo "       • Activate the workflow (toggle switch)"
echo ""
echo "   2️⃣  Test the System:"
echo "       curl -X POST http://localhost:3210/api/analyze \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"code\": \"def hello(): print(42)\", \"language\": \"python\"}'"
echo ""
echo -e "${CYAN}📖 Full documentation: SETUP.md${NC}"
echo ""

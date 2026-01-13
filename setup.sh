#!/bin/bash
# ===========================================
# Dev-RPG Setup Script v2.0
# AI-Powered CI/CD Tool with Ollama Integration
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
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Dev-RPG - AI-Powered CI/CD Tool Setup v2.0          ║"
echo "║                   Local Ollama Integration                    ║"
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
log_step "1/8" "Checking prerequisites..."

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

# Check available disk space (need at least 10GB)
AVAILABLE_SPACE=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    log_warning "Low disk space: ${AVAILABLE_SPACE}GB available (recommended: 10GB+)"
fi

# ===========================================
# Step 2: Create Environment File
# ===========================================
log_step "2/8" "Creating environment configuration..."

if [ ! -f "$PROJECT_DIR/.env" ]; then
    # Generate random password
    RANDOM_PASS=$(openssl rand -hex 8 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16)
    
    cat > "$PROJECT_DIR/.env" << EOF
# Dev-RPG Environment Configuration
# Generated on: $(date)

# Database
POSTGRES_USER=dev_rpg_user
POSTGRES_PASSWORD=dev_rpg_secret_${RANDOM_PASS}
POSTGRES_DB=dev_rpg

# Ollama
OLLAMA_MODEL=${OLLAMA_MODEL}

# n8n
N8N_BASIC_AUTH_ACTIVE=false
N8N_SECURE_COOKIE=false

# Timezone
TZ=Europe/Istanbul

# Server IP (change this to your server's IP)
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
EOF
    log_success "Created .env file with secure random password"
else
    log_warning ".env file already exists, skipping..."
fi

# Load environment
source "$PROJECT_DIR/.env" 2>/dev/null || true

# ===========================================
# Step 3: Create Required Directories
# ===========================================
log_step "3/8" "Creating directory structure..."

directories=(
    "logs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$PROJECT_DIR/$dir"
done
log_success "Directory structure created"

# ===========================================
# Step 4: Build Docker Images
# ===========================================
log_step "4/8" "Building Docker images..."

cd "$PROJECT_DIR"

# Build all images
echo "Building Docker images (this may take several minutes)..."
$COMPOSE_CMD build --parallel 2>/dev/null || $COMPOSE_CMD build

log_success "Docker images built successfully"

# ===========================================
# Step 5: Start Core Infrastructure
# ===========================================
log_step "5/8" "Starting core infrastructure..."

# Start core services first (database and ollama)
echo "Starting PostgreSQL and Ollama..."
$COMPOSE_CMD up -d postgres ollama

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to be ready..."
sleep 5
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

# ===========================================
# Step 6: Pull Ollama Model
# ===========================================
log_step "6/8" "Setting up Ollama LLM..."

# Wait for Ollama to be ready
wait_for_service "http://localhost:3260/api/tags" "Ollama API" 60

# Check if model is already pulled
MODELS=$(docker exec dev-rpg-ollama ollama list 2>/dev/null || echo "")
if echo "$MODELS" | grep -q "$OLLAMA_MODEL"; then
    log_success "Model '$OLLAMA_MODEL' is already available"
else
    echo "Pulling $OLLAMA_MODEL model (this may take 5-15 minutes)..."
    echo "Model size: ~4GB for llama3"
    docker exec dev-rpg-ollama ollama pull "$OLLAMA_MODEL"
    log_success "Model '$OLLAMA_MODEL' pulled successfully"
fi

# ===========================================
# Step 7: Start All Services
# ===========================================
log_step "7/8" "Starting all services..."

$COMPOSE_CMD up -d

echo "Waiting for services to initialize..."
sleep 15

# ===========================================
# Step 8: Verify All Services
# ===========================================
log_step "8/8" "Verifying services..."

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
check_service "PostgreSQL" "3230" ""
check_service "Ollama LLM" "3260" "/api/tags"

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
echo -e "${YELLOW}📋 REMAINING MANUAL STEPS:${NC}"
echo ""
echo "   1️⃣  Import n8n Workflow:"
echo "       • Open http://${SERVER_IP:-localhost}:3220"
echo "       • Create account on first visit"
echo "       • Go to Workflows → Import from File"
echo "       • Select: n8n-workflows/code-analysis-pipeline.json"
echo "       • Activate the workflow (toggle switch)"
echo ""
echo "   2️⃣  Connect Jenkins (if using Docker Jenkins):"
echo "       ./scripts/connect-jenkins.sh <your-jenkins-container-name>"
echo ""
echo "   3️⃣  Test the System:"
echo "       curl -X POST http://localhost:3210/api/analyze \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"code\": \"def hello(): print(42)\", \"language\": \"python\"}'"
echo ""
echo -e "${CYAN}📖 Full documentation: SETUP.md${NC}"
echo -e "${CYAN}🚀 Quick reference: QUICKSTART.md${NC}"
echo ""

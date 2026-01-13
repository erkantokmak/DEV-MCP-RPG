# ===========================================
# Dev-RPG Makefile
# Quick commands for common operations
# ===========================================

.PHONY: help install start stop restart logs test clean build status shell

# Default: show help
help:
	@echo "╔═══════════════════════════════════════════════════════════════╗"
	@echo "║                Dev-RPG - Available Commands                   ║"
	@echo "╚═══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make install     - Run full installation (setup.sh)"
	@echo "  make start       - Start all services"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View all container logs"
	@echo "  make test        - Run post-installation tests"
	@echo "  make status      - Show service status"
	@echo "  make clean       - Stop and remove all containers/volumes"
	@echo "  make build       - Rebuild all Docker images"
	@echo ""
	@echo "  make logs-backend    - Backend logs only"
	@echo "  make logs-frontend   - Frontend logs only"
	@echo "  make logs-n8n        - n8n logs only"
	@echo "  make logs-ollama     - Ollama logs only"
	@echo ""
	@echo "  make shell-backend   - Shell into backend container"
	@echo "  make shell-ollama    - Shell into Ollama container"
	@echo "  make shell-postgres  - PostgreSQL shell"
	@echo ""
	@echo "  make analyze CODE=\"your code\" - Quick code analysis"
	@echo ""

# ===========================================
# Main Commands
# ===========================================

install:
	@chmod +x setup.sh
	@./setup.sh

start:
	@docker compose up -d
	@echo "✓ Services started"
	@make status

stop:
	@docker compose down
	@echo "✓ Services stopped"

restart:
	@docker compose restart
	@echo "✓ Services restarted"
	@make status

logs:
	@docker compose logs -f --tail=100

test:
	@chmod +x scripts/post-install.sh
	@./scripts/post-install.sh

status:
	@echo ""
	@echo "Service Status:"
	@echo "─────────────────────────────────────────────"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

clean:
	@echo "⚠ This will remove all containers and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo ""; \
		docker compose down -v --remove-orphans; \
		echo "✓ Cleaned up"; \
	else \
		echo ""; \
		echo "Cancelled."; \
	fi

build:
	@docker compose build --parallel
	@echo "✓ Images built"

# ===========================================
# Service-specific Logs
# ===========================================

logs-backend:
	@docker compose logs -f backend --tail=100

logs-frontend:
	@docker compose logs -f frontend --tail=100

logs-n8n:
	@docker compose logs -f n8n --tail=100

logs-ollama:
	@docker compose logs -f ollama --tail=100

logs-mcp:
	@docker compose logs -f lighthouse_mcp code_quality_mcp architect_mcp event_loop_mcp cost_mcp --tail=50

# ===========================================
# Shell Access
# ===========================================

shell-backend:
	@docker exec -it dev-rpg-backend sh

shell-ollama:
	@docker exec -it dev-rpg-ollama sh

shell-postgres:
	@docker exec -it dev-rpg-postgres psql -U dev_rpg_user -d dev_rpg

shell-n8n:
	@docker exec -it dev-rpg-n8n sh

# ===========================================
# Quick Analysis
# ===========================================

analyze:
ifndef CODE
	@echo "Usage: make analyze CODE=\"your code here\""
	@echo "Example: make analyze CODE=\"def hello(): print(42)\""
else
	@curl -s -X POST http://localhost:3210/api/analyze \
		-H "Content-Type: application/json" \
		-d '{"code": "$(CODE)", "language": "python"}' | jq .
endif

# ===========================================
# Development Helpers
# ===========================================

pull-model:
	@echo "Pulling Ollama model..."
	@docker exec dev-rpg-ollama ollama pull llama3

update:
	@git pull
	@make build
	@make restart
	@echo "✓ Updated and restarted"

jenkins-connect:
	@chmod +x scripts/connect-jenkins.sh
	@./scripts/connect-jenkins.sh

import-workflow:
	@chmod +x scripts/import-n8n-workflow.sh
	@./scripts/import-n8n-workflow.sh

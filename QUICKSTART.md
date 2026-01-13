# 🎮 Dev-RPG Quick Start

## ⚡ One-Command Installation

```bash
./setup.sh
```

## 🚀 Quick Commands (Makefile)

| Command | Description |
|---------|-------------|
| `make install` | Full installation |
| `make start` | Start all services |
| `make stop` | Stop all services |
| `make status` | Service status |
| `make logs` | View logs |
| `make test` | Run health tests |

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:3200 | Main UI |
| API Docs | http://localhost:3210/docs | Swagger docs |
| n8n | http://localhost:3220 | Workflows |

## 🔌 Port Reference

```
3200 - Frontend
3201 - Lighthouse MCP
3202 - Code Quality MCP
3203 - Architect MCP
3204 - Event Loop MCP
3205 - Cost MCP
3210 - Backend API
3220 - n8n
3230 - PostgreSQL
3260 - Ollama
```

## 🧪 Quick Test

```bash
# Health check
curl http://localhost:3210/health

# Analyze code
curl -X POST http://localhost:3210/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "print(42)", "language": "python"}'

# Or with Makefile
make analyze CODE="def hello(): return 42"
```

## 🔧 Jenkins Integration

```bash
./scripts/connect-jenkins.sh <your-jenkins-container>
```

## 📥 n8n Workflow Import

1. Open http://localhost:3220
2. Create account
3. Workflows → Import from File
4. Select `n8n-workflows/code-analysis-pipeline.json`
5. **Activate the workflow!**

## 🐛 Troubleshooting

```bash
# Check if services are running
make status

# View specific logs
make logs-backend
make logs-ollama

# Restart everything
make restart

# Full reset
make clean && make install
```

## 📖 Full Documentation

See [SETUP.md](SETUP.md) for detailed documentation.

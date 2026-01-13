# Dev-RPG: AI-Powered CI/CD Tool
## Local Ollama Integration Guide

### 🎮 Overview

Dev-RPG is a gamified, AI-powered CI/CD analysis tool that uses local LLM (Ollama) to analyze code quality, architecture, performance, and cost.

### 📦 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Dev-RPG Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐     ┌─────────┐     ┌─────────────────────────────┐  │
│  │ Jenkins  │────▶│   n8n   │────▶│      MCP Agents             │  │
│  │ Webhook  │     │ :3220   │     │  ┌─────────┐ ┌─────────┐    │  │
│  └──────────┘     └────┬────┘     │  │CodeQual │ │Architect│    │  │
│                        │          │  │ :3202   │ │ :3203   │    │  │
│                        │          │  └────┬────┘ └────┬────┘    │  │
│                        │          │       │           │         │  │
│                        │          │  ┌────▼───────────▼────┐    │  │
│                        │          │  │      OLLAMA         │    │  │
│                        │          │  │      :3260          │    │  │
│                        │          │  │   (llama3/mistral)  │    │  │
│                        │          │  └─────────────────────┘    │  │
│                        │          │       │           │         │  │
│                        │          │  ┌────▼────┐ ┌────▼────┐    │  │
│                        │          │  │EventLoop│ │  Cost   │    │  │
│                        │          │  │ :3204   │ │ :3205   │    │  │
│                        │          │  └─────────┘ └─────────┘    │  │
│                        │          └─────────────────────────────┘  │
│                        │                      │                     │
│                        ▼                      ▼                     │
│                   ┌─────────┐          ┌──────────┐                │
│                   │Backend  │◀─────────│PostgreSQL│                │
│                   │ :3210   │          │  :3230   │                │
│                   └────┬────┘          └──────────┘                │
│                        │                                           │
│                        ▼                                           │
│                   ┌─────────┐                                      │
│                   │Frontend │                                      │
│                   │ :3200   │                                      │
│                   └─────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 🚀 Quick Start

#### 1. Clone and Setup
```bash
cd /path/to/MCPCICD
chmod +x setup.sh
./setup.sh
```

#### 2. Manual Setup (Alternative)

**Start containers:**
```bash
docker compose up -d
```

**Pull the Ollama model:**
```bash
# Pull llama3 (recommended)
docker exec -it dev-rpg-ollama ollama pull llama3

# Or pull mistral (alternative)
docker exec -it dev-rpg-ollama ollama pull mistral
```

**Verify Ollama is working:**
```bash
curl http://localhost:3260/api/tags
```

### 🔧 Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3200 | React/Vite UI |
| Lighthouse MCP | 3201 | Web performance (no LLM) |
| Code Quality MCP | 3202 | Clean code analysis |
| Architect MCP | 3203 | Architecture analysis |
| Event Loop MCP | 3204 | Async/blocking detection |
| Cost MCP | 3205 | Big-O & cost estimation |
| Backend API | 3210 | Express.js API |
| n8n | 3220 | Workflow orchestrator |
| PostgreSQL | 3230 | Database |
| Ollama | 3260 | Local LLM API |

### 📡 API Examples

#### Test Code Quality MCP
```bash
curl -X POST http://localhost:3202/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def calculate_sum(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total",
    "language": "python",
    "file_path": "utils/math.py"
  }'
```

#### Test Architect MCP
```bash
curl -X POST http://localhost:3203/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "from models.user import User\nfrom services.auth import AuthService\nfrom controllers.user_controller import UserController\n\nclass App:\n    def __init__(self):\n        self.auth = AuthService()\n        self.controller = UserController()",
    "language": "python"
  }'
```

#### Test Event Loop MCP
```bash
curl -X POST http://localhost:3204/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const fs = require(\"fs\");\nconst data = fs.readFileSync(\"file.txt\");\nconsole.log(data);",
    "language": "javascript",
    "runtime": "node"
  }'
```

#### Test Cost MCP
```bash
curl -X POST http://localhost:3205/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr",
    "language": "python"
  }'
```

### 🔄 n8n Workflow Setup

1. Access n8n at `http://localhost:3220`
2. Create a new workflow or import from `n8n-workflows/code-analysis-pipeline.json`
3. The webhook endpoint will be: `http://localhost:3220/webhook/analyze-code`

#### Jenkins Integration

Add a post-build action in Jenkins:
```groovy
pipeline {
    agent any
    stages {
        stage('Analyze Code') {
            steps {
                script {
                    def code = readFile('src/main.py')
                    def response = httpRequest(
                        httpMode: 'POST',
                        url: 'http://localhost:3220/webhook/analyze-code',
                        contentType: 'APPLICATION_JSON',
                        requestBody: """
                        {
                            "code": "${code.replace('"', '\\"').replace('\n', '\\n')}",
                            "language": "python",
                            "file_path": "src/main.py",
                            "commit_id": "${env.GIT_COMMIT}"
                        }
                        """
                    )
                    echo "Analysis Result: ${response.content}"
                }
            }
        }
    }
}
```

### 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f code_quality_mcp

# Stop all services
docker compose down

# Rebuild a specific service
docker compose build code_quality_mcp
docker compose up -d code_quality_mcp

# Check Ollama models
docker exec dev-rpg-ollama ollama list

# Pull a different model
docker exec dev-rpg-ollama ollama pull codellama

# Interactive Ollama chat (for testing)
docker exec -it dev-rpg-ollama ollama run llama3
```

### 🔍 Troubleshooting

#### Ollama Not Responding
```bash
# Check if Ollama is running
docker logs dev-rpg-ollama

# Restart Ollama
docker compose restart ollama

# Verify model is pulled
docker exec dev-rpg-ollama ollama list
```

#### MCP Agent Errors
```bash
# Check agent logs
docker compose logs -f code_quality_mcp

# Verify Ollama connectivity from inside container
docker exec dev-rpg-code-quality-mcp curl http://ollama:11434/api/tags
```

#### Database Connection Issues
```bash
# Check PostgreSQL
docker exec dev-rpg-postgres pg_isready -U dev_rpg_user -d dev_rpg

# Access psql
docker exec -it dev-rpg-postgres psql -U dev_rpg_user -d dev_rpg
```

### 📊 Response Format Examples

#### Code Quality Response
```json
{
  "score": 75,
  "issues": [
    {
      "type": "naming",
      "severity": "low",
      "line": 5,
      "message": "Variable name 'x' is not descriptive",
      "suggestion": "Use a more meaningful name like 'counter'"
    }
  ],
  "summary": "Code is functional but has some minor clean code violations",
  "model_used": "llama3"
}
```

#### Full Pipeline Response
```json
{
  "report_id": "RPT-1704067200000",
  "overall_score": 82,
  "status": "good",
  "scores_breakdown": [
    {"category": "code_quality", "score": 85, "weight": "30%"},
    {"category": "architecture", "score": 78, "weight": "25%"},
    {"category": "event_loop", "score": 90, "weight": "20%"},
    {"category": "efficiency", "score": 75, "weight": "25%"}
  ],
  "rpg_summary": {
    "xp_earned": 820,
    "badges_earned": ["Async Ninja"],
    "level_up": false
  }
}
```

### 🎯 Environment Variables

Each MCP agent supports these environment variables:
- `OLLAMA_URL`: Ollama API endpoint (default: `http://ollama:11434`)
- `OLLAMA_MODEL`: Model to use (default: `llama3`)
- `PORT`: Service port (default: `8000`)

### 📈 Performance Tips

1. **Use llama3 for faster responses** - It's optimized for code tasks
2. **GPU Support**: If you have NVIDIA GPU, add to docker-compose:
   ```yaml
   ollama:
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```
3. **Increase timeout** for large codebases in n8n workflow settings

---

**Happy Coding! 🚀🎮**

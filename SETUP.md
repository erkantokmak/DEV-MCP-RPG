# 🎮 Dev-RPG Kurulum ve Yapılandırma Rehberi

## İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Sistem Gereksinimleri](#sistem-gereksinimleri)
3. [Hızlı Başlangıç](#hızlı-başlangıç)
4. [Detaylı Kurulum](#detaylı-kurulum)
5. [Servis Portları](#servis-portları)
6. [Jenkins Entegrasyonu](#jenkins-entegrasyonu)
7. [n8n Workflow Yapılandırması](#n8n-workflow-yapılandırması)
8. [Ollama LLM Kurulumu](#ollama-llm-kurulumu)
9. [API Kullanımı](#api-kullanımı)
10. [Sorun Giderme](#sorun-giderme)
11. [Geliştirici Notları](#geliştirici-notları)

---

## Proje Genel Bakış

Dev-RPG, CI/CD süreçlerini oyunlaştırılmış bir deneyime dönüştüren, yerel AI destekli bir kod analiz platformudur.

### Mimari

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DEV-RPG STACK                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   Jenkins    │───▶│     n8n      │───▶│    MCP Agents        │   │
│  │  (CI/CD)     │    │ (Orchestrator)│    │ ┌────────────────┐  │   │
│  │  Port: 3280  │    │  Port: 3220  │    │ │ Lighthouse:3201│  │   │
│  └──────────────┘    └──────┬───────┘    │ │ CodeQuality:3202│  │   │
│                             │            │ │ Architect:3203  │  │   │
│                             ▼            │ │ EventLoop:3204  │  │   │
│  ┌──────────────┐    ┌──────────────┐    │ │ Cost:3205       │  │   │
│  │   Frontend   │◀───│   Backend    │◀───│ └────────────────┘  │   │
│  │   (React)    │    │  (FastAPI)   │    └──────────┬───────────┘   │
│  │  Port: 3200  │    │  Port: 3210  │               │               │
│  └──────────────┘    └──────┬───────┘               ▼               │
│                             │            ┌──────────────────────┐   │
│                             ▼            │      Ollama LLM      │   │
│                      ┌──────────────┐    │     (Llama 3)        │   │
│                      │  PostgreSQL  │    │     Port: 3260       │   │
│                      │  Port: 3230  │    └──────────────────────┘   │
│                      └──────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### MCP Ajanları

| Ajan | Port | Açıklama |
|------|------|----------|
| **The Scout** (Lighthouse) | 3201 | Web performans, erişilebilirlik ve SEO analizi |
| **The Sensei** (Code Quality) | 3202 | Clean Code prensipleri ve okunabilirlik analizi |
| **The Architect** | 3203 | Mimari katman ihlalleri ve bağımlılık analizi |
| **The Loop Watcher** | 3204 | Event loop bloklama ve async pattern analizi |
| **The Accountant** (Cost) | 3205 | Big-O karmaşıklık ve bulut maliyet tahmini |

---

## Sistem Gereksinimleri

### Minimum Gereksinimler

- **İşletim Sistemi**: Debian 11+ / Ubuntu 20.04+
- **RAM**: 8 GB (Ollama için minimum)
- **Disk**: 20 GB boş alan
- **CPU**: 4 çekirdek

### Önerilen Gereksinimler

- **RAM**: 16+ GB (Ollama daha iyi performans için)
- **GPU**: NVIDIA GPU (isteğe bağlı, Ollama hızlandırması için)
- **Disk**: 50 GB SSD

### Yazılım Gereksinimleri

```bash
# Docker & Docker Compose
docker --version  # 24.0+
docker compose version  # 2.20+

# Git
git --version  # 2.30+
```

---

## Hızlı Başlangıç

### 1. Projeyi Klonlayın

```bash
git clone <repository-url> dev-rpg
cd dev-rpg
```

### 2. Ortam Değişkenlerini Yapılandırın (Opsiyonel)

```bash
# .env dosyası oluşturun
cat > .env << EOF
# Database
POSTGRES_PASSWORD=dev_rpg_secret_2026

# Ollama Model (llama3, mistral, codellama vb.)
OLLAMA_MODEL=llama3

# Timezone
TZ=Europe/Istanbul
EOF
```

### 3. Servisleri Başlatın

```bash
# Tüm servisleri başlat
docker compose up -d

# Logları izle
docker compose logs -f
```

### 4. Ollama Modelini Yükleyin

```bash
# Ollama container'ına bağlan ve modeli indir
docker exec -it dev-rpg-ollama ollama pull llama3
```

### 5. Servislere Erişin

| Servis | URL |
|--------|-----|
| Frontend Dashboard | http://localhost:3200 |
| Backend API Docs | http://localhost:3210/docs |
| n8n Workflow Editor | http://localhost:3220 |
| PostgreSQL | localhost:3230 |

---

## Detaylı Kurulum

### Adım 1: Docker Kurulumu (Debian)

```bash
# Eski sürümleri kaldır
sudo apt-get remove docker docker-engine docker.io containerd runc

# Gerekli paketleri yükle
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker GPG anahtarını ekle
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Repository ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı yükle
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
newgrp docker
```

### Adım 2: GPU Desteği (Opsiyonel - NVIDIA)

```bash
# NVIDIA Container Toolkit kurulumu
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### Adım 3: Proje Yapısını Oluşturun

```bash
# Proje klasörüne git
cd /path/to/dev-rpg

# Gerekli dizinleri oluştur
mkdir -p database frontend backend mcp-agents/{lighthouse_mcp,code_quality_mcp,architect_mcp,event_loop_mcp,cost_mcp,shared} n8n-workflows scripts

# Script'lere çalıştırma izni ver
chmod +x scripts/*.sh setup.sh
```

### Adım 4: İmajları Oluşturun ve Başlatın

```bash
# İmajları oluştur
docker compose build

# Servisleri başlat
docker compose up -d

# Durumu kontrol et
docker compose ps
```

### Adım 5: Veritabanını Kontrol Edin

```bash
# PostgreSQL'e bağlan
docker exec -it dev-rpg-postgres psql -U dev_rpg_user -d dev_rpg

# Tabloları listele
\dt

# Çıkış
\q
```

---

## Servis Portları

Tüm servisler 3200-3300 port aralığında çalışır:

| Servis | Dış Port | İç Port | Açıklama |
|--------|----------|---------|----------|
| Frontend | 3200 | 80 | React Dashboard |
| Lighthouse MCP | 3201 | 8000 | Performans Analizi |
| Code Quality MCP | 3202 | 8000 | Kod Kalitesi |
| Architect MCP | 3203 | 8000 | Mimari Analizi |
| Event Loop MCP | 3204 | 8000 | Async Analizi |
| Cost MCP | 3205 | 8000 | Maliyet Tahmini |
| Backend API | 3210 | 3210 | FastAPI Gateway |
| n8n | 3220 | 5678 | Workflow Engine |
| PostgreSQL | 3230 | 5432 | Veritabanı |
| Ollama | 3260 | 11434 | LLM Engine |
| Jenkins (opsiyonel) | 3280 | 8080 | CI/CD |

---

## Jenkins Entegrasyonu

### Seçenek 1: Mevcut Jenkins'i Dev-RPG Ağına Bağlama

Eğer Jenkins zaten bir Docker container'da çalışıyorsa:

```bash
# Jenkins container adını öğren
docker ps | grep jenkins

# Script'i çalıştır
./scripts/connect-jenkins.sh <jenkins_container_name>
```

### Seçenek 2: Jenkins'i Dev-RPG Stack'ine Dahil Etme

```bash
# Jenkins ile birlikte başlat
docker compose -f docker-compose.yml -f docker-compose.jenkins.yml up -d
```

### Jenkins Pipeline Yapılandırması

1. **Jenkins'te Yeni Pipeline Oluşturun**:
   - Jenkins Dashboard > New Item > Pipeline
   - İsim: `dev-rpg-analysis`

2. **Pipeline Script**:
   - "Pipeline script from SCM" seçin
   - SCM: Git
   - Repository URL: Proje repository'si
   - Script Path: `Jenkinsfile`

3. **Ortam Değişkenlerini Tanımlayın**:
   - Jenkins > Manage Jenkins > Configure System > Global properties
   - Environment variables ekleyin:
     ```
     DEV_RPG_API_URL=http://backend:3210
     DEV_RPG_N8N_URL=http://n8n:5678
     ```

4. **HTTP Request Plugin'i Yükleyin**:
   - Jenkins > Manage Jenkins > Manage Plugins
   - "HTTP Request Plugin" arayın ve yükleyin

### Webhook Yapılandırması

Jenkins'ten manuel test:

```bash
curl -X POST http://localhost:3220/webhook/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "commit_id": "abc123",
    "branch": "main",
    "author": "developer",
    "code": "function example() { return 42; }",
    "language": "javascript",
    "file_path": "src/example.js"
  }'
```

---

## n8n Workflow Yapılandırması

### Workflow'u İçe Aktarma

1. n8n arayüzüne gidin: http://localhost:3220
2. İlk kurulumda kullanıcı oluşturun
3. "Workflows" > "Import from file"
4. `n8n-workflows/code-analysis-pipeline.json` dosyasını seçin
5. Workflow'u aktifleştirin

### Webhook URL'i

```
http://localhost:3220/webhook/analyze-code
```

Docker ağı içinden:
```
http://n8n:5678/webhook/analyze-code
```

### Test Etme

```bash
# Basit test
curl -X POST http://localhost:3220/webhook/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def calculate(n):\n    total = 0\n    for i in range(n):\n        for j in range(n):\n            total += i * j\n    return total",
    "language": "python",
    "file_path": "src/calculator.py"
  }'
```

---

## Ollama LLM Kurulumu

### Model İndirme

```bash
# Llama 3 (önerilen)
docker exec -it dev-rpg-ollama ollama pull llama3

# Alternatif modeller
docker exec -it dev-rpg-ollama ollama pull mistral
docker exec -it dev-rpg-ollama ollama pull codellama
```

### Model Değiştirme

`docker-compose.yml` dosyasında:

```yaml
environment:
  - OLLAMA_MODEL=mistral  # llama3 yerine mistral kullan
```

### Ollama API Test

```bash
# Model listesi
curl http://localhost:3260/api/tags

# Basit prompt
curl http://localhost:3260/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

---

## API Kullanımı

### Backend API Endpoints

#### Health Check
```bash
curl http://localhost:3210/health
```

#### Kod Analizi
```bash
curl -X POST http://localhost:3210/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }'
```

#### MCP Durumu
```bash
curl http://localhost:3210/api/mcp/status
```

#### Leaderboard
```bash
curl http://localhost:3210/api/leaderboard?limit=10
```

#### Raporlar
```bash
# Tüm raporlar
curl http://localhost:3210/api/reports

# Belirli rapor
curl http://localhost:3210/api/reports/RPT-123456789
```

### Swagger Dokümantasyonu

Tam API dokümantasyonu için: http://localhost:3210/docs

---

## Sorun Giderme

### Servis Durumu Kontrolü

```bash
# Tüm servislerin durumu
docker compose ps

# Belirli servisin logları
docker compose logs -f backend

# Health check
curl http://localhost:3210/health
```

### Yaygın Sorunlar

#### 1. Ollama Bağlantı Hatası

**Belirti**: MCP'ler "ollama_connected: false" gösteriyor

**Çözüm**:
```bash
# Ollama container'ının çalıştığından emin ol
docker compose logs ollama

# Modelin yüklü olduğunu kontrol et
docker exec -it dev-rpg-ollama ollama list

# Model yükle
docker exec -it dev-rpg-ollama ollama pull llama3
```

#### 2. Veritabanı Bağlantı Hatası

**Belirti**: Backend "Database unavailable" hatası veriyor

**Çözüm**:
```bash
# PostgreSQL durumu
docker compose logs postgres

# Veritabanı bağlantı testi
docker exec -it dev-rpg-postgres pg_isready -U dev_rpg_user -d dev_rpg

# Tabloların oluştuğunu kontrol et
docker exec -it dev-rpg-postgres psql -U dev_rpg_user -d dev_rpg -c "\dt"
```

#### 3. n8n Webhook Çalışmıyor

**Belirti**: Webhook yanıt vermiyor

**Çözüm**:
```bash
# n8n logları
docker compose logs n8n

# Workflow'un aktif olduğundan emin ol (n8n UI'dan)
# Webhook URL'ini kontrol et: http://localhost:3220/webhook/analyze-code
```

#### 4. MCP Timeout Hatası

**Belirti**: Analiz çok uzun sürüyor veya timeout veriyor

**Çözüm**:
- Ollama modelinin doğru yüklendiğinden emin olun
- Daha küçük kod parçaları gönderin
- Timeout değerini artırın (docker-compose.yml)

#### 5. Frontend Backend'e Bağlanamıyor

**Belirti**: CORS hatası veya bağlantı reddedildi

**Çözüm**:
```bash
# Backend'in çalıştığını kontrol et
curl http://localhost:3210/health

# CORS ayarlarını kontrol et (backend/main.py)
# Frontend'in doğru API URL'ini kullandığını kontrol et
```

### Log Analizi

```bash
# Tüm loglar
docker compose logs

# Belirli zaman aralığı
docker compose logs --since 1h

# Sadece hatalar
docker compose logs 2>&1 | grep -i error
```

### Servisleri Yeniden Başlatma

```bash
# Tek servis
docker compose restart backend

# Tüm servisler
docker compose restart

# Tamamen yeniden oluştur
docker compose down
docker compose up -d --build
```

---

## Geliştirici Notları

### Yerel Geliştirme

```bash
# Frontend development
cd frontend
npm install
npm run dev  # http://localhost:5173

# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 3210
```

### MCP Test Etme

```bash
# Code Quality MCP
curl -X POST http://localhost:3202/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "x=1;y=2;z=x+y", "language": "python"}'

# Architect MCP
curl -X POST http://localhost:3203/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "from infrastructure import db", "language": "python", "file_path": "domain/user.py"}'
```

### Yeni MCP Ekleme

1. `mcp-agents/` altında yeni klasör oluşturun
2. `main.py`, `requirements.txt`, `Dockerfile` dosyalarını oluşturun
3. `docker-compose.yml`'a servis ekleyin
4. n8n workflow'unu güncelleyin

### Veritabanı Migrasyonu

```bash
# Yeni SQL dosyası
cat > database/migrations/001_add_feature.sql << EOF
ALTER TABLE users ADD COLUMN feature_flag BOOLEAN DEFAULT FALSE;
EOF

# Uygula
docker exec -i dev-rpg-postgres psql -U dev_rpg_user -d dev_rpg < database/migrations/001_add_feature.sql
```

---

## Destek

Sorunlar için:
1. GitHub Issues açın
2. Log dosyalarını ekleyin
3. Yeniden üretme adımlarını belirtin

---

## Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

"""
Dev-RPG Backend API Gateway
FastAPI application that aggregates data from MCPs and serves the frontend
"""
import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
import json

from fastapi import FastAPI, HTTPException, status, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import asyncpg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("dev_rpg_backend")

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev_rpg_user:dev_rpg_secret_2026@postgres:5432/dev_rpg")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")

# MCP Service URLs
MCP_SERVICES = {
    "lighthouse": os.getenv("LIGHTHOUSE_MCP_URL", "http://lighthouse_mcp:8000"),
    "code_quality": os.getenv("CODE_QUALITY_MCP_URL", "http://code_quality_mcp:8000"),
    "architect": os.getenv("ARCHITECT_MCP_URL", "http://architect_mcp:8000"),
    "event_loop": os.getenv("EVENT_LOOP_MCP_URL", "http://event_loop_mcp:8000"),
    "cost": os.getenv("COST_MCP_URL", "http://cost_mcp:8000"),
}

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None


# ===========================================
# Pydantic Models
# ===========================================
class HealthStatus(BaseModel):
    status: str
    service: str
    database: str
    ollama: str
    mcps: Dict[str, str]
    timestamp: str


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: Optional[str]
    xp_total: int
    level: int
    avatar_url: Optional[str]
    created_at: str


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    language: Optional[str] = None
    framework: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    repository_url: Optional[str]
    owner_id: Optional[str]
    language: Optional[str]
    framework: Optional[str]
    created_at: str


class AnalysisRequest(BaseModel):
    code: str = Field(..., description="Source code to analyze")
    language: Optional[str] = Field(None, description="Programming language")
    file_path: Optional[str] = Field(None, description="File path")
    commit_id: Optional[str] = Field(None, description="Git commit ID")
    project_id: Optional[str] = Field(None, description="Project ID")
    user_id: Optional[str] = Field(None, description="User ID")


class LighthouseRequest(BaseModel):
    url: str = Field(..., description="URL to analyze")
    categories: Optional[List[str]] = ["performance", "accessibility", "best-practices", "seo"]
    device: Optional[str] = "desktop"


class AnalysisReport(BaseModel):
    report_id: str
    overall_score: int
    status: str
    code_quality: Optional[Dict[str, Any]]
    architecture: Optional[Dict[str, Any]]
    event_loop: Optional[Dict[str, Any]]
    cost_analysis: Optional[Dict[str, Any]]
    rpg_summary: Optional[Dict[str, Any]]
    analyzed_at: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    display_name: Optional[str]
    xp_total: int
    level: int
    avatar_url: Optional[str]


class DashboardStats(BaseModel):
    total_analyses: int
    average_score: float
    xp_earned_today: int
    active_projects: int
    recent_badges: List[str]


class JenkinsWebhookPayload(BaseModel):
    """Payload from Jenkins webhook"""
    commit_id: str
    branch: str
    repository: str
    author: str
    message: Optional[str]
    files: Optional[List[Dict[str, Any]]]
    timestamp: Optional[str]


# ===========================================
# Lifespan Handler
# ===========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    global db_pool
    
    logger.info("Starting Dev-RPG Backend API...")
    
    # Initialize database connection pool
    try:
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info("Database connection pool created")
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        db_pool = None
    
    yield
    
    # Cleanup
    if db_pool:
        await db_pool.close()
        logger.info("Database connection pool closed")
    
    logger.info("Shutting down Dev-RPG Backend API...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Dev-RPG Backend API",
    description="Backend gateway for Dev-RPG CI/CD analysis platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================
# Utility Functions
# ===========================================
async def check_service_health(url: str) -> str:
    """Check if a service is healthy"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{url}/health")
            if response.status_code == 200:
                return "healthy"
            return "degraded"
    except Exception:
        return "unavailable"


async def call_mcp_service(service_name: str, endpoint: str, data: dict) -> dict:
    """Call an MCP service and return the response"""
    url = MCP_SERVICES.get(service_name)
    if not url:
        raise ValueError(f"Unknown MCP service: {service_name}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{url}{endpoint}", json=data)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        logger.error(f"Timeout calling {service_name}")
        raise HTTPException(status_code=504, detail=f"MCP service {service_name} timeout")
    except Exception as e:
        logger.error(f"Error calling {service_name}: {e}")
        raise HTTPException(status_code=503, detail=f"MCP service {service_name} unavailable")


def calculate_level(xp: int) -> int:
    """Calculate user level from XP"""
    # Level formula: Each level requires more XP
    level = 1
    xp_for_next = 100
    remaining_xp = xp
    
    while remaining_xp >= xp_for_next:
        remaining_xp -= xp_for_next
        level += 1
        xp_for_next = int(xp_for_next * 1.5)
    
    return level


# ===========================================
# Health Endpoints
# ===========================================
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Comprehensive health check"""
    # Check database
    db_status = "unavailable"
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("SELECT 1")
                db_status = "healthy"
        except Exception:
            db_status = "unavailable"
    
    # Check Ollama
    ollama_status = await check_service_health(OLLAMA_URL)
    
    # Check MCP services
    mcp_statuses = {}
    for name, url in MCP_SERVICES.items():
        mcp_statuses[name] = await check_service_health(url)
    
    # Overall status
    overall = "healthy"
    if db_status != "healthy":
        overall = "degraded"
    if all(s == "unavailable" for s in mcp_statuses.values()):
        overall = "critical"
    
    return HealthStatus(
        status=overall,
        service="dev_rpg_backend",
        database=db_status,
        ollama=ollama_status,
        mcps=mcp_statuses,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Dev-RPG Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# ===========================================
# User Endpoints
# ===========================================
@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create a new user"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        async with db_pool.acquire() as conn:
            # Hash password (in production, use proper hashing like bcrypt)
            password_hash = user.password  # TODO: Use bcrypt
            
            row = await conn.fetchrow(
                """
                INSERT INTO users (username, email, password_hash, display_name)
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, email, display_name, xp_total, level, avatar_url, created_at
                """,
                user.username, user.email, password_hash, user.display_name
            )
            
            return UserResponse(
                id=str(row['id']),
                username=row['username'],
                email=row['email'],
                display_name=row['display_name'],
                xp_total=row['xp_total'],
                level=row['level'],
                avatar_url=row['avatar_url'],
                created_at=row['created_at'].isoformat()
            )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=409, detail="Username or email already exists")


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, username, email, display_name, xp_total, level, avatar_url, created_at
            FROM users WHERE id = $1
            """,
            user_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=str(row['id']),
            username=row['username'],
            email=row['email'],
            display_name=row['display_name'],
            xp_total=row['xp_total'],
            level=row['level'],
            avatar_url=row['avatar_url'],
            created_at=row['created_at'].isoformat()
        )


@app.get("/api/users", response_model=List[UserResponse])
async def list_users(limit: int = Query(20, le=100), offset: int = 0):
    """List all users"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, username, email, display_name, xp_total, level, avatar_url, created_at
            FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2
            """,
            limit, offset
        )
        
        return [
            UserResponse(
                id=str(row['id']),
                username=row['username'],
                email=row['email'],
                display_name=row['display_name'],
                xp_total=row['xp_total'],
                level=row['level'],
                avatar_url=row['avatar_url'],
                created_at=row['created_at'].isoformat()
            )
            for row in rows
        ]


# ===========================================
# Project Endpoints
# ===========================================
@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, owner_id: Optional[str] = None):
    """Create a new project"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO projects (name, description, repository_url, owner_id, language, framework)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, description, repository_url, owner_id, language, framework, created_at
            """,
            project.name, project.description, project.repository_url,
            owner_id, project.language, project.framework
        )
        
        return ProjectResponse(
            id=str(row['id']),
            name=row['name'],
            description=row['description'],
            repository_url=row['repository_url'],
            owner_id=str(row['owner_id']) if row['owner_id'] else None,
            language=row['language'],
            framework=row['framework'],
            created_at=row['created_at'].isoformat()
        )


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(limit: int = Query(20, le=100), offset: int = 0):
    """List all projects"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, description, repository_url, owner_id, language, framework, created_at
            FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2
            """,
            limit, offset
        )
        
        return [
            ProjectResponse(
                id=str(row['id']),
                name=row['name'],
                description=row['description'],
                repository_url=row['repository_url'],
                owner_id=str(row['owner_id']) if row['owner_id'] else None,
                language=row['language'],
                framework=row['framework'],
                created_at=row['created_at'].isoformat()
            )
            for row in rows
        ]


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get project by ID"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, name, description, repository_url, owner_id, language, framework, created_at
            FROM projects WHERE id = $1
            """,
            project_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return ProjectResponse(
            id=str(row['id']),
            name=row['name'],
            description=row['description'],
            repository_url=row['repository_url'],
            owner_id=str(row['owner_id']) if row['owner_id'] else None,
            language=row['language'],
            framework=row['framework'],
            created_at=row['created_at'].isoformat()
        )


# ===========================================
# Analysis Endpoints
# ===========================================
@app.post("/api/analyze", response_model=AnalysisReport)
async def analyze_code(request: AnalysisRequest):
    """
    Run full code analysis through all MCPs
    """
    logger.info(f"Starting analysis for {request.file_path or 'unnamed file'}")
    
    analysis_data = {
        "code": request.code,
        "language": request.language,
        "file_path": request.file_path,
        "commit_id": request.commit_id
    }
    
    results = {}
    
    # Call MCPs in parallel using httpx
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Code Quality
        try:
            resp = await client.post(f"{MCP_SERVICES['code_quality']}/analyze", json=analysis_data)
            results['code_quality'] = resp.json() if resp.status_code == 200 else None
        except Exception as e:
            logger.error(f"Code quality analysis failed: {e}")
            results['code_quality'] = None
        
        # Architecture
        try:
            resp = await client.post(f"{MCP_SERVICES['architect']}/analyze", json=analysis_data)
            results['architecture'] = resp.json() if resp.status_code == 200 else None
        except Exception as e:
            logger.error(f"Architecture analysis failed: {e}")
            results['architecture'] = None
        
        # Event Loop
        try:
            resp = await client.post(f"{MCP_SERVICES['event_loop']}/analyze", json=analysis_data)
            results['event_loop'] = resp.json() if resp.status_code == 200 else None
        except Exception as e:
            logger.error(f"Event loop analysis failed: {e}")
            results['event_loop'] = None
        
        # Cost
        try:
            resp = await client.post(f"{MCP_SERVICES['cost']}/analyze", json=analysis_data)
            results['cost'] = resp.json() if resp.status_code == 200 else None
        except Exception as e:
            logger.error(f"Cost analysis failed: {e}")
            results['cost'] = None
    
    # Calculate overall score
    scores = []
    weights = {
        'code_quality': 0.3,
        'architecture': 0.25,
        'event_loop': 0.2,
        'cost': 0.25
    }
    
    if results['code_quality'] and 'score' in results['code_quality']:
        scores.append(('code_quality', results['code_quality']['score'], weights['code_quality']))
    if results['architecture'] and 'architecture_score' in results['architecture']:
        scores.append(('architecture', results['architecture']['architecture_score'], weights['architecture']))
    if results['event_loop'] and 'event_loop_score' in results['event_loop']:
        scores.append(('event_loop', results['event_loop']['event_loop_score'], weights['event_loop']))
    if results['cost'] and 'efficiency_score' in results['cost']:
        scores.append(('cost', results['cost']['efficiency_score'], weights['cost']))
    
    if scores:
        total_weight = sum(s[2] for s in scores)
        overall_score = int(sum(s[1] * s[2] for s in scores) / total_weight)
    else:
        overall_score = 0
    
    # Determine status
    if overall_score >= 85:
        status = "excellent"
    elif overall_score >= 70:
        status = "good"
    elif overall_score >= 50:
        status = "needs_improvement"
    else:
        status = "critical"
    
    # Calculate XP
    xp_earned = overall_score * 10
    
    # Determine badges
    badges = []
    if results['code_quality'] and results['code_quality'].get('score', 0) >= 90:
        badges.append("Clean Coder")
    if results['architecture'] and results['architecture'].get('architecture_score', 0) >= 90:
        badges.append("Architect Master")
    if results['event_loop'] and results['event_loop'].get('event_loop_score', 0) >= 90:
        badges.append("Async Ninja")
    if results['cost'] and results['cost'].get('efficiency_score', 0) >= 90:
        badges.append("Optimizer")
    if overall_score >= 95:
        badges.append("Code Legend")
    
    report_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Save to database
    if db_pool and request.project_id:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO analysis_reports (
                        report_id, project_id, commit_id, file_path,
                        overall_score, status,
                        code_quality_score, architecture_score, event_loop_score, efficiency_score,
                        code_quality_report, architecture_report, event_loop_report, cost_report,
                        xp_earned, badges_earned
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    """,
                    report_id, request.project_id, request.commit_id, request.file_path,
                    overall_score, status,
                    results['code_quality'].get('score') if results['code_quality'] else None,
                    results['architecture'].get('architecture_score') if results['architecture'] else None,
                    results['event_loop'].get('event_loop_score') if results['event_loop'] else None,
                    results['cost'].get('efficiency_score') if results['cost'] else None,
                    json.dumps(results['code_quality']) if results['code_quality'] else None,
                    json.dumps(results['architecture']) if results['architecture'] else None,
                    json.dumps(results['event_loop']) if results['event_loop'] else None,
                    json.dumps(results['cost']) if results['cost'] else None,
                    xp_earned, badges
                )
                
                # Update user XP if user_id provided
                if request.user_id:
                    await conn.execute(
                        """
                        UPDATE users 
                        SET xp_total = xp_total + $1,
                            level = $2
                        WHERE id = $3
                        """,
                        xp_earned, calculate_level(xp_earned), request.user_id
                    )
        except Exception as e:
            logger.error(f"Failed to save report to database: {e}")
    
    return AnalysisReport(
        report_id=report_id,
        overall_score=overall_score,
        status=status,
        code_quality=results['code_quality'],
        architecture=results['architecture'],
        event_loop=results['event_loop'],
        cost_analysis=results['cost'],
        rpg_summary={
            "xp_earned": xp_earned,
            "badges_earned": badges,
            "level_up": overall_score >= 90
        },
        analyzed_at=datetime.utcnow().isoformat()
    )


@app.post("/api/analyze/lighthouse")
async def analyze_lighthouse(request: LighthouseRequest):
    """Run Lighthouse analysis on a URL"""
    return await call_mcp_service("lighthouse", "/analyze", request.dict())


@app.get("/api/reports", response_model=List[AnalysisReport])
async def list_reports(
    project_id: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0
):
    """List analysis reports"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        if project_id:
            rows = await conn.fetch(
                """
                SELECT report_id, overall_score, status,
                       code_quality_report, architecture_report, event_loop_report, cost_report,
                       xp_earned, badges_earned, analyzed_at
                FROM analysis_reports
                WHERE project_id = $1
                ORDER BY analyzed_at DESC
                LIMIT $2 OFFSET $3
                """,
                project_id, limit, offset
            )
        else:
            rows = await conn.fetch(
                """
                SELECT report_id, overall_score, status,
                       code_quality_report, architecture_report, event_loop_report, cost_report,
                       xp_earned, badges_earned, analyzed_at
                FROM analysis_reports
                ORDER BY analyzed_at DESC
                LIMIT $1 OFFSET $2
                """,
                limit, offset
            )
        
        return [
            AnalysisReport(
                report_id=row['report_id'],
                overall_score=row['overall_score'],
                status=row['status'],
                code_quality=row['code_quality_report'],
                architecture=row['architecture_report'],
                event_loop=row['event_loop_report'],
                cost_analysis=row['cost_report'],
                rpg_summary={
                    "xp_earned": row['xp_earned'],
                    "badges_earned": row['badges_earned'] or [],
                    "level_up": row['overall_score'] >= 90
                },
                analyzed_at=row['analyzed_at'].isoformat()
            )
            for row in rows
        ]


@app.get("/api/reports/{report_id}", response_model=AnalysisReport)
async def get_report(report_id: str):
    """Get a specific analysis report"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT report_id, overall_score, status,
                   code_quality_report, architecture_report, event_loop_report, cost_report,
                   xp_earned, badges_earned, analyzed_at
            FROM analysis_reports
            WHERE report_id = $1
            """,
            report_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return AnalysisReport(
            report_id=row['report_id'],
            overall_score=row['overall_score'],
            status=row['status'],
            code_quality=row['code_quality_report'],
            architecture=row['architecture_report'],
            event_loop=row['event_loop_report'],
            cost_analysis=row['cost_report'],
            rpg_summary={
                "xp_earned": row['xp_earned'],
                "badges_earned": row['badges_earned'] or [],
                "level_up": row['overall_score'] >= 90
            },
            analyzed_at=row['analyzed_at'].isoformat()
        )


# Endpoint for n8n to store reports
@app.post("/api/reports")
async def store_report(report: Dict[str, Any] = Body(...)):
    """Store analysis report from n8n workflow"""
    logger.info(f"Storing report: {report.get('report_id', 'unknown')}")
    
    if not db_pool:
        logger.warning("Database unavailable, report not stored")
        return {"status": "warning", "message": "Database unavailable", "report": report}
    
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO analysis_reports (
                    report_id, overall_score, status,
                    code_quality_score, architecture_score, event_loop_score, efficiency_score,
                    code_quality_report, architecture_report, event_loop_report, cost_report,
                    xp_earned, badges_earned
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (report_id) DO UPDATE SET
                    overall_score = EXCLUDED.overall_score,
                    status = EXCLUDED.status,
                    code_quality_report = EXCLUDED.code_quality_report,
                    architecture_report = EXCLUDED.architecture_report,
                    event_loop_report = EXCLUDED.event_loop_report,
                    cost_report = EXCLUDED.cost_report
                """,
                report.get('report_id'),
                report.get('overall_score', 0),
                report.get('status', 'unknown'),
                report.get('code_quality', {}).get('score'),
                report.get('architecture', {}).get('score'),
                report.get('event_loop', {}).get('score'),
                report.get('cost_analysis', {}).get('score'),
                json.dumps(report.get('code_quality')),
                json.dumps(report.get('architecture')),
                json.dumps(report.get('event_loop')),
                json.dumps(report.get('cost_analysis')),
                report.get('rpg_summary', {}).get('xp_earned', 0),
                report.get('rpg_summary', {}).get('badges_earned', [])
            )
        
        return {"status": "success", "report_id": report.get('report_id')}
    except Exception as e:
        logger.error(f"Failed to store report: {e}")
        return {"status": "error", "message": str(e)}


# ===========================================
# Leaderboard & Dashboard Endpoints
# ===========================================
@app.get("/api/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = Query(10, le=100)):
    """Get XP leaderboard"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, username, display_name, xp_total, level, avatar_url,
                   ROW_NUMBER() OVER (ORDER BY xp_total DESC) as rank
            FROM users
            ORDER BY xp_total DESC
            LIMIT $1
            """,
            limit
        )
        
        return [
            LeaderboardEntry(
                rank=row['rank'],
                user_id=str(row['id']),
                username=row['username'],
                display_name=row['display_name'],
                xp_total=row['xp_total'],
                level=row['level'],
                avatar_url=row['avatar_url']
            )
            for row in rows
        ]


@app.get("/api/dashboard/{user_id}", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str):
    """Get dashboard statistics for a user"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    async with db_pool.acquire() as conn:
        # Get total analyses
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM analysis_reports WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1)",
            user_id
        )
        
        # Get average score
        avg = await conn.fetchval(
            """
            SELECT COALESCE(AVG(overall_score), 0)
            FROM analysis_reports
            WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1)
            """,
            user_id
        )
        
        # Get XP earned today
        xp_today = await conn.fetchval(
            """
            SELECT COALESCE(SUM(xp_earned), 0)
            FROM analysis_reports
            WHERE project_id IN (SELECT id FROM projects WHERE owner_id = $1)
            AND analyzed_at >= CURRENT_DATE
            """,
            user_id
        )
        
        # Get active projects count
        projects = await conn.fetchval(
            "SELECT COUNT(*) FROM projects WHERE owner_id = $1",
            user_id
        )
        
        # Get recent badges
        badges = await conn.fetch(
            """
            SELECT b.name FROM badges b
            JOIN user_badges ub ON ub.badge_id = b.id
            WHERE ub.user_id = $1
            ORDER BY ub.earned_at DESC
            LIMIT 5
            """,
            user_id
        )
        
        return DashboardStats(
            total_analyses=total or 0,
            average_score=float(avg or 0),
            xp_earned_today=xp_today or 0,
            active_projects=projects or 0,
            recent_badges=[b['name'] for b in badges]
        )


# ===========================================
# Jenkins Webhook Endpoint
# ===========================================
@app.post("/api/webhook/jenkins")
async def jenkins_webhook(payload: JenkinsWebhookPayload):
    """
    Receive webhook from Jenkins and trigger n8n workflow
    """
    logger.info(f"Received Jenkins webhook for commit: {payload.commit_id}")
    
    try:
        # Forward to n8n
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{N8N_WEBHOOK_URL}/webhook/analyze-code",
                json=payload.dict()
            )
            
            logger.info(f"n8n response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                return {"status": "success", "message": "Analysis triggered", "n8n_response": response.json()}
            else:
                logger.warning(f"n8n returned status {response.status_code}: {response.text}")
                return {"status": "warning", "message": f"n8n returned {response.status_code}", "details": response.text}
    
    except Exception as e:
        logger.error(f"Failed to trigger n8n workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger analysis: {e}")


# ===========================================
# MCP Service Direct Access Endpoints
# ===========================================
@app.get("/api/mcp/status")
async def get_mcp_status():
    """Get status of all MCP services"""
    statuses = {}
    for name, url in MCP_SERVICES.items():
        statuses[name] = {
            "url": url,
            "status": await check_service_health(url)
        }
    return statuses


@app.post("/api/mcp/{service_name}/analyze")
async def direct_mcp_analyze(service_name: str, data: Dict[str, Any] = Body(...)):
    """Direct access to specific MCP service"""
    if service_name not in MCP_SERVICES:
        raise HTTPException(status_code=404, detail=f"Unknown MCP service: {service_name}")
    
    return await call_mcp_service(service_name, "/analyze", data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3210)

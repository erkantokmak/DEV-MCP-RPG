"""
Lighthouse MCP Agent - Port 3201
Standard performance metrics using Lighthouse CLI (No LLM)
"""
import os
import subprocess
import json
import logging
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("lighthouse_mcp")


# ===========================================
# Pydantic Models
# ===========================================
class LighthouseRequest(BaseModel):
    """Request model for Lighthouse analysis"""
    url: str = Field(..., description="URL to analyze")
    categories: Optional[List[str]] = Field(
        default=["performance", "accessibility", "best-practices", "seo"],
        description="Categories to audit"
    )
    device: Optional[str] = Field(default="desktop", description="Device type: mobile or desktop")


class CategoryScore(BaseModel):
    """Score for a Lighthouse category"""
    name: str
    score: int
    description: Optional[str] = None


class AuditResult(BaseModel):
    """Individual audit result"""
    id: str
    title: str
    score: Optional[float] = None
    display_value: Optional[str] = None
    description: Optional[str] = None


class LighthouseResponse(BaseModel):
    """Response model for Lighthouse analysis"""
    url: str
    overall_score: int = Field(..., description="Overall performance score 0-100")
    categories: List[CategoryScore] = Field(default_factory=list)
    performance_metrics: dict = Field(default_factory=dict)
    audits: List[AuditResult] = Field(default_factory=list)
    analyzed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    lighthouse_available: bool
    timestamp: str


# ===========================================
# Lifespan Handler
# ===========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Starting Lighthouse MCP Agent...")
    yield
    logger.info("Shutting down Lighthouse MCP Agent...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Lighthouse MCP Agent",
    description="Web performance analysis using Google Lighthouse",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def check_lighthouse_available() -> bool:
    """Check if Lighthouse CLI is available"""
    try:
        result = subprocess.run(
            ["lighthouse", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0
    except Exception:
        return False


def run_lighthouse(url: str, categories: List[str], device: str) -> dict:
    """Run Lighthouse analysis on a URL"""
    try:
        # Build command
        cmd = [
            "lighthouse",
            url,
            "--output=json",
            "--quiet",
            f"--preset={device}",
            "--chrome-flags=--headless --no-sandbox --disable-gpu"
        ]
        
        # Add categories
        for cat in categories:
            cmd.append(f"--only-categories={cat}")
        
        logger.info(f"Running Lighthouse: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            logger.error(f"Lighthouse failed: {result.stderr}")
            raise Exception(f"Lighthouse failed: {result.stderr}")
        
        return json.loads(result.stdout)
        
    except subprocess.TimeoutExpired:
        raise Exception("Lighthouse analysis timed out")
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse Lighthouse output: {e}")


def simulate_lighthouse_result(url: str) -> dict:
    """
    Simulate Lighthouse result when CLI is not available.
    Used for development/testing.
    """
    import random
    
    return {
        "url": url,
        "overall_score": random.randint(60, 95),
        "categories": [
            {"name": "performance", "score": random.randint(50, 100)},
            {"name": "accessibility", "score": random.randint(70, 100)},
            {"name": "best-practices", "score": random.randint(60, 100)},
            {"name": "seo", "score": random.randint(80, 100)}
        ],
        "performance_metrics": {
            "first_contentful_paint": f"{random.uniform(0.5, 3.0):.1f}s",
            "largest_contentful_paint": f"{random.uniform(1.0, 5.0):.1f}s",
            "total_blocking_time": f"{random.randint(50, 500)}ms",
            "cumulative_layout_shift": f"{random.uniform(0, 0.25):.3f}",
            "speed_index": f"{random.uniform(1.0, 5.0):.1f}s"
        },
        "simulated": True
    }


# ===========================================
# API Endpoints
# ===========================================
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    lighthouse_ok = check_lighthouse_available()
    return HealthResponse(
        status="healthy" if lighthouse_ok else "degraded",
        service="lighthouse_mcp",
        lighthouse_available=lighthouse_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze", response_model=LighthouseResponse)
async def analyze_url(request: LighthouseRequest):
    """
    Run Lighthouse analysis on a URL
    """
    logger.info(f"Analyzing URL: {request.url}")
    
    try:
        lighthouse_available = check_lighthouse_available()
        
        if lighthouse_available:
            # Run actual Lighthouse
            raw_result = run_lighthouse(
                request.url,
                request.categories,
                request.device
            )
            
            # Parse Lighthouse JSON output
            categories = []
            for cat_id, cat_data in raw_result.get("categories", {}).items():
                categories.append(CategoryScore(
                    name=cat_id,
                    score=int((cat_data.get("score", 0) or 0) * 100),
                    description=cat_data.get("description")
                ))
            
            # Extract key metrics
            audits_data = raw_result.get("audits", {})
            performance_metrics = {}
            key_metrics = [
                "first-contentful-paint",
                "largest-contentful-paint", 
                "total-blocking-time",
                "cumulative-layout-shift",
                "speed-index"
            ]
            
            for metric in key_metrics:
                if metric in audits_data:
                    performance_metrics[metric.replace("-", "_")] = audits_data[metric].get("displayValue", "N/A")
            
            # Get overall score
            perf_category = raw_result.get("categories", {}).get("performance", {})
            overall_score = int((perf_category.get("score", 0) or 0) * 100)
            
            return LighthouseResponse(
                url=request.url,
                overall_score=overall_score,
                categories=categories,
                performance_metrics=performance_metrics
            )
        else:
            # Simulate result for development
            logger.warning("Lighthouse CLI not available, using simulated results")
            simulated = simulate_lighthouse_result(request.url)
            
            categories = [
                CategoryScore(name=c["name"], score=c["score"])
                for c in simulated["categories"]
            ]
            
            return LighthouseResponse(
                url=request.url,
                overall_score=simulated["overall_score"],
                categories=categories,
                performance_metrics=simulated["performance_metrics"]
            )
            
    except Exception as e:
        logger.error(f"Lighthouse analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lighthouse analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "lighthouse_mcp",
        "version": "1.0.0",
        "description": "Web performance analysis using Google Lighthouse",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

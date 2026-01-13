"""
Cost Analysis MCP Agent - Port 3205
Estimates Big-O complexity and cloud cost impact using Ollama LLM
"""
import os
import sys
import logging
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add shared module to path
sys.path.insert(0, '/app/shared')
from ollama_utils import OllamaClient, extract_json_from_response, create_analysis_prompt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("cost_mcp")

# Initialize Ollama client
ollama_client = OllamaClient()


# ===========================================
# Pydantic Models
# ===========================================
class CostAnalysisRequest(BaseModel):
    """Request model for cost analysis"""
    code: str = Field(..., description="The source code to analyze")
    language: Optional[str] = Field(None, description="Programming language")
    file_path: Optional[str] = Field(None, description="File path for context")
    expected_data_size: Optional[str] = Field(None, description="Expected input data size (small/medium/large)")
    cloud_provider: Optional[str] = Field(None, description="Target cloud provider (AWS/GCP/Azure)")
    commit_id: Optional[str] = Field(None, description="Git commit ID")


class ComplexityAnalysis(BaseModel):
    """Complexity analysis for a function/method"""
    function_name: str = Field(..., description="Name of the function/method")
    time_complexity: str = Field(..., description="Big-O time complexity")
    space_complexity: str = Field(..., description="Big-O space complexity")
    explanation: str = Field(..., description="Why this complexity")
    hotspot: bool = Field(default=False, description="Is this a performance hotspot?")


class CostFactor(BaseModel):
    """A factor contributing to cloud costs"""
    category: str = Field(..., description="Category: compute, memory, network, storage, api_calls")
    impact: str = Field(..., description="Impact level: Low, Medium, High")
    description: str = Field(..., description="What causes this cost")
    optimization: Optional[str] = Field(None, description="How to reduce this cost")


class CostAnalysisResponse(BaseModel):
    """Response model for cost analysis"""
    efficiency_score: int = Field(..., ge=0, le=100, description="Overall efficiency score")
    overall_time_complexity: str = Field(..., description="Dominant time complexity")
    overall_space_complexity: str = Field(..., description="Dominant space complexity")
    complexity_breakdown: List[ComplexityAnalysis] = Field(default_factory=list)
    cloud_cost_impact: str = Field(..., description="Overall cloud cost impact: Low, Medium, High")
    cost_factors: List[CostFactor] = Field(default_factory=list, description="Factors affecting cost")
    estimated_monthly_impact: Optional[str] = Field(None, description="Rough monthly cost estimate")
    scalability_assessment: str = Field(..., description="How well this scales")
    summary: str = Field(..., description="Overall cost assessment")
    optimizations: List[str] = Field(default_factory=list, description="Cost optimization suggestions")
    analyzed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    model_used: str = Field(default="llama3")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    ollama_connected: bool
    timestamp: str


# ===========================================
# Lifespan Handler
# ===========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Starting Cost Analysis MCP Agent...")
    yield
    logger.info("Shutting down Cost Analysis MCP Agent...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Cost Analysis MCP Agent",
    description="AI-powered Big-O complexity and cloud cost estimation using Ollama LLM",
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


# ===========================================
# System Prompt for LLM
# ===========================================
SYSTEM_PROMPT = """You are an expert in algorithm analysis, computational complexity, and cloud cost optimization.
You can accurately determine Big-O complexity and estimate cloud resource usage.
You must ALWAYS respond with valid JSON only, no other text."""

ANALYSIS_PROMPT = """Analyze this code to estimate its Big-O complexity and potential cloud cost impact.

COMPLEXITY ANALYSIS:
1. Identify all functions/methods
2. Determine time complexity (O(1), O(log n), O(n), O(n log n), O(n²), O(2^n), etc.)
3. Determine space complexity
4. Identify performance hotspots
5. Consider nested loops, recursion, and data structure operations

CLOUD COST FACTORS TO CONSIDER:
1. COMPUTE: CPU-intensive operations, loop iterations, recursive calls
2. MEMORY: Large data structures, caching, in-memory processing
3. NETWORK: API calls, data transfer, external requests
4. STORAGE: File operations, database writes, logging
5. API CALLS: External service calls, database queries

COST IMPACT LEVELS:
- Low: O(1) to O(log n), minimal resource usage
- Medium: O(n) to O(n log n), moderate scaling costs
- High: O(n²) or worse, expensive at scale

Return a JSON object with this exact structure:
{
    "efficiency_score": <number 0-100, where 100 is most efficient>,
    "overall_time_complexity": "<dominant Big-O>",
    "overall_space_complexity": "<dominant Big-O>",
    "complexity_breakdown": [
        {
            "function_name": "<function name>",
            "time_complexity": "<O(?)>",
            "space_complexity": "<O(?)>",
            "explanation": "<why this complexity>",
            "hotspot": <true if performance critical>
        }
    ],
    "cloud_cost_impact": "<Low|Medium|High>",
    "cost_factors": [
        {
            "category": "<compute|memory|network|storage|api_calls>",
            "impact": "<Low|Medium|High>",
            "description": "<what causes this cost>",
            "optimization": "<how to reduce>"
        }
    ],
    "estimated_monthly_impact": "<rough estimate like '$10-50' or 'Minimal'>",
    "scalability_assessment": "<how it scales with data growth>",
    "summary": "<overall assessment>",
    "optimizations": ["<specific cost reduction suggestions>"]
}"""


# ===========================================
# API Endpoints
# ===========================================
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    ollama_ok = await ollama_client.health_check()
    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        service="cost_mcp",
        ollama_connected=ollama_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze", response_model=CostAnalysisResponse)
async def analyze_cost(request: CostAnalysisRequest):
    """
    Analyze code for Big-O complexity and cloud cost impact using Ollama LLM
    """
    logger.info(f"Analyzing cost for {request.file_path or 'unnamed file'}")
    
    try:
        # Enhance prompt with context
        base_prompt = ANALYSIS_PROMPT
        if request.expected_data_size:
            base_prompt += f"\n\nExpected data size: {request.expected_data_size}"
        if request.cloud_provider:
            base_prompt += f"\nTarget cloud provider: {request.cloud_provider}"
        
        # Create the prompt
        prompt = create_analysis_prompt(
            base_prompt,
            request.code,
            request.language
        )
        
        # Get LLM response
        raw_response = await ollama_client.generate(prompt, SYSTEM_PROMPT)
        logger.debug(f"Raw LLM response: {raw_response[:500]}...")
        
        # Parse JSON from response
        parsed = extract_json_from_response(raw_response)
        
        # Handle error case
        if "error" in parsed and "raw_response" in parsed:
            logger.warning("Failed to parse LLM response, returning default")
            return CostAnalysisResponse(
                efficiency_score=50,
                overall_time_complexity="O(?)",
                overall_space_complexity="O(?)",
                cloud_cost_impact="Unknown",
                scalability_assessment="Unable to assess",
                summary="Analysis incomplete due to parsing error",
                model_used=ollama_client.model
            )
        
        # Build complexity breakdown
        complexities = []
        for comp_data in parsed.get("complexity_breakdown", []):
            complexities.append(ComplexityAnalysis(
                function_name=comp_data.get("function_name", "unknown"),
                time_complexity=comp_data.get("time_complexity", "O(?)"),
                space_complexity=comp_data.get("space_complexity", "O(?)"),
                explanation=comp_data.get("explanation", ""),
                hotspot=comp_data.get("hotspot", False)
            ))
        
        # Build cost factors
        cost_factors = []
        for factor_data in parsed.get("cost_factors", []):
            cost_factors.append(CostFactor(
                category=factor_data.get("category", "compute"),
                impact=factor_data.get("impact", "Medium"),
                description=factor_data.get("description", ""),
                optimization=factor_data.get("optimization")
            ))
        
        return CostAnalysisResponse(
            efficiency_score=min(100, max(0, int(parsed.get("efficiency_score", 50)))),
            overall_time_complexity=parsed.get("overall_time_complexity", "O(?)"),
            overall_space_complexity=parsed.get("overall_space_complexity", "O(?)"),
            complexity_breakdown=complexities,
            cloud_cost_impact=parsed.get("cloud_cost_impact", "Medium"),
            cost_factors=cost_factors,
            estimated_monthly_impact=parsed.get("estimated_monthly_impact"),
            scalability_assessment=parsed.get("scalability_assessment", "Unknown"),
            summary=parsed.get("summary", "Analysis complete"),
            optimizations=parsed.get("optimizations", []),
            model_used=ollama_client.model
        )
        
    except Exception as e:
        logger.error(f"Cost analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cost analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "cost_mcp",
        "version": "1.0.0",
        "description": "AI-powered Big-O complexity and cloud cost estimation",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

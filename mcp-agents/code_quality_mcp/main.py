"""
Code Quality MCP Agent - Port 3202
Analyzes code for clean code violations using Ollama LLM
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
logger = logging.getLogger("code_quality_mcp")

# Initialize Ollama client
ollama_client = OllamaClient()


# ===========================================
# Pydantic Models
# ===========================================
class CodeAnalysisRequest(BaseModel):
    """Request model for code analysis"""
    code: str = Field(..., description="The source code to analyze")
    language: Optional[str] = Field(None, description="Programming language (auto-detected if not provided)")
    file_path: Optional[str] = Field(None, description="Original file path for context")
    commit_id: Optional[str] = Field(None, description="Git commit ID for tracking")


class CodeIssue(BaseModel):
    """Individual code quality issue"""
    type: str = Field(..., description="Type of issue (naming, complexity, duplication, etc.)")
    severity: str = Field(..., description="Severity: low, medium, high, critical")
    line: Optional[int] = Field(None, description="Line number where issue occurs")
    message: str = Field(..., description="Description of the issue")
    suggestion: Optional[str] = Field(None, description="Suggested fix")


class CodeQualityResponse(BaseModel):
    """Response model for code quality analysis"""
    score: int = Field(..., ge=0, le=100, description="Overall code quality score (0-100)")
    issues: List[CodeIssue] = Field(default_factory=list, description="List of identified issues")
    summary: str = Field(..., description="Brief summary of code quality")
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
    logger.info("Starting Code Quality MCP Agent...")
    yield
    logger.info("Shutting down Code Quality MCP Agent...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Code Quality MCP Agent",
    description="AI-powered code quality analysis using Ollama LLM",
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
SYSTEM_PROMPT = """You are an expert code reviewer specializing in clean code principles. 
Your task is to analyze code and identify quality issues. 
You must ALWAYS respond with valid JSON only, no other text."""

ANALYSIS_PROMPT = """Analyze this code for clean code violations and quality issues.

Check for:
1. Naming conventions (variables, functions, classes)
2. Function/method length and complexity
3. Code duplication
4. Magic numbers/strings
5. Proper error handling
6. Comments and documentation
7. Single Responsibility Principle violations
8. Dead code or unused variables
9. Nested conditionals and loops
10. Proper encapsulation

Return a JSON object with this exact structure:
{
    "score": <number 0-100, where 100 is perfect>,
    "issues": [
        {
            "type": "<issue type>",
            "severity": "<low|medium|high|critical>",
            "line": <line number or null>,
            "message": "<description>",
            "suggestion": "<how to fix>"
        }
    ],
    "summary": "<brief overall assessment>"
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
        service="code_quality_mcp",
        ollama_connected=ollama_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze", response_model=CodeQualityResponse)
async def analyze_code(request: CodeAnalysisRequest):
    """
    Analyze code for quality issues using Ollama LLM
    """
    logger.info(f"Analyzing code quality for {request.file_path or 'unnamed file'}")
    
    try:
        # Create the prompt
        prompt = create_analysis_prompt(
            ANALYSIS_PROMPT,
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
            return CodeQualityResponse(
                score=50,
                issues=[CodeIssue(
                    type="analysis_error",
                    severity="medium",
                    message="Could not fully analyze code - LLM response parsing failed",
                    suggestion="Try again or manually review the code"
                )],
                summary="Analysis incomplete due to parsing error",
                model_used=ollama_client.model
            )
        
        # Build response from parsed JSON
        issues = []
        for issue_data in parsed.get("issues", []):
            issues.append(CodeIssue(
                type=issue_data.get("type", "unknown"),
                severity=issue_data.get("severity", "medium"),
                line=issue_data.get("line"),
                message=issue_data.get("message", "No description"),
                suggestion=issue_data.get("suggestion")
            ))
        
        return CodeQualityResponse(
            score=min(100, max(0, int(parsed.get("score", 50)))),
            issues=issues,
            summary=parsed.get("summary", "Analysis complete"),
            model_used=ollama_client.model
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "code_quality_mcp",
        "version": "1.0.0",
        "description": "AI-powered code quality analysis",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

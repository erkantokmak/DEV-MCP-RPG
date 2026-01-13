"""
Architect MCP Agent - Port 3203
Analyzes code architecture, imports, and detects structural issues using Ollama LLM
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
logger = logging.getLogger("architect_mcp")

# Initialize Ollama client
ollama_client = OllamaClient()


# ===========================================
# Pydantic Models
# ===========================================
class ArchitectureAnalysisRequest(BaseModel):
    """Request model for architecture analysis"""
    code: str = Field(..., description="The source code to analyze")
    language: Optional[str] = Field(None, description="Programming language")
    file_path: Optional[str] = Field(None, description="File path for context")
    project_structure: Optional[str] = Field(None, description="Project file structure for better analysis")
    commit_id: Optional[str] = Field(None, description="Git commit ID")


class DependencyIssue(BaseModel):
    """Dependency or import issue"""
    type: str = Field(..., description="Type: circular_dependency, layer_violation, unused_import, etc.")
    severity: str = Field(..., description="Severity: low, medium, high, critical")
    source: str = Field(..., description="Source module/file")
    target: Optional[str] = Field(None, description="Target module/file (for dependencies)")
    message: str = Field(..., description="Description of the issue")
    suggestion: Optional[str] = Field(None, description="How to resolve")


class LayerInfo(BaseModel):
    """Information about architectural layers"""
    name: str = Field(..., description="Layer name (presentation, business, data, etc.)")
    imports: List[str] = Field(default_factory=list, description="Modules imported in this layer")


class ArchitectureAnalysisResponse(BaseModel):
    """Response model for architecture analysis"""
    architecture_score: int = Field(..., ge=0, le=100, description="Architecture quality score")
    detected_layers: List[LayerInfo] = Field(default_factory=list, description="Detected architectural layers")
    dependency_issues: List[DependencyIssue] = Field(default_factory=list, description="Dependency problems found")
    circular_dependencies: List[str] = Field(default_factory=list, description="Circular dependency chains")
    layer_violations: List[str] = Field(default_factory=list, description="Layer boundary violations")
    summary: str = Field(..., description="Overall architecture assessment")
    recommendations: List[str] = Field(default_factory=list, description="Improvement recommendations")
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
    logger.info("Starting Architect MCP Agent...")
    yield
    logger.info("Shutting down Architect MCP Agent...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Architect MCP Agent",
    description="AI-powered architecture and dependency analysis using Ollama LLM",
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
SYSTEM_PROMPT = """You are an expert software architect specializing in clean architecture, 
SOLID principles, and dependency management. Analyze code structure and identify architectural issues.
You must ALWAYS respond with valid JSON only, no other text."""

ANALYSIS_PROMPT = """Analyze this code's architecture, imports, and structure. 
Identify circular dependencies, layer violations, and architectural anti-patterns.

Check for:
1. Circular dependencies between modules
2. Layer violations (e.g., data layer importing from presentation)
3. Improper dependency direction (dependencies should point inward)
4. Missing abstractions or interfaces
5. God classes/modules with too many responsibilities
6. Tight coupling between components
7. Unused or unnecessary imports
8. Import organization and grouping

Common layers to identify:
- Presentation (UI, Controllers, Views)
- Application/Service (Use Cases, Business Logic)
- Domain (Entities, Value Objects)
- Infrastructure (Database, External Services, I/O)

Return a JSON object with this exact structure:
{
    "architecture_score": <number 0-100>,
    "detected_layers": [
        {
            "name": "<layer name>",
            "imports": ["<imported modules>"]
        }
    ],
    "dependency_issues": [
        {
            "type": "<circular_dependency|layer_violation|unused_import|tight_coupling>",
            "severity": "<low|medium|high|critical>",
            "source": "<source module>",
            "target": "<target module or null>",
            "message": "<description>",
            "suggestion": "<how to fix>"
        }
    ],
    "circular_dependencies": ["<A -> B -> C -> A>"],
    "layer_violations": ["<description of violation>"],
    "summary": "<overall assessment>",
    "recommendations": ["<improvement suggestions>"]
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
        service="architect_mcp",
        ollama_connected=ollama_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze", response_model=ArchitectureAnalysisResponse)
async def analyze_architecture(request: ArchitectureAnalysisRequest):
    """
    Analyze code architecture and dependencies using Ollama LLM
    """
    logger.info(f"Analyzing architecture for {request.file_path or 'unnamed file'}")
    
    try:
        # Enhance prompt with project structure if available
        base_prompt = ANALYSIS_PROMPT
        if request.project_structure:
            base_prompt += f"\n\nProject structure:\n{request.project_structure}"
        
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
            return ArchitectureAnalysisResponse(
                architecture_score=50,
                dependency_issues=[DependencyIssue(
                    type="analysis_error",
                    severity="medium",
                    source="unknown",
                    message="Could not fully analyze architecture - LLM response parsing failed",
                    suggestion="Try again or manually review"
                )],
                summary="Analysis incomplete due to parsing error",
                model_used=ollama_client.model
            )
        
        # Build detected layers
        layers = []
        for layer_data in parsed.get("detected_layers", []):
            layers.append(LayerInfo(
                name=layer_data.get("name", "unknown"),
                imports=layer_data.get("imports", [])
            ))
        
        # Build dependency issues
        issues = []
        for issue_data in parsed.get("dependency_issues", []):
            issues.append(DependencyIssue(
                type=issue_data.get("type", "unknown"),
                severity=issue_data.get("severity", "medium"),
                source=issue_data.get("source", "unknown"),
                target=issue_data.get("target"),
                message=issue_data.get("message", "No description"),
                suggestion=issue_data.get("suggestion")
            ))
        
        return ArchitectureAnalysisResponse(
            architecture_score=min(100, max(0, int(parsed.get("architecture_score", 50)))),
            detected_layers=layers,
            dependency_issues=issues,
            circular_dependencies=parsed.get("circular_dependencies", []),
            layer_violations=parsed.get("layer_violations", []),
            summary=parsed.get("summary", "Analysis complete"),
            recommendations=parsed.get("recommendations", []),
            model_used=ollama_client.model
        )
        
    except Exception as e:
        logger.error(f"Architecture analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Architecture analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "architect_mcp",
        "version": "1.0.0",
        "description": "AI-powered architecture and dependency analysis",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

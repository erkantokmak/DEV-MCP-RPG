"""
Event Loop MCP Agent - Port 3204
Identifies blocking operations that would freeze the event loop using Ollama LLM
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
logger = logging.getLogger("event_loop_mcp")

# Initialize Ollama client
ollama_client = OllamaClient()


# ===========================================
# Pydantic Models
# ===========================================
class EventLoopAnalysisRequest(BaseModel):
    """Request model for event loop analysis"""
    code: str = Field(..., description="The source code to analyze")
    language: Optional[str] = Field(None, description="Programming language (Node.js, Python, etc.)")
    file_path: Optional[str] = Field(None, description="File path for context")
    runtime: Optional[str] = Field(None, description="Runtime environment (node, asyncio, etc.)")
    commit_id: Optional[str] = Field(None, description="Git commit ID")


class BlockingOperation(BaseModel):
    """A blocking operation that could freeze the event loop"""
    type: str = Field(..., description="Type: sync_io, cpu_bound, blocking_call, etc.")
    severity: str = Field(..., description="Impact: low, medium, high, critical")
    line: Optional[int] = Field(None, description="Line number")
    operation: str = Field(..., description="The blocking operation identified")
    blocking_time_estimate: Optional[str] = Field(None, description="Estimated blocking time")
    message: str = Field(..., description="Explanation of why this blocks")
    async_alternative: Optional[str] = Field(None, description="Async/non-blocking alternative")


class EventLoopAnalysisResponse(BaseModel):
    """Response model for event loop analysis"""
    event_loop_score: int = Field(..., ge=0, le=100, description="Event loop health score")
    blocking_operations: List[BlockingOperation] = Field(default_factory=list)
    total_blocking_calls: int = Field(default=0, description="Total number of blocking calls found")
    estimated_freeze_risk: str = Field(..., description="Overall freeze risk: none, low, medium, high, critical")
    async_patterns_used: List[str] = Field(default_factory=list, description="Async patterns detected")
    summary: str = Field(..., description="Overall assessment")
    recommendations: List[str] = Field(default_factory=list, description="Improvement suggestions")
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
    logger.info("Starting Event Loop MCP Agent...")
    yield
    logger.info("Shutting down Event Loop MCP Agent...")


# ===========================================
# FastAPI Application
# ===========================================
app = FastAPI(
    title="Event Loop MCP Agent",
    description="AI-powered event loop blocking detection using Ollama LLM",
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
SYSTEM_PROMPT = """You are an expert in asynchronous programming, event loops, and non-blocking I/O.
You specialize in Node.js and Python async patterns. Identify operations that block the event loop.
You must ALWAYS respond with valid JSON only, no other text."""

ANALYSIS_PROMPT = """Identify blocking operations in this Node.js or Python code that would freeze the event loop.

BLOCKING OPERATIONS TO DETECT:

For Node.js:
- fs.readFileSync, fs.writeFileSync (sync file operations)
- crypto.pbkdf2Sync, crypto.randomBytesSync (sync crypto)
- child_process.execSync, spawnSync
- Long-running CPU computations (loops, heavy calculations)
- Blocking database queries without await
- JSON.parse/stringify on large objects
- Regular expressions with catastrophic backtracking

For Python (asyncio):
- time.sleep() instead of asyncio.sleep()
- requests library instead of aiohttp/httpx
- open() file operations in async context
- subprocess.run() without asyncio.subprocess
- Heavy CPU operations without run_in_executor
- Blocking I/O in async functions
- socket operations without async

Return a JSON object with this exact structure:
{
    "event_loop_score": <number 0-100, where 100 means no blocking>,
    "blocking_operations": [
        {
            "type": "<sync_io|cpu_bound|blocking_call|regex_backtrack|sync_crypto>",
            "severity": "<low|medium|high|critical>",
            "line": <line number or null>,
            "operation": "<the blocking code/function>",
            "blocking_time_estimate": "<estimated ms or time range>",
            "message": "<why this blocks the event loop>",
            "async_alternative": "<non-blocking alternative>"
        }
    ],
    "total_blocking_calls": <count>,
    "estimated_freeze_risk": "<none|low|medium|high|critical>",
    "async_patterns_used": ["<detected async patterns like Promises, async/await, callbacks>"],
    "summary": "<overall assessment>",
    "recommendations": ["<specific improvements>"]
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
        service="event_loop_mcp",
        ollama_connected=ollama_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze", response_model=EventLoopAnalysisResponse)
async def analyze_event_loop(request: EventLoopAnalysisRequest):
    """
    Analyze code for event loop blocking operations using Ollama LLM
    """
    logger.info(f"Analyzing event loop for {request.file_path or 'unnamed file'}")
    
    try:
        # Enhance prompt with runtime context
        base_prompt = ANALYSIS_PROMPT
        if request.runtime:
            base_prompt += f"\n\nTarget runtime: {request.runtime}"
        
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
            return EventLoopAnalysisResponse(
                event_loop_score=50,
                blocking_operations=[BlockingOperation(
                    type="analysis_error",
                    severity="medium",
                    operation="unknown",
                    message="Could not fully analyze - LLM response parsing failed",
                    async_alternative="Try again or manually review"
                )],
                total_blocking_calls=0,
                estimated_freeze_risk="unknown",
                summary="Analysis incomplete due to parsing error",
                model_used=ollama_client.model
            )
        
        # Build blocking operations list
        operations = []
        for op_data in parsed.get("blocking_operations", []):
            operations.append(BlockingOperation(
                type=op_data.get("type", "unknown"),
                severity=op_data.get("severity", "medium"),
                line=op_data.get("line"),
                operation=op_data.get("operation", "unknown"),
                blocking_time_estimate=op_data.get("blocking_time_estimate"),
                message=op_data.get("message", "Blocking operation detected"),
                async_alternative=op_data.get("async_alternative")
            ))
        
        return EventLoopAnalysisResponse(
            event_loop_score=min(100, max(0, int(parsed.get("event_loop_score", 50)))),
            blocking_operations=operations,
            total_blocking_calls=parsed.get("total_blocking_calls", len(operations)),
            estimated_freeze_risk=parsed.get("estimated_freeze_risk", "unknown"),
            async_patterns_used=parsed.get("async_patterns_used", []),
            summary=parsed.get("summary", "Analysis complete"),
            recommendations=parsed.get("recommendations", []),
            model_used=ollama_client.model
        )
        
    except Exception as e:
        logger.error(f"Event loop analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Event loop analysis failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "event_loop_mcp",
        "version": "1.0.0",
        "description": "AI-powered event loop blocking detection",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

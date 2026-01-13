"""
Shared utilities for MCP Agents - Ollama Integration
"""
import os
import json
import re
import httpx
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class OllamaClient:
    """Client for communicating with Ollama API"""
    
    def __init__(self, base_url: str = OLLAMA_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model
        self.generate_endpoint = f"{base_url}/api/generate"
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Send a prompt to Ollama and get the response"""
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temperature for consistent JSON output
                "num_predict": 2048
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Sending request to Ollama: {self.generate_endpoint}")
            response = await client.post(self.generate_endpoint, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    
    async def health_check(self) -> bool:
        """Check if Ollama is available"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False


def extract_json_from_response(response: str) -> Dict[str, Any]:
    """
    Extract JSON from LLM response, handling various formats.
    The LLM might return JSON wrapped in markdown code blocks or with extra text.
    """
    # Try to find JSON in code blocks first
    json_patterns = [
        r'```json\s*([\s\S]*?)\s*```',  # ```json ... ```
        r'```\s*([\s\S]*?)\s*```',        # ``` ... ```
        r'\{[\s\S]*\}',                    # Raw JSON object
        r'\[[\s\S]*\]'                     # Raw JSON array
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, response, re.MULTILINE)
        for match in matches:
            try:
                # Clean up the match
                cleaned = match.strip()
                parsed = json.loads(cleaned)
                return parsed
            except json.JSONDecodeError:
                continue
    
    # If no valid JSON found, try parsing the entire response
    try:
        return json.loads(response.strip())
    except json.JSONDecodeError:
        logger.warning(f"Could not extract JSON from response: {response[:200]}...")
        return {"error": "Failed to parse LLM response", "raw_response": response[:500]}


def create_analysis_prompt(base_prompt: str, code: str, language: Optional[str] = None) -> str:
    """Create a structured prompt for code analysis"""
    
    lang_hint = f" (Language: {language})" if language else ""
    
    return f"""{base_prompt}

IMPORTANT: You MUST respond with ONLY valid JSON. No explanations, no markdown formatting outside the JSON, just pure JSON.

Code to analyze{lang_hint}:
```
{code}
```

Respond with valid JSON only:"""

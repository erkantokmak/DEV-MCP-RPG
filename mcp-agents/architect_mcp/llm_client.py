"""
Shared LLM Client for MCP Agents
Supports Groq API (default) and Ollama (fallback)
"""
import os
import json
import re
import httpx
from typing import Optional, Dict, Any, List
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

# Configuration - Groq is default, Ollama is fallback
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # "groq" or "ollama"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")  # Fast and free

# Ollama fallback config
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class LLMClient:
    """
    Unified LLM Client supporting both Groq API and Ollama
    Groq is used by default (cloud, fast, free tier available)
    Ollama can be used as fallback for local deployment
    """
    
    def __init__(
        self,
        provider: str = LLM_PROVIDER,
        groq_api_key: str = GROQ_API_KEY,
        groq_model: str = GROQ_MODEL,
        ollama_url: str = OLLAMA_URL,
        ollama_model: str = OLLAMA_MODEL
    ):
        self.provider = provider.lower()
        self.groq_api_key = groq_api_key
        self.groq_model = groq_model
        self.ollama_url = ollama_url
        self.ollama_model = ollama_model
        
        # Validate configuration
        if self.provider == "groq" and not self.groq_api_key:
            logger.warning("Groq API key not set, falling back to Ollama")
            self.provider = "ollama"
        
        logger.info(f"LLM Client initialized with provider: {self.provider}")
    
    @property
    def model(self) -> str:
        """Returns the currently active model name"""
        return self.groq_model if self.provider == "groq" else self.ollama_model
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate response from LLM
        Automatically routes to Groq or Ollama based on configuration
        """
        if self.provider == "groq":
            return await self._generate_groq(prompt, system_prompt)
        else:
            return await self._generate_ollama(prompt, system_prompt)
    
    async def _generate_groq(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Send request to Groq API"""
        messages: List[Dict[str, str]] = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.groq_model,
            "messages": messages,
            "temperature": 0.1,  # Low temperature for consistent JSON output
            "max_tokens": 4096,
            "top_p": 1,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"Sending request to Groq API with model: {self.groq_model}")
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            # Extract content from Groq response
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            
            logger.error(f"Unexpected Groq response format: {result}")
            return ""
    
    async def _generate_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Send request to Ollama API (fallback)"""
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 2048
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Sending request to Ollama: {self.ollama_url}/api/generate")
            response = await client.post(f"{self.ollama_url}/api/generate", json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    
    async def health_check(self) -> bool:
        """Check if LLM service is available"""
        try:
            if self.provider == "groq":
                # Simple check - try to get models list
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        "https://api.groq.com/openai/v1/models",
                        headers=headers
                    )
                    return response.status_code == 200
            else:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(f"{self.ollama_url}/api/tags")
                    return response.status_code == 200
        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, str]:
        """Get current model information"""
        return {
            "provider": self.provider,
            "model": self.groq_model if self.provider == "groq" else self.ollama_model
        }


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

{code}

Remember: Output ONLY valid JSON, nothing else."""


# Backwards compatibility - keep OllamaClient as alias
class OllamaClient(LLMClient):
    """Backwards compatible alias for LLMClient"""
    def __init__(self, base_url: str = OLLAMA_URL, model: str = OLLAMA_MODEL):
        # Check if Groq is configured, use it by default
        if GROQ_API_KEY:
            super().__init__(provider="groq")
        else:
            super().__init__(provider="ollama", ollama_url=base_url, ollama_model=model)
"""
Shared utilities for MCP Agents - LLM Integration (Groq/Ollama)
Re-exports from shared llm_client for backwards compatibility
"""
# Re-export everything from the shared llm_client
from llm_client import (
    LLMClient,
    OllamaClient,
    extract_json_from_response,
    create_analysis_prompt,
    LLM_PROVIDER,
    GROQ_API_KEY,
    GROQ_MODEL,
    OLLAMA_URL,
    OLLAMA_MODEL
)

"""Data models for the agent core runtime."""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class ModelInfo(BaseModel):
    modelId: str
    region: str = "us-east-1"


class StreamingRequest(BaseModel):
    messages: List[Dict[str, Any]]
    system_prompt: Optional[str] = None
    prompt: str = ""
    model: Dict[str, Any] = {}


class UnrecordedMessage(BaseModel):
    role: str
    content: List[Dict[str, Any]]


class AgentCoreResponse(BaseModel):
    message: Dict[str, Any]
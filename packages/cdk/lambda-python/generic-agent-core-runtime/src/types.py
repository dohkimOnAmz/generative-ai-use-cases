"""Data models for the agent core runtime."""

from strands.types.content import Message
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class ModelInfo(BaseModel):
    modelId: str
    region: str = "us-east-1"


class AgentCoreRequest(BaseModel):
    messages: List[Message] = []
    system_prompt: Optional[str] = None
    prompt: str = ""
    model: ModelInfo = {}

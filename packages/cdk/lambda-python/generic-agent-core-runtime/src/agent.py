"""Agent management for the agent core runtime."""

import boto3
import logging
from strands.models import BedrockModel
from strands import Agent as StrandsAgent
from typing import List, Dict, Any, Optional, AsyncGenerator
from .config import get_system_prompt, extract_model_info
from .tools import ToolManager
from .utils import create_empty_response, create_error_response

logger = logging.getLogger(__name__)


class AgentManager:
    """Manages Strands agent creation and execution."""
    
    def __init__(self):
        self.tool_manager = ToolManager()
    
    def set_session_info(self, session_id: str, trace_id: str):
        """Set session and trace IDs"""
        self.tool_manager.set_session_info(session_id, trace_id)
    
    async def process_request(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str],
        prompt: str,
        model_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process a request and return the response"""
        try:
            # Get model info
            model_id, region = extract_model_info(model_info)
            
            # Combine system prompts
            combined_system_prompt = get_system_prompt(system_prompt)
            
            logger.info(f"Using model: {model_id} in region: {region}")
            logger.info(f"User prompt: {prompt[:100]}...")
            logger.info(f"History messages count: {len(messages)}")
            
            # Get all tools
            tools = self.tool_manager.get_all_tools()
            
            # Create boto3 session
            session = boto3.Session(region_name=region)
            
            # Create Bedrock model
            bedrock_model = BedrockModel(model_id=model_id, boto_session=session)
            
            # Create Strands agent with history messages
            agent = StrandsAgent(
                system_prompt=combined_system_prompt,
                messages=messages,
                model=bedrock_model,
                tools=tools,
            )
            
            # Generate response using the user prompt
            logger.info("Starting response generation")
            final_message = None
            
            # Stream the response with the user prompt
            async for event in agent.stream_async(prompt):
                if "message" in event and event["message"].get("role") == "assistant":
                    final_message = event
            
            # Return the final message in Strands format
            if final_message:
                logger.info("Successfully generated response")
                return final_message
            else:
                logger.warning("No response generated")
                return create_empty_response()
                
        except Exception as e:
            logger.error(f"Error processing agent request: {e}")
            return create_error_response(str(e))
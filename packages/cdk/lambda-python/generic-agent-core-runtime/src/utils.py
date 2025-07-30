"""Utility functions for the agent core runtime."""

import os
import shutil
import pathlib
import logging
from uuid import uuid4
from .config import WORKSPACE_DIR

logger = logging.getLogger(__name__)


def create_id() -> str:
    """Generate a unique session ID"""
    return str(uuid4())


def create_ws_directory():
    """Create workspace directory if it doesn't exist"""
    logger.info("Create ws directory")
    pathlib.Path(WORKSPACE_DIR).mkdir(exist_ok=True)


def clean_ws_directory():
    """Clean up workspace directory"""
    logger.info("Clean ws directory...")
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)


def create_error_response(error_message: str) -> dict:
    """Create a standardized error response"""
    return {
        "message": {
            "role": "assistant",
            "content": [
                {
                    "text": f"An error occurred while processing your request: {error_message}",
                }
            ],
        }
    }


def create_empty_response() -> dict:
    """Create a response for when no message is generated"""
    return {
        "message": {
            "role": "assistant",
            "content": [
                {
                    "text": "I apologize, but I couldn't generate a response. Please try again.",
                }
            ],
        }
    }
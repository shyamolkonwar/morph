"""
AI Providers Package
Unified access to AI models via OpenRouter
"""

from .openrouter import (
    OpenRouterProvider,
    OpenRouterConfig,
    ChatMessage,
    ChatResponse,
    get_openrouter_provider,
    quick_chat,
)

__all__ = [
    "OpenRouterProvider",
    "OpenRouterConfig",
    "ChatMessage",
    "ChatResponse",
    "get_openrouter_provider",
    "quick_chat",
]

"""
OpenRouter Provider
Unified API for accessing Claude, GPT-4, and other models via OpenRouter
"""

import httpx
from dataclasses import dataclass
from typing import Optional, AsyncIterator
import json
import os


@dataclass
class OpenRouterConfig:
    """Configuration for OpenRouter API"""
    api_key: Optional[str] = None
    base_url: str = "https://openrouter.ai/api/v1"
    
    # Model aliases
    architect_model: str = "anthropic/claude-sonnet-4"  # Primary reasoning
    vision_model: str = "openai/gpt-4o"  # Vision tasks
    verifier_model: str = "anthropic/claude-3-haiku"  # Fast verification
    
    # Generation settings
    temperature: float = 0.2  # Low for deterministic output
    max_tokens: int = 4096
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv("OPENROUTER_API_KEY")


@dataclass
class ChatMessage:
    """A chat message"""
    role: str  # "user", "assistant", "system"
    content: str | list[dict]  # Text or multimodal content


@dataclass
class ChatResponse:
    """Response from OpenRouter"""
    content: str
    model: str
    usage: dict
    finish_reason: str


class OpenRouterProvider:
    """
    Unified provider for AI models via OpenRouter.
    
    Supports:
    - Text generation (Claude, GPT-4)
    - Vision analysis (GPT-4o, Claude with vision)
    - Streaming responses
    """
    
    def __init__(self, config: Optional[OpenRouterConfig] = None):
        self.config = config or OpenRouterConfig()
        
        if not self.config.api_key:
            raise ValueError(
                "OpenRouter API key required. Set OPENROUTER_API_KEY env var."
            )
        
        self.headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://morph.ai",  # For OpenRouter analytics
            "X-Title": "MorphV2 Banner Generator",
        }
    
    async def chat(
        self,
        messages: list[ChatMessage],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        force_json: bool = False,
    ) -> ChatResponse:
        """
        Send a chat completion request.
        
        Args:
            messages: List of chat messages
            model: Model to use (defaults to architect_model)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            force_json: Force JSON output format
            
        Returns:
            ChatResponse with generated content
        """
        model = model or self.config.architect_model
        temperature = temperature if temperature is not None else self.config.temperature
        max_tokens = max_tokens or self.config.max_tokens
        
        payload = {
            "model": model,
            "messages": [
                {"role": m.role, "content": m.content}
                for m in messages
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if force_json:
            payload["response_format"] = {"type": "json_object"}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.config.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        choice = data["choices"][0]
        return ChatResponse(
            content=choice["message"]["content"],
            model=data.get("model", model),
            usage=data.get("usage", {}),
            finish_reason=choice.get("finish_reason", "stop"),
        )
    
    async def chat_stream(
        self,
        messages: list[ChatMessage],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> AsyncIterator[str]:
        """
        Stream a chat completion response.
        
        Args:
            messages: List of chat messages
            model: Model to use
            temperature: Sampling temperature
            
        Yields:
            Content chunks as they arrive
        """
        model = model or self.config.architect_model
        temperature = temperature if temperature is not None else self.config.temperature
        
        payload = {
            "model": model,
            "messages": [
                {"role": m.role, "content": m.content}
                for m in messages
            ],
            "temperature": temperature,
            "stream": True,
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.config.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            data = json.loads(data_str)
                            content = data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
    
    async def vision_analyze(
        self,
        image_base64: str,
        prompt: str,
        detail: str = "high",
    ) -> str:
        """
        Analyze an image using vision model.
        
        Args:
            image_base64: Base64-encoded image
            prompt: Text prompt describing the task
            detail: "low" or "high" for image detail level
            
        Returns:
            Model's analysis as text
        """
        messages = [
            ChatMessage(
                role="user",
                content=[
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}",
                            "detail": detail,
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    }
                ]
            )
        ]
        
        response = await self.chat(
            messages=messages,
            model=self.config.vision_model,
            temperature=0.2,
        )
        
        return response.content
    
    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
    ) -> dict:
        """
        Generate structured JSON output.
        
        Args:
            system_prompt: System instructions
            user_prompt: User request
            model: Model to use
            
        Returns:
            Parsed JSON dict
        """
        messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_prompt),
        ]
        
        response = await self.chat(
            messages=messages,
            model=model,
            force_json=True,
        )
        
        # Parse JSON from response
        import re
        content = response.content
        
        # Extract JSON from potential markdown code block
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        
        return json.loads(content)


# Singleton instance
_provider: Optional[OpenRouterProvider] = None


def get_openrouter_provider() -> OpenRouterProvider:
    """Get singleton OpenRouter provider"""
    global _provider
    if _provider is None:
        _provider = OpenRouterProvider()
    return _provider


async def quick_chat(
    prompt: str,
    system: Optional[str] = None,
    model: Optional[str] = None,
) -> str:
    """Quick convenience function for simple chat"""
    provider = get_openrouter_provider()
    messages = []
    
    if system:
        messages.append(ChatMessage(role="system", content=system))
    messages.append(ChatMessage(role="user", content=prompt))
    
    response = await provider.chat(messages, model=model)
    return response.content

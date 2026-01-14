"""
Base Agent
Abstract base class for all orchestrator agents
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Any


@dataclass
class AgentConfig:
    """Configuration for an agent"""
    canvas_width: int = 1200
    canvas_height: int = 630
    brand_colors: list[str] = None
    
    def __post_init__(self):
        if self.brand_colors is None:
            self.brand_colors = ["#FF6B35", "#FFFFFF", "#004E89"]


class BaseAgent(ABC):
    """
    Abstract base class for orchestrator agents.
    
    All agents follow the same interface:
    - configure(): Set up the agent
    - generate(): Produce output
    - handle_feedback(): Process feedback from downstream agents
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
    ):
        self.config = AgentConfig(
            canvas_width=canvas_width,
            canvas_height=canvas_height,
            brand_colors=brand_colors,
        )
        self.name: str = "base"
        self.role: str = "Base Agent"
    
    @abstractmethod
    async def generate(self, **kwargs) -> Any:
        """Generate output for this agent"""
        pass
    
    def handle_feedback(self, feedback: str) -> str:
        """
        Process feedback from a downstream agent.
        
        Default implementation just returns the feedback.
        Override for custom handling.
        """
        return feedback
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        return f"You are the {self.role}."

"""
Model Orchestrator
Coordinates the bi-modal intelligence architecture (Architect + Observer)
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum

from .vision_observer import VisionObserver, LayoutExtraction, VisualQAResult


class ModelRole(str, Enum):
    """Roles in bi-modal architecture"""
    ARCHITECT = "architect"     # Claude - logic, constraint graphs
    OBSERVER = "observer"       # GPT-4o - vision, layout extraction
    VERIFIER = "verifier"       # Haiku/GPT-mini - fast validation


@dataclass 
class ArchitectConfig:
    """Configuration for the Architect (primary LLM)"""
    model: str = "claude-3-5-sonnet-20241022"
    temperature: float = 0.2  # Low for deterministic output
    max_tokens: int = 4096
    force_json: bool = True
    
    # Cost optimization
    use_fast_verifier: bool = True
    verifier_model: str = "claude-3-haiku-20240307"


@dataclass
class ObserverConfig:
    """Configuration for the Observer (vision model)"""
    model: str = "gpt-4o"
    temperature: float = 0.2
    max_tokens: int = 1000
    detail_level: str = "high"  # "low" for QA, "high" for extraction


@dataclass
class OrchestrationResult:
    """Result of model orchestration"""
    success: bool
    constraint_graph: Optional[dict] = None
    layout_extraction: Optional[LayoutExtraction] = None
    qa_result: Optional[VisualQAResult] = None
    errors: list[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class ModelOrchestrator:
    """
    Orchestrates the bi-modal intelligence architecture.
    
    The Handshake:
    1. Observer (GPT-4o) extracts layout from reference image
    2. Architect (Claude) generates constraint graph from layout + intent
    3. Verifier (Haiku) validates outputs for cost savings
    
    All communication is via structured JSON - no natural language chat.
    """
    
    def __init__(
        self,
        architect_config: Optional[ArchitectConfig] = None,
        observer_config: Optional[ObserverConfig] = None,
    ):
        self.architect_config = architect_config or ArchitectConfig()
        self.observer_config = observer_config or ObserverConfig()
        
        self.observer = VisionObserver(model=self.observer_config.model)
    
    async def extract_and_generate(
        self,
        reference_image: bytes,
        user_intent: str,
        brand_colors: Optional[list[str]] = None,
    ) -> OrchestrationResult:
        """
        Full handshake: Reference Image → Layout → Constraint Graph
        
        Args:
            reference_image: User-uploaded reference banner
            user_intent: What the user wants (e.g., "Medical Conference")
            brand_colors: Optional brand palette
            
        Returns:
            OrchestrationResult with constraint graph
        """
        errors = []
        
        # Step 1: Observer extracts layout
        layout = await self.observer.extract_layout(reference_image)
        
        if layout.confidence < 0.3:
            errors.append(f"Low confidence layout extraction: {layout.confidence}")
        
        # Step 2: Architect generates constraint graph
        # This would call Claude with the layout pattern + user intent
        constraint_graph = await self._generate_constraint_graph(
            layout, user_intent, brand_colors
        )
        
        return OrchestrationResult(
            success=len(errors) == 0 and constraint_graph is not None,
            constraint_graph=constraint_graph,
            layout_extraction=layout,
            errors=errors,
        )
    
    async def visual_qa_loop(
        self,
        generated_image: bytes,
        max_iterations: int = 3,
    ) -> OrchestrationResult:
        """
        Visual QA feedback loop.
        
        Args:
            generated_image: The rendered banner
            max_iterations: Max QA cycles
            
        Returns:
            OrchestrationResult with QA results
        """
        for i in range(max_iterations):
            qa_result = await self.observer.visual_qa(
                generated_image,
                aspect="visual_balance"
            )
            
            if qa_result.passed:
                return OrchestrationResult(
                    success=True,
                    qa_result=qa_result,
                )
            
            # Would apply suggestions and re-render here
            # For now, just return the QA result
            if i == max_iterations - 1:
                return OrchestrationResult(
                    success=False,
                    qa_result=qa_result,
                    errors=[f"QA failed after {max_iterations} iterations: {qa_result.issues}"],
                )
        
        return OrchestrationResult(success=False, errors=["QA loop exhausted"])
    
    async def _generate_constraint_graph(
        self,
        layout: LayoutExtraction,
        user_intent: str,
        brand_colors: Optional[list[str]] = None,
    ) -> Optional[dict]:
        """
        Generate constraint graph using Architect (Claude).
        
        This combines the extracted layout pattern with user intent.
        """
        # Build constraint graph from layout extraction
        constraint_graph = {
            "elements": [],
            "relationships": layout.relationships,
            "metadata": {
                "layout_pattern": layout.layout_pattern,
                "text_position": layout.text_position,
                "user_intent": user_intent,
                "brand_colors": brand_colors or [],
            }
        }
        
        # Convert layout elements to constraint elements
        for elem in layout.elements:
            constraint_elem = {
                "id": elem.get("id", "unknown"),
                "type": elem.get("type", "text"),
                "constraints": self._position_to_constraints(
                    elem.get("position", "center"),
                    elem.get("size", "medium"),
                ),
            }
            constraint_graph["elements"].append(constraint_elem)
        
        return constraint_graph
    
    def _position_to_constraints(
        self,
        position: str,
        size: str,
    ) -> dict:
        """Convert position/size descriptions to numeric constraints"""
        # Canvas dimensions (assuming 1200x630)
        canvas_w, canvas_h = 1200, 630
        
        # Size mappings
        size_map = {
            "small": (100, 30),
            "medium": (300, 60),
            "large": (600, 80),
            "half": (600, 315),
            "full": (1200, 630),
        }
        w, h = size_map.get(size, (300, 60))
        
        # Position mappings
        position_map = {
            "top_left": {"x": 40, "y": 40},
            "top_center": {"x": (canvas_w - w) // 2, "y": 40},
            "top_right": {"x": canvas_w - w - 40, "y": 40},
            "center_left": {"x": 40, "y": (canvas_h - h) // 2},
            "center": {"x": (canvas_w - w) // 2, "y": (canvas_h - h) // 2},
            "center_right": {"x": canvas_w - w - 40, "y": (canvas_h - h) // 2},
            "bottom_left": {"x": 40, "y": canvas_h - h - 40},
            "bottom_center": {"x": (canvas_w - w) // 2, "y": canvas_h - h - 40},
            "bottom_right": {"x": canvas_w - w - 40, "y": canvas_h - h - 40},
            "left": {"x": 40, "y": (canvas_h - h) // 2},
            "right": {"x": canvas_w - w - 40, "y": (canvas_h - h) // 2},
        }
        
        pos = position_map.get(position, position_map["center"])
        
        return {
            "x": pos["x"],
            "y": pos["y"],
            "width": w,
            "height": h,
        }
    
    def get_config_summary(self) -> dict:
        """Get configuration summary for debugging"""
        return {
            "architect": {
                "model": self.architect_config.model,
                "temperature": self.architect_config.temperature,
                "force_json": self.architect_config.force_json,
            },
            "observer": {
                "model": self.observer_config.model,
                "temperature": self.observer_config.temperature,
            },
            "verifier": {
                "enabled": self.architect_config.use_fast_verifier,
                "model": self.architect_config.verifier_model,
            },
        }


# Convenience functions
async def extract_layout_and_generate(
    reference_image: bytes,
    user_intent: str,
) -> OrchestrationResult:
    """Quick function for image-to-constraint-graph"""
    orchestrator = ModelOrchestrator()
    return await orchestrator.extract_and_generate(reference_image, user_intent)

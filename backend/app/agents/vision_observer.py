"""
Vision Observer (GPT-4o)
Handles visual perception for bi-modal intelligence architecture
"""

import base64
from dataclasses import dataclass
from typing import Optional
from enum import Enum

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class VisionTask(str, Enum):
    """Types of vision analysis tasks"""
    IMAGE_TO_LAYOUT = "image_to_layout"
    VISUAL_QA = "visual_qa"
    DESIGN_CRITIC = "design_critic"


@dataclass
class LayoutExtraction:
    """Result of image-to-layout analysis"""
    layout_pattern: str  # e.g., "split_screen_asymmetric", "centered", "grid"
    text_position: str   # e.g., "left_col", "center", "top"
    elements: list[dict] # Identified elements with positions
    relationships: list[dict]  # Spatial relationships
    confidence: float


@dataclass
class VisualQAResult:
    """Result of visual QA analysis"""
    score: int  # 1-10 rating
    passed: bool  # >= 8 is passing
    issues: list[str]
    suggestions: list[dict]  # Coordinate changes needed


class VisionObserver:
    """
    GPT-4o Vision model for visual analysis.
    
    The "Observer" in bi-modal architecture:
    - Extracts layout topology from reference images
    - Performs visual QA on generated banners
    - Outputs structured JSON for the Architect
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
    ):
        self.model = model
        self.client = None
        
        if OPENAI_AVAILABLE:
            import os
            key = api_key or os.getenv("OPENAI_API_KEY")
            if key:
                try:
                    self.client = AsyncOpenAI(api_key=key)
                except Exception:
                    self.client = None
    
    def _encode_image(self, image_bytes: bytes) -> str:
        """Encode image to base64 for API"""
        return base64.b64encode(image_bytes).decode("utf-8")
    
    async def extract_layout(
        self,
        image_bytes: bytes,
    ) -> LayoutExtraction:
        """
        Extract layout structure from a reference image.
        
        Use Case: User uploads a banner they like and says "Copy this layout"
        
        Args:
            image_bytes: The reference image
            
        Returns:
            LayoutExtraction with pattern, elements, and relationships
        """
        if not self.client:
            return self._fallback_layout()
        
        system_prompt = """You are a Layout Extraction AI. Analyze images to extract their structural layout.

DO NOT describe the image content. Instead, identify:
1. The layout pattern (e.g., "split_screen", "centered", "asymmetric", "grid_3x2")
2. Position of text elements (e.g., "left_col", "center", "bottom")
3. Nodes: Each visual element (Headline, Subheadline, Image, Logo, CTA)
4. Spatial relationships between nodes

Return ONLY valid JSON in this exact format:
{
    "layout_pattern": "string",
    "text_position": "string",
    "elements": [
        {"id": "headline", "type": "text", "position": "top_left", "size": "large"},
        {"id": "image", "type": "image", "position": "right", "size": "half"}
    ],
    "relationships": [
        {"type": "alignment", "axis": "left", "elements": ["headline", "subheadline"]},
        {"type": "spacing", "source": "headline", "target": "subheadline", "relation": "below"}
    ],
    "confidence": 0.95
}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{self._encode_image(image_bytes)}",
                                    "detail": "high"
                                }
                            },
                            {
                                "type": "text",
                                "text": "Extract the layout structure from this banner image."
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.2,
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON from response
            import json
            import re
            
            # Extract JSON from potential markdown code block
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            
            data = json.loads(content)
            
            return LayoutExtraction(
                layout_pattern=data.get("layout_pattern", "unknown"),
                text_position=data.get("text_position", "center"),
                elements=data.get("elements", []),
                relationships=data.get("relationships", []),
                confidence=data.get("confidence", 0.5),
            )
            
        except Exception as e:
            print(f"Vision extraction failed: {e}")
            return self._fallback_layout()
    
    async def visual_qa(
        self,
        image_bytes: bytes,
        aspect: str = "visual_balance",
    ) -> VisualQAResult:
        """
        Perform visual quality assessment on a generated banner.
        
        Use Case: Validation layer needs visual judgment beyond code analysis
        
        Args:
            image_bytes: The generated banner image
            aspect: What to assess ("visual_balance", "clarity", "hierarchy")
            
        Returns:
            VisualQAResult with score and suggestions
        """
        if not self.client:
            return self._fallback_qa()
        
        system_prompt = f"""You are a Design Critic AI. Rate designs objectively.

Assess this banner on "{aspect}" using a 1-10 scale:
- 1-3: Poor (major issues)
- 4-6: Acceptable (some issues)
- 7-8: Good (minor refinements)
- 9-10: Excellent

Return ONLY valid JSON:
{{
    "score": 8,
    "issues": ["Text overlaps with image edge", "Logo too small"],
    "suggestions": [
        {{"element": "headline", "action": "move", "x_offset": -20, "y_offset": 0}},
        {{"element": "logo", "action": "resize", "scale": 1.2}}
    ]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{self._encode_image(image_bytes)}",
                                    "detail": "low"  # Low detail for faster QA
                                }
                            },
                            {
                                "type": "text",
                                "text": f"Rate this banner's {aspect} from 1-10. If below 8, provide specific fixes."
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.3,
            )
            
            content = response.choices[0].message.content
            
            import json
            import re
            
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            
            data = json.loads(content)
            score = data.get("score", 5)
            
            return VisualQAResult(
                score=score,
                passed=score >= 8,
                issues=data.get("issues", []),
                suggestions=data.get("suggestions", []),
            )
            
        except Exception as e:
            print(f"Visual QA failed: {e}")
            return self._fallback_qa()
    
    def _fallback_layout(self) -> LayoutExtraction:
        """Fallback when vision model unavailable"""
        return LayoutExtraction(
            layout_pattern="centered",
            text_position="center",
            elements=[
                {"id": "headline", "type": "text", "position": "center", "size": "large"},
                {"id": "cta", "type": "button", "position": "bottom_center", "size": "medium"},
            ],
            relationships=[],
            confidence=0.0,
        )
    
    def _fallback_qa(self) -> VisualQAResult:
        """Fallback when vision model unavailable"""
        return VisualQAResult(
            score=7,
            passed=False,
            issues=["Vision model unavailable for QA"],
            suggestions=[],
        )


async def extract_layout_from_image(image_bytes: bytes) -> LayoutExtraction:
    """Convenience function for layout extraction"""
    observer = VisionObserver()
    return await observer.extract_layout(image_bytes)


async def visual_qa_check(
    image_bytes: bytes,
    aspect: str = "visual_balance"
) -> VisualQAResult:
    """Convenience function for visual QA"""
    observer = VisionObserver()
    return await observer.visual_qa(image_bytes, aspect)

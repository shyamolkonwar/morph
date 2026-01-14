"""
SVG Coder Agent (Agent 3)
The "Frontend Developer" - translates constraint graphs into SVG code
"""

from typing import Optional
from .base import BaseAgent


class SVGCoderAgent(BaseAgent):
    """
    Agent 3: The SVG Coder.
    
    Role: The "Frontend Developer" - translates mathematical graphs into SVG code.
    
    Input: Solved Constraint Graph (JSON)
    Output: Raw SVG Code
    
    The Coder:
    - Maps nodes to <rect>, <text>, <path> SVG elements
    - Applies the "Design DNA" (colors, fonts, shadows) from Director
    - Optimizes for rendering
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
    ):
        super().__init__(canvas_width, canvas_height, brand_colors)
        self.name = "svg_coder"
        self.role = "SVG Coder"
    
    async def generate(
        self,
        constraint_graph: dict,
        user_prompt: str,
        feedback: Optional[str] = None,
        previous_svg: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate SVG code from a solved constraint graph.
        
        Args:
            constraint_graph: The solved constraint graph from Director/Solver
            user_prompt: Original user request for context
            feedback: Optional feedback from Verifier
            previous_svg: Previous SVG attempt (for refinement)
            
        Returns:
            SVG code string or None on failure
        """
        from app.providers.openrouter import (
            OpenRouterProvider, OpenRouterConfig, ChatMessage
        )
        from app.config import get_settings
        import re
        
        settings = get_settings()
        
        system_prompt = self._get_system_prompt(feedback, previous_svg)
        user_message = self._build_user_message(constraint_graph, user_prompt)
        
        try:
            config = OpenRouterConfig(
                api_key=settings.openrouter_api_key,
                architect_model=settings.architect_model,
                temperature=0.2,
            )
            
            provider = OpenRouterProvider(config)
            
            messages = [
                ChatMessage(role="system", content=system_prompt),
                ChatMessage(role="user", content=user_message),
            ]
            
            response = await provider.chat(messages, max_tokens=8192)
            content = response.content
            
            # Extract SVG from response
            svg = self._extract_svg(content)
            
            if svg:
                return svg
            else:
                return None
                
        except Exception as e:
            print(f"SVG Coder error: {e}")
            return None
    
    def _get_system_prompt(
        self,
        feedback: Optional[str] = None,
        previous_svg: Optional[str] = None,
    ) -> str:
        """Build system prompt for the SVG Coder."""
        base_prompt = f"""You are the SVG Coder - the "Frontend Developer" in a design studio workflow.

Your role is to:
1. Translate constraint graphs into precise SVG code
2. Apply design properties (colors, fonts, shadows)
3. Ensure all elements are properly positioned

CRITICAL RULES:
- Output ONLY valid SVG code (no markdown, no explanations)
- SVG must have exact dimensions: {self.config.canvas_width}x{self.config.canvas_height}
- All elements MUST stay within canvas bounds
- Use the specified brand colors: {', '.join(self.config.brand_colors)}
- All text must be readable (min 14px font size)
- Ensure WCAG contrast compliance (4.5:1 ratio)

SVG TEMPLATE:
<svg xmlns="http://www.w3.org/2000/svg" width="{self.config.canvas_width}" height="{self.config.canvas_height}" viewBox="0 0 {self.config.canvas_width} {self.config.canvas_height}">
    <!-- Background -->
    <rect width="100%" height="100%" fill="#background_color"/>
    
    <!-- Elements go here -->
</svg>

POSITION MAPPING:
- "center" → x: 50%, y: 50%
- "top_left" → x: 40px, y: 40px
- "top_center" → x: 50%, y: 40px
- "top_right" → x: width-40px, y: 40px
- "bottom_center" → x: 50%, y: height-40px
- "left_half" → x: 0 to 50%
- "right_half" → x: 50% to 100%"""

        if feedback:
            base_prompt += f"""

VERIFIER FEEDBACK (MUST FIX):
{feedback}

Please fix the SVG to address these issues. Do not change the layout unless necessary."""
            
            if previous_svg:
                base_prompt += f"""

PREVIOUS SVG (fix this):
{previous_svg[:2000]}..."""
        
        return base_prompt
    
    def _build_user_message(
        self,
        constraint_graph: dict,
        user_prompt: str,
    ) -> str:
        """Build user message with constraint graph."""
        import json
        
        return f"""Generate SVG for this design:

ORIGINAL REQUEST: {user_prompt}

CONSTRAINT GRAPH:
{json.dumps(constraint_graph, indent=2)}

Output ONLY the SVG code, nothing else."""
    
    def _extract_svg(self, content: str) -> Optional[str]:
        """Extract SVG code from LLM response."""
        import re
        
        # Try to find SVG in markdown code block
        svg_match = re.search(r'```(?:svg|xml)?\s*(.*?)\s*```', content, re.DOTALL)
        if svg_match:
            content = svg_match.group(1)
        
        # Find <svg>...</svg>
        svg_match = re.search(r'<svg[^>]*>.*?</svg>', content, re.DOTALL | re.IGNORECASE)
        if svg_match:
            svg = svg_match.group(0)
            
            # Validate basic structure
            if '<svg' in svg and '</svg>' in svg:
                return svg
        
        return None

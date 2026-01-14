"""
Design Director Agent (Agent 1)
The "Visionary" - extracts intent and generates constraint graphs
"""

from typing import Optional
from .base import BaseAgent


class DesignDirectorAgent(BaseAgent):
    """
    Agent 1: The Design Director.
    
    Role: The "Visionary" - extracts intent and invents the aesthetic.
    
    Input: User Prompt + RAG Design Patterns
    Output: Constraint Graph (JSON) - abstract definition of relationships
    
    The Director does NOT calculate pixel coordinates.
    It defines relationships like "Headline centered", "Image right-half".
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
    ):
        super().__init__(canvas_width, canvas_height, brand_colors)
        self.name = "design_director"
        self.role = "Design Director"
    
    async def generate(
        self,
        user_prompt: str,
        feedback: Optional[str] = None,
        rag_patterns: Optional[list[dict]] = None,
    ) -> Optional[dict]:
        """
        Generate a constraint graph from user prompt.
        
        Args:
            user_prompt: User's design request
            feedback: Optional feedback from Layout Solver
            rag_patterns: Optional retrieved design patterns
            
        Returns:
            Constraint graph (JSON) or None on failure
        """
        from app.providers.openrouter import (
            OpenRouterProvider, OpenRouterConfig, ChatMessage
        )
        from app.config import get_settings
        import json
        import re
        
        settings = get_settings()
        
        if rag_patterns is None:
            # Check if we should retrieve patterns
            try:
                from app.services.vector_store import get_vector_store
                vector_store = get_vector_store()
                found_patterns = await vector_store.search_patterns(
                    query=user_prompt,
                    match_count=3,
                    match_threshold=0.4,
                )
                if found_patterns:
                    rag_patterns = [
                        {
                            "name": p.category or "Pattern",
                            "description": p.content,
                            "similarity": p.similarity
                        }
                        for p in found_patterns
                    ]
                    # Increment usage
                    for p in found_patterns:
                        await vector_store.increment_usage(p.id)
            except Exception as e:
                print(f"RAG retrieval warning: {e}")

        system_prompt = self._get_system_prompt(feedback)
        user_message = self._build_user_message(user_prompt, rag_patterns)
        
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
            
            response = await provider.chat(messages, max_tokens=4096)
            content = response.content
            
            # Extract JSON from response
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            
            # Try to find JSON object
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                content = content[json_start:json_end]
            
            constraint_graph = json.loads(content)
            
            # Validate required fields
            if "elements" not in constraint_graph:
                constraint_graph["elements"] = []
            if "relationships" not in constraint_graph:
                constraint_graph["relationships"] = []
            
            return constraint_graph
            
        except Exception as e:
            print(f"Design Director error: {e}")
            return None
    
    def _get_system_prompt(self, feedback: Optional[str] = None) -> str:
        """Build system prompt for the Design Director."""
        base_prompt = f"""You are the Design Director - the "Visionary" in a design studio workflow.

Your role is to:
1. Extract the user's intent from their prompt
2. Define the aesthetic direction (colors, fonts, mood)
3. Create a Constraint Graph that defines the design structure

CRITICAL RULES:
- Do NOT calculate specific pixel coordinates
- Define RELATIONSHIPS between elements (e.g., "centered", "below", "right-half")
- Output ONLY valid JSON in the specified format

Canvas dimensions: {self.config.canvas_width}x{self.config.canvas_height}px
Brand colors: {', '.join(self.config.brand_colors)}

OUTPUT FORMAT (JSON only):
{{
    "design_intent": "Brief description of the design",
    "aesthetic": {{
        "mood": "professional/playful/elegant/bold",
        "primary_color": "#hex",
        "secondary_color": "#hex",
        "font_style": "modern/classic/playful"
    }},
    "elements": [
        {{
            "id": "headline",
            "type": "text",
            "content": "The headline text",
            "position": "center|top_left|top_right|bottom_center|etc",
            "size": "large|medium|small",
            "constraints": ["centered_horizontally", "top_third"]
        }},
        {{
            "id": "background",
            "type": "rectangle",
            "position": "full",
            "color": "#hex"
        }}
    ],
    "relationships": [
        {{"type": "below", "source": "headline", "target": "subheadline", "spacing": "medium"}},
        {{"type": "alignment", "axis": "center", "elements": ["headline", "cta"]}}
    ]
}}"""
        
        if feedback:
            base_prompt += f"""

FEEDBACK FROM LAYOUT SOLVER:
{feedback}

Please adjust your design to address this feedback. Simplify if necessary."""
        
        return base_prompt
    
    def _build_user_message(
        self,
        user_prompt: str,
        rag_patterns: Optional[list[dict]] = None,
    ) -> str:
        """Build user message with optional RAG context."""
        message = f"Design Request: {user_prompt}"
        
        if rag_patterns:
            message += "\n\nRelevant Design Patterns for inspiration:"
            for i, pattern in enumerate(rag_patterns[:3], 1):
                message += f"\n{i}. {pattern.get('name', 'Pattern')}: {pattern.get('description', '')}"
        
        return message

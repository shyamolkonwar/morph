"""
Design Refinement Agent
Multi-agent iterative design generation with verification
"""

import re
from typing import Optional
from dataclasses import dataclass, field

from app.config import get_settings
from app.prompts.god_prompt import create_god_prompt, create_refinement_prompt
from app.pipeline.verification import VerificationPipeline, VerificationResult
from app.validators.constraint_graph import ConstraintGraphValidator


@dataclass
class GenerationHistory:
    """Track generation iterations"""
    iteration: int
    status: str
    errors: dict
    svg: Optional[str] = None


class DesignGenerationError(Exception):
    """Raised when design generation fails after max iterations"""
    pass


class DesignRefinementAgent:
    """
    Orchestrate multi-agent design refinement.
    
    Pipeline:
    1. GOD Prompt → LLM generates design spec
    2. Extract Constraint Graph
    3. Validate Constraint Graph
    4. Generate SVG from spec
    5. Run 5-layer verification
    6. If failed: create refinement prompt and retry
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
        max_iterations: int = 5,
    ):
        self.settings = get_settings()
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.brand_colors = brand_colors or ["#FF6B35", "#FFFFFF", "#004E89"]
        self.max_iterations = max_iterations
        
        self.verification_pipeline = VerificationPipeline(
            canvas_width=canvas_width,
            canvas_height=canvas_height,
            approved_palette=brand_colors,
        )
        self.constraint_validator = ConstraintGraphValidator()
        
        self.history: list[GenerationHistory] = []
        self.iteration_count = 0
    
    async def generate(self, user_prompt: str) -> dict:
        """
        Generate design with iterative refinement.
        
        Returns:
            dict with svg, verification_report, iterations, constraint_graph
        """
        current_prompt = user_prompt
        
        for iteration in range(self.max_iterations):
            self.iteration_count = iteration
            
            # Step 1: Build system prompt
            system_prompt = create_god_prompt(
                canvas_width=self.canvas_width,
                canvas_height=self.canvas_height,
                brand_colors=self.brand_colors,
                design_brief=current_prompt,
            )
            
            # Step 2: Call LLM
            llm_response = await self._call_llm(system_prompt, current_prompt)
            
            # Step 3: Extract sections from response
            analysis = self._extract_section(llm_response, "ANALYSIS")
            constraint_graph_text = self._extract_section(llm_response, "CONSTRAINT_GRAPH")
            svg_code = self._extract_svg(llm_response)
            
            # Step 4: Validate constraint graph (if present)
            if constraint_graph_text:
                graph_valid, graph_errors = self.constraint_validator.validate(constraint_graph_text)
                if not graph_valid:
                    # Create refinement prompt and retry
                    current_prompt = create_refinement_prompt(
                        user_prompt,
                        [("constraint_graph", graph_errors)],
                        iteration
                    )
                    self.history.append(GenerationHistory(
                        iteration=iteration,
                        status="failed",
                        errors={"constraint_graph": graph_errors},
                    ))
                    continue
            
            # Step 5: Validate SVG
            if not svg_code:
                current_prompt = create_refinement_prompt(
                    user_prompt,
                    [("svg_generation", ["No SVG code generated"])],
                    iteration
                )
                self.history.append(GenerationHistory(
                    iteration=iteration,
                    status="failed",
                    errors={"svg_generation": ["No SVG code generated"]},
                ))
                continue
            
            # Step 6: Run verification pipeline
            verification_report = await self.verification_pipeline.verify(svg_code)
            
            # Store history
            self.history.append(GenerationHistory(
                iteration=iteration,
                status=verification_report.overall.value,
                errors={
                    layer: errors
                    for layer, (_, errors) in verification_report.layers.items()
                },
                svg=svg_code,
            ))
            
            # If all checks pass, return result
            if verification_report.overall == VerificationResult.PASS:
                return {
                    "svg": svg_code,
                    "verification_report": verification_report.to_dict(),
                    "iterations": iteration + 1,
                    "constraint_graph": constraint_graph_text,
                    "analysis": analysis,
                }
            
            # Create refinement prompt with failed layers
            failed_layers = [
                (layer, errors)
                for layer, (result, errors) in verification_report.layers.items()
                if result == VerificationResult.FAIL and errors
            ]
            
            current_prompt = create_refinement_prompt(
                user_prompt,
                failed_layers,
                iteration
            )
        
        # Max iterations reached - return best attempt
        best_attempt = None
        for h in reversed(self.history):
            if h.svg:
                best_attempt = h
                break
        
        if best_attempt:
            return {
                "svg": best_attempt.svg,
                "verification_report": {"overall": "partial", "errors": best_attempt.errors},
                "iterations": self.max_iterations,
                "constraint_graph": None,
                "warning": f"Design generated with issues after {self.max_iterations} iterations",
            }
        
        raise DesignGenerationError(
            f"Failed to generate valid design after {self.max_iterations} iterations. "
            f"Last errors: {self.history[-1].errors if self.history else 'Unknown'}"
        )
    
    async def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Call the configured LLM provider"""
        provider = self.settings.default_ai_provider
        
        if provider == "anthropic":
            return await self._call_anthropic(system_prompt, user_prompt)
        elif provider == "openai":
            return await self._call_openai(system_prompt, user_prompt)
        else:
            raise ValueError(f"Unknown AI provider: {provider}")
    
    async def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        """Call Anthropic Claude API"""
        import anthropic
        
        client = anthropic.AsyncAnthropic(api_key=self.settings.anthropic_api_key)
        
        message = await client.messages.create(
            model=self.settings.anthropic_model,
            max_tokens=8192,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        
        return message.content[0].text
    
    async def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenAI GPT API"""
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        
        response = await client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=8192,
        )
        
        return response.choices[0].message.content or ""
    
    def _extract_section(self, text: str, section_name: str) -> str:
        """Extract a section from LLM response"""
        # Match [SECTION_NAME]...[NEXT_SECTION or end]
        pattern = rf'\[{section_name}\](.*?)(?=\[[A-Z_]+\]|$)'
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        
        if match:
            return match.group(1).strip()
        
        return ""
    
    def _extract_svg(self, text: str) -> str:
        """Extract SVG code from response"""
        # Try to find SVG in [SVG_CODE] section first
        svg_section = self._extract_section(text, "SVG_CODE")
        if svg_section:
            # Extract just the <svg>...</svg> part
            svg_match = re.search(r'<svg[^>]*>.*?</svg>', svg_section, re.DOTALL | re.IGNORECASE)
            if svg_match:
                return svg_match.group(0)
            return svg_section
        
        # Fallback: find any SVG in the text
        svg_match = re.search(r'<svg[^>]*>.*?</svg>', text, re.DOTALL | re.IGNORECASE)
        if svg_match:
            return svg_match.group(0)
        
        return ""

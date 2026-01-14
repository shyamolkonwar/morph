"""
Design Refinement Agent
Multi-agent iterative design generation with verification and RAG
"""

import re
import time
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
    Orchestrate multi-agent design refinement with RAG.
    
    Pipeline:
    1. RAG: Retrieve similar design patterns
    2. GOD Prompt → LLM generates design spec with context
    3. Extract Constraint Graph
    4. Validate Constraint Graph
    5. Generate SVG from spec
    6. Run 5-layer verification
    7. If failed: log to audit, create refinement prompt and retry
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
        max_iterations: int = 5,
        enable_rag: bool = True,
        generation_id: Optional[str] = None,
    ):
        self.settings = get_settings()
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.brand_colors = brand_colors or ["#FF6B35", "#FFFFFF", "#004E89"]
        self.max_iterations = max_iterations
        self.enable_rag = enable_rag
        self.generation_id = generation_id
        
        self.verification_pipeline = VerificationPipeline(
            canvas_width=canvas_width,
            canvas_height=canvas_height,
            approved_palette=brand_colors,
        )
        self.constraint_validator = ConstraintGraphValidator()
        
        self.history: list[GenerationHistory] = []
        self.iteration_count = 0
        self.retrieved_patterns: list[str] = []
    
    async def generate(self, user_prompt: str) -> dict:
        """
        Generate design with iterative refinement and RAG.
        
        Returns:
            dict with svg, verification_report, iterations, constraint_graph
        """
        current_prompt = user_prompt
        rag_context = ""
        
        # Step 0: RAG retrieval
        if self.enable_rag:
            try:
                from app.services.vector_store import get_vector_store
                vector_store = get_vector_store()
                patterns = await vector_store.search_patterns(
                    query=user_prompt,
                    match_count=3,
                    match_threshold=0.4,
                )
                
                if patterns:
                    self.retrieved_patterns = [p.id for p in patterns]
                    rag_context = "\n\n[REFERENCE PATTERNS]\n"
                    for i, p in enumerate(patterns, 1):
                        rag_context += f"Pattern {i} ({p.category}, similarity: {p.similarity:.2f}):\n{p.content}\n\n"
                    
                    # Increment usage counts
                    for p in patterns:
                        await vector_store.increment_usage(p.id)
            except Exception as e:
                # RAG failure is non-fatal
                print(f"RAG retrieval failed: {e}")
        
        for iteration in range(self.max_iterations):
            self.iteration_count = iteration
            iteration_start = time.time()
            svg_before = None
            
            # Step 1: Build system prompt with RAG context
            system_prompt = create_god_prompt(
                canvas_width=self.canvas_width,
                canvas_height=self.canvas_height,
                brand_colors=self.brand_colors,
                design_brief=current_prompt + rag_context,
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
                # ═══════════════════════════════════════════════════════════
                # AUTO-LEARN: Store successful pattern in vector database
                # ═══════════════════════════════════════════════════════════
                try:
                    from app.services.vector_store import get_vector_store
                    import json
                    
                    vector_store = get_vector_store()
                    
                    # Create pattern content from the successful generation
                    pattern_content = json.dumps({
                        "prompt": user_prompt,
                        "constraint_graph": constraint_graph_text,
                        "canvas": {
                            "width": self.canvas_width,
                            "height": self.canvas_height
                        },
                        "brand_colors": self.brand_colors,
                        "iterations_needed": iteration + 1,
                    })
                    
                    await vector_store.store_pattern(
                        content=pattern_content,
                        category="auto_learned",
                        metadata={
                            "generation_id": self.generation_id,
                            "iterations": iteration + 1,
                            "verified": True,
                            "prompt_length": len(user_prompt),
                        },
                        source="generated",
                    )
                except Exception as e:
                    # Non-fatal: log but don't fail the generation
                    print(f"Auto-learn pattern storage failed: {e}")
                
                return {
                    "svg": svg_code,
                    "verification_report": verification_report.to_dict(),
                    "iterations": iteration + 1,
                    "constraint_graph": constraint_graph_text,
                    "analysis": analysis,
                    "auto_learned": True,
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
        
        if provider == "openrouter":
            return await self._call_openrouter(system_prompt, user_prompt)
        elif provider == "anthropic":
            return await self._call_anthropic(system_prompt, user_prompt)
        elif provider == "openai":
            return await self._call_openai(system_prompt, user_prompt)
        else:
            # Default to OpenRouter
            return await self._call_openrouter(system_prompt, user_prompt)
    
    async def _call_openrouter(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenRouter API (unified provider)"""
        from app.providers.openrouter import OpenRouterProvider, OpenRouterConfig, ChatMessage
        
        config = OpenRouterConfig(
            api_key=self.settings.openrouter_api_key,
            architect_model=self.settings.architect_model,
            temperature=0.2,  # Low for deterministic output
        )
        
        provider = OpenRouterProvider(config)
        
        messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_prompt),
        ]
        
        response = await provider.chat(messages, max_tokens=8192)
        return response.content
    
    async def _call_anthropic(self, system_prompt: str, user_prompt: str) -> str:
        """Call Anthropic Claude API (legacy fallback)"""
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
        """Call OpenAI GPT API (legacy fallback)"""
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

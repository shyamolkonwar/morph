"""
Banner Generation Tasks
Celery tasks for async banner generation pipeline
"""

import time
import uuid
from typing import Optional
from dataclasses import dataclass, asdict
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded


@dataclass
class GenerationResult:
    """Result of banner generation"""
    success: bool
    job_id: str
    svg: Optional[str] = None
    png_url: Optional[str] = None
    webp_url: Optional[str] = None
    errors: list[str] = None
    iterations: int = 0
    total_time_ms: float = 0.0
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class RateLimitError(Exception):
    """Raised when hitting API rate limits"""
    pass


@shared_task(
    bind=True,
    name="app.tasks.generation.orchestrate_design_generation",
    queue="generation",
    # ═══════════════════════════════════════════════════════════════
    # Time Limits
    # ═══════════════════════════════════════════════════════════════
    soft_time_limit=60,  # Soft limit: raises SoftTimeLimitExceeded
    time_limit=120,      # Hard limit: kills task
    # ═══════════════════════════════════════════════════════════════
    # Retry Configuration
    # ═══════════════════════════════════════════════════════════════
    autoretry_for=(RateLimitError, ConnectionError),
    retry_backoff=True,  # Exponential backoff
    retry_backoff_max=300,  # Max 5 minute backoff
    retry_jitter=True,
    max_retries=3,
)
def orchestrate_design_generation(
    self,
    user_prompt: str,
    brand_colors: Optional[list[str]] = None,
    canvas_width: int = 1200,
    canvas_height: int = 630,
    max_iterations: int = 5,
) -> dict:
    """
    Primary Task: Orchestrate the complete banner generation pipeline.
    
    Pipeline:
    1. Call LLM Service (Claude) with "GOD Prompt"
    2. Receive Constraint Graph
    3. Call Layout Solver (OR-Tools) to validate positions
    4. Call Renderer to generate the asset
    5. Save result to Database
    
    Args:
        user_prompt: User's banner request
        brand_colors: Optional brand color palette
        canvas_width: Banner width in pixels
        canvas_height: Banner height in pixels
        max_iterations: Max refinement iterations
        
    Returns:
        GenerationResult as dict
    """
    job_id = self.request.id or str(uuid.uuid4())
    start_time = time.time()
    
    try:
        # Update task state to STARTED
        self.update_state(
            state="STARTED",
            meta={
                "job_id": job_id,
                "step": "initializing",
                "progress": 0,
            }
        )
        
        # Import here to avoid circular imports
        from app.agents.design_agent import DesignRefinementAgent
        from app.config import get_settings
        
        settings = get_settings()
        
        # ═══════════════════════════════════════════════════════════════
        # Step 1: Initialize Design Agent
        # ═══════════════════════════════════════════════════════════════
        self.update_state(
            state="STARTED",
            meta={
                "job_id": job_id,
                "step": "llm_generation",
                "progress": 10,
            }
        )
        
        agent = DesignRefinementAgent(
            canvas_width=canvas_width,
            canvas_height=canvas_height,
            brand_colors=brand_colors,
            max_iterations=max_iterations,
        )
        
        # ═══════════════════════════════════════════════════════════════
        # Step 2: Run Generation Pipeline (sync wrapper for async)
        # ═══════════════════════════════════════════════════════════════
        import asyncio
        
        async def run_generation():
            return await agent.generate(user_prompt)
        
        # Run async generation in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(run_generation())
        finally:
            loop.close()
        
        # ═══════════════════════════════════════════════════════════════
        # Step 3: Process Result
        # ═══════════════════════════════════════════════════════════════
        self.update_state(
            state="STARTED",
            meta={
                "job_id": job_id,
                "step": "rendering",
                "progress": 80,
            }
        )
        
        total_time = (time.time() - start_time) * 1000
        
        if result.success:
            return asdict(GenerationResult(
                success=True,
                job_id=job_id,
                svg=result.final_svg,
                iterations=result.iterations,
                total_time_ms=total_time,
            ))
        else:
            return asdict(GenerationResult(
                success=False,
                job_id=job_id,
                errors=result.errors,
                iterations=result.iterations,
                total_time_ms=total_time,
            ))
            
    except SoftTimeLimitExceeded:
        # Graceful timeout handling
        return asdict(GenerationResult(
            success=False,
            job_id=job_id,
            errors=["Generation timed out (60s limit). Try a simpler prompt."],
            total_time_ms=(time.time() - start_time) * 1000,
        ))
        
    except RateLimitError as e:
        # Will be auto-retried with exponential backoff
        raise
        
    except Exception as e:
        return asdict(GenerationResult(
            success=False,
            job_id=job_id,
            errors=[f"Generation failed: {str(e)}"],
            total_time_ms=(time.time() - start_time) * 1000,
        ))


@shared_task(
    bind=True,
    name="app.tasks.generation.iterative_refinement_loop",
    queue="generation",
    soft_time_limit=60,
    time_limit=120,
    max_retries=2,
)
def iterative_refinement_loop(
    self,
    job_id: str,
    failed_svg: str,
    error_report: dict,
    original_prompt: str,
    brand_colors: Optional[list[str]] = None,
) -> dict:
    """
    Secondary Task: Refine a failed banner generation.
    
    Called when orchestrate_design_generation fails validation checks.
    
    Args:
        job_id: Original job ID
        failed_svg: The SVG that failed validation
        error_report: Structured error report from verification
        original_prompt: The user's original prompt
        brand_colors: Optional brand colors
        
    Returns:
        GenerationResult as dict
    """
    start_time = time.time()
    
    try:
        self.update_state(
            state="STARTED",
            meta={
                "job_id": job_id,
                "step": "refinement",
                "progress": 0,
            }
        )
        
        from app.agents.design_agent import DesignRefinementAgent
        from app.prompts.god_prompt import create_refinement_prompt
        
        # ═══════════════════════════════════════════════════════════════
        # Step 1: Create refinement prompt from errors
        # ═══════════════════════════════════════════════════════════════
        refinement_prompt = create_refinement_prompt(
            original_prompt=original_prompt,
            failed_svg=failed_svg,
            error_report=error_report,
        )
        
        # ═══════════════════════════════════════════════════════════════
        # Step 2: Re-run generation with error context
        # ═══════════════════════════════════════════════════════════════
        agent = DesignRefinementAgent(
            brand_colors=brand_colors,
            max_iterations=2,  # Limited iterations for refinement
        )
        
        import asyncio
        
        async def run_refinement():
            return await agent.generate(refinement_prompt)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(run_refinement())
        finally:
            loop.close()
        
        total_time = (time.time() - start_time) * 1000
        
        return asdict(GenerationResult(
            success=result.success,
            job_id=job_id,
            svg=result.final_svg if result.success else None,
            errors=result.errors if not result.success else [],
            iterations=result.iterations,
            total_time_ms=total_time,
        ))
        
    except SoftTimeLimitExceeded:
        return asdict(GenerationResult(
            success=False,
            job_id=job_id,
            errors=["Refinement timed out"],
            total_time_ms=(time.time() - start_time) * 1000,
        ))
        
    except Exception as e:
        return asdict(GenerationResult(
            success=False,
            job_id=job_id,
            errors=[f"Refinement failed: {str(e)}"],
            total_time_ms=(time.time() - start_time) * 1000,
        ))

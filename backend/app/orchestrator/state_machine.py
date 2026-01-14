"""
State Machine Orchestrator
Central controller for the 5-agent design workflow
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import time


class OrchestratorState(str, Enum):
    """States in the design workflow"""
    IDLE = "idle"
    DIRECTOR = "director"          # Agent 1: Intent extraction
    SOLVER = "solver"              # Agent 2: Constraint validation
    CODER = "coder"                # Agent 3: SVG generation
    VERIFIER = "verifier"          # Agent 4: 5-layer validation
    RENDERER = "renderer"          # Agent 5: Final export
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class AgentMessage:
    """Message passed between agents"""
    from_agent: str
    to_agent: str
    message_type: str  # "data", "feedback", "error"
    payload: dict
    timestamp: float = field(default_factory=time.time)


@dataclass
class OrchestratorResult:
    """Final result from orchestration"""
    success: bool
    svg: Optional[str] = None
    png_url: Optional[str] = None
    webp_url: Optional[str] = None
    iterations: int = 0
    director_iterations: int = 0
    coder_iterations: int = 0
    errors: list[str] = field(default_factory=list)
    constraint_graph: Optional[dict] = None
    solved_graph: Optional[dict] = None
    verification_report: Optional[dict] = None
    total_time_ms: float = 0.0


class DesignOrchestrator:
    """
    5-Agent Design Studio Workflow Orchestrator.
    
    Flow:
    1. USER PROMPT → Design Director
    2. Constraint Graph → Layout Solver
       └─ FAIL → Feedback to Director (loop)
    3. Solved Graph → SVG Coder
    4. Raw SVG → Verifier
       └─ FAIL → Feedback to Coder (loop)
    5. Verified SVG → Renderer
    6. Final Assets → USER
    
    Safety Limits:
    - Max director iterations: 3
    - Max coder iterations: 5
    - Diminishing returns fallback after 2 repeated errors
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None,
        max_director_iterations: int = 3,
        max_coder_iterations: int = 5,
    ):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.brand_colors = brand_colors or ["#FF6B35", "#FFFFFF", "#004E89"]
        self.max_director_iterations = max_director_iterations
        self.max_coder_iterations = max_coder_iterations
        
        self.state = OrchestratorState.IDLE
        self.message_log: list[AgentMessage] = []
        self.director_iterations = 0
        self.coder_iterations = 0
        self.last_error: Optional[str] = None
        self.repeated_error_count = 0
    
    async def run(self, user_prompt: str) -> OrchestratorResult:
        """
        Execute the complete design workflow.
        
        Args:
            user_prompt: User's banner request
            
        Returns:
            OrchestratorResult with final assets or errors
        """
        start_time = time.time()
        
        try:
            # ═══════════════════════════════════════════════════════════════
            # PHASE 1: Design Director (Agent 1)
            # ═══════════════════════════════════════════════════════════════
            constraint_graph = await self._run_director_loop(user_prompt)
            
            if constraint_graph is None:
                return OrchestratorResult(
                    success=False,
                    errors=["Design Director failed to generate valid constraint graph"],
                    director_iterations=self.director_iterations,
                    total_time_ms=(time.time() - start_time) * 1000,
                )
            
            # ═══════════════════════════════════════════════════════════════
            # PHASE 2: Layout Solver (Agent 2)
            # Already included in director loop (validates constraints)
            # ═══════════════════════════════════════════════════════════════
            solved_graph = constraint_graph  # Solver output
            
            # ═══════════════════════════════════════════════════════════════
            # PHASE 3-4: SVG Coder + Verifier Loop (Agents 3 & 4)
            # ═══════════════════════════════════════════════════════════════
            verified_svg = await self._run_coder_verifier_loop(
                solved_graph, user_prompt
            )
            
            if verified_svg is None:
                return OrchestratorResult(
                    success=False,
                    errors=["SVG Coder failed to generate verified SVG"],
                    constraint_graph=constraint_graph,
                    solved_graph=solved_graph,
                    director_iterations=self.director_iterations,
                    coder_iterations=self.coder_iterations,
                    total_time_ms=(time.time() - start_time) * 1000,
                )
            
            # ═══════════════════════════════════════════════════════════════
            # PHASE 5: Renderer (Agent 5)
            # ═══════════════════════════════════════════════════════════════
            render_result = await self._run_renderer(verified_svg)
            
            return OrchestratorResult(
                success=True,
                svg=verified_svg,
                png_url=render_result.get("png_url"),
                webp_url=render_result.get("webp_url"),
                constraint_graph=constraint_graph,
                solved_graph=solved_graph,
                director_iterations=self.director_iterations,
                coder_iterations=self.coder_iterations,
                total_time_ms=(time.time() - start_time) * 1000,
            )
            
        except Exception as e:
            return OrchestratorResult(
                success=False,
                errors=[f"Orchestration error: {str(e)}"],
                director_iterations=self.director_iterations,
                coder_iterations=self.coder_iterations,
                total_time_ms=(time.time() - start_time) * 1000,
            )
    
    async def _run_director_loop(
        self,
        user_prompt: str,
    ) -> Optional[dict]:
        """
        Run Design Director with Layout Solver feedback loop.
        
        Loop continues until:
        - Solver validates the constraint graph
        - Max iterations reached
        """
        from .agents.design_director import DesignDirectorAgent
        from app.solver import ConstraintSolver, LayoutGraph
        
        self.state = OrchestratorState.DIRECTOR
        director = DesignDirectorAgent(
            canvas_width=self.canvas_width,
            canvas_height=self.canvas_height,
            brand_colors=self.brand_colors,
        )
        
        feedback = None
        
        for iteration in range(self.max_director_iterations):
            self.director_iterations = iteration + 1
            
            # Agent 1: Generate constraint graph
            constraint_graph = await director.generate(
                user_prompt=user_prompt,
                feedback=feedback,
            )
            
            if not constraint_graph:
                feedback = "Failed to generate constraint graph. Simplify the design."
                continue
            
            # Agent 2: Validate with Layout Solver
            self.state = OrchestratorState.SOLVER
            
            try:
                layout_graph = LayoutGraph.from_constraint_graph(constraint_graph)
                solver = ConstraintSolver(layout_graph)
                solved = solver.solve()
                
                if solved:
                    # Success! Return the solved graph
                    self._log_message("solver", "coder", "data", {
                        "constraint_graph": constraint_graph,
                        "solved": True,
                    })
                    return constraint_graph
                else:
                    # Solver failed - generate feedback for director
                    feedback = self._generate_solver_feedback(constraint_graph)
                    self._log_message("solver", "director", "feedback", {
                        "error": feedback,
                    })
                    self.state = OrchestratorState.DIRECTOR
                    
            except Exception as e:
                feedback = f"Layout solver error: {str(e)}. Simplify constraints."
                self.state = OrchestratorState.DIRECTOR
        
        return None  # Max iterations reached
    
    async def _run_coder_verifier_loop(
        self,
        solved_graph: dict,
        user_prompt: str,
    ) -> Optional[str]:
        """
        Run SVG Coder with Verifier feedback loop.
        
        The "Design Refinement" loop from the spec.
        """
        from .agents.svg_coder import SVGCoderAgent
        from app.pipeline.verification import VerificationPipeline, VerificationResult
        
        self.state = OrchestratorState.CODER
        coder = SVGCoderAgent(
            canvas_width=self.canvas_width,
            canvas_height=self.canvas_height,
            brand_colors=self.brand_colors,
        )
        
        verifier = VerificationPipeline(
            canvas_width=self.canvas_width,
            canvas_height=self.canvas_height,
            approved_palette=self.brand_colors,
        )
        
        feedback = None
        previous_svg = None
        
        for iteration in range(self.max_coder_iterations):
            self.coder_iterations = iteration + 1
            
            # Agent 3: Generate SVG
            svg = await coder.generate(
                constraint_graph=solved_graph,
                user_prompt=user_prompt,
                feedback=feedback,
                previous_svg=previous_svg,
            )
            
            if not svg:
                feedback = "Failed to generate SVG. Try again with simpler elements."
                continue
            
            # Agent 4: Verify SVG
            self.state = OrchestratorState.VERIFIER
            verification_report = await verifier.verify(svg)
            
            if verification_report.overall == VerificationResult.PASS:
                # Success! Return verified SVG
                self._log_message("verifier", "renderer", "data", {
                    "svg": svg,
                    "verified": True,
                })
                return svg
            else:
                # Verifier failed - generate feedback for coder
                feedback = verification_report.get_refinement_prompt()
                
                # Check for repeated errors
                if feedback == self.last_error:
                    self.repeated_error_count += 1
                    if self.repeated_error_count >= 2:
                        # Diminishing returns - apply safe fallback
                        feedback += "\n\nSAFE FALLBACK: Remove the problematic element entirely."
                else:
                    self.repeated_error_count = 0
                    self.last_error = feedback
                
                self._log_message("verifier", "coder", "feedback", {
                    "error": feedback,
                    "iteration": iteration,
                })
                
                previous_svg = svg
                self.state = OrchestratorState.CODER
        
        return None  # Max iterations reached
    
    async def _run_renderer(self, verified_svg: str) -> dict:
        """
        Run Renderer (Agent 5) to generate final assets.
        """
        from app.render.pipeline import RenderingPipeline
        from app.render.render_job import RenderJob
        
        self.state = OrchestratorState.RENDERER
        
        try:
            pipeline = RenderingPipeline()
            
            # Create render job from SVG
            job = RenderJob.from_svg(
                svg_string=verified_svg,
                width=self.canvas_width,
                height=self.canvas_height,
            )
            
            # Render to multiple formats
            result = await pipeline.render(job)
            
            self.state = OrchestratorState.COMPLETED
            
            return {
                "png_url": result.png_path if hasattr(result, 'png_path') else None,
                "webp_url": result.webp_path if hasattr(result, 'webp_path') else None,
            }
            
        except Exception as e:
            # Fallback: just return the SVG
            self.state = OrchestratorState.COMPLETED
            return {}
    
    def _generate_solver_feedback(self, constraint_graph: dict) -> str:
        """Generate feedback message when solver fails."""
        return (
            "Your design is impossible with the current constraints. "
            "Please simplify: reduce text length, increase spacing, "
            "or change the layout to prevent overlaps."
        )
    
    def _log_message(
        self,
        from_agent: str,
        to_agent: str,
        message_type: str,
        payload: dict,
    ):
        """Log a message between agents."""
        msg = AgentMessage(
            from_agent=from_agent,
            to_agent=to_agent,
            message_type=message_type,
            payload=payload,
        )
        self.message_log.append(msg)

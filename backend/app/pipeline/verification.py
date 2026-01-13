"""
Enhanced Verification Pipeline with Auto-Correction
Implements the validation loop with solver triggers and refinement prompts
"""

from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Callable, Awaitable
import re

from app.validators.svg_validator import SVGValidator
from app.validators.wcag_validator import WCAGValidator
from app.validators.spatial_validator import SpatialValidator
from app.validators.color_validator import ColorValidator
from app.validators.pixel_inspector import PixelInspector, validate_pixels
from app.validators.visual_balance import VisualBalanceAnalyzer
from app.validators.error_report import (
    ValidationReport, ValidationError, ErrorType, Severity
)


class VerificationResult(Enum):
    """Result status for verification layers"""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIPPED = "skipped"
    AUTO_CORRECTED = "auto_corrected"


class FailureAction(Enum):
    """Action to take when a layer fails"""
    REJECT = "reject"           # Return to LLM with error
    TRIGGER_SOLVER = "solver"   # Auto-correct via Layout Solver
    REFINEMENT = "refinement"   # Ask LLM to fix specific properties


@dataclass
class LayerResult:
    """Result of a single verification layer"""
    status: VerificationResult
    errors: list[str]
    action: Optional[FailureAction] = None
    refinement_prompt: Optional[str] = None
    auto_corrected: bool = False


@dataclass
class VerificationReport:
    """Complete verification report with actions"""
    overall: VerificationResult
    layers: dict[str, LayerResult] = field(default_factory=dict)
    timestamp: str = ""
    needs_solver: bool = False
    refinement_prompts: list[str] = field(default_factory=list)
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        """Convert report to dictionary"""
        return {
            "overall": self.overall.value,
            "layers": {
                layer: {
                    "status": result.status.value,
                    "errors": result.errors,
                    "action": result.action.value if result.action else None,
                }
                for layer, result in self.layers.items()
            },
            "timestamp": self.timestamp,
            "needsSolver": self.needs_solver,
            "refinementPrompts": self.refinement_prompts,
        }
    
    def get_refinement_prompt(self) -> str:
        """Generate combined refinement prompt for LLM"""
        if not self.refinement_prompts:
            return ""
        
        return "\n\n".join([
            "VALIDATION ERRORS - Please fix the following issues:",
            *self.refinement_prompts
        ])


class VerificationPipeline:
    """
    Enhanced verification pipeline with auto-correction.
    
    Implements the validation loop:
    1. Syntax → REJECT on fail
    2. Spatial → TRIGGER SOLVER on fail (auto-correct)
    3. Text Readability → REFINEMENT on fail
    4. Color Palette → REFINEMENT on fail
    5. Rendering → REFINEMENT on fail
    """
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        approved_palette: Optional[list[str]] = None,
        min_font_size: int = 14,
        enable_auto_correction: bool = True,
    ):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.approved_palette = approved_palette
        self.min_font_size = min_font_size
        self.enable_auto_correction = enable_auto_correction
        
        # Initialize validators
        self.svg_validator = SVGValidator()
        self.wcag_validator = WCAGValidator()
        self.spatial_validator = SpatialValidator(canvas_width, canvas_height)
        self.color_validator = ColorValidator(approved_palette)
        self.pixel_inspector = PixelInspector()
        self.balance_analyzer = VisualBalanceAnalyzer()
    
    async def verify(
        self,
        svg_string: str,
        rendered_image: Optional[bytes] = None,
    ) -> VerificationReport:
        """
        Run complete verification pipeline with auto-correction triggers.
        
        Args:
            svg_string: The SVG to verify
            rendered_image: Optional pre-rendered image bytes for pixel inspection
            
        Returns:
            VerificationReport with layer results and actions
        """
        report = VerificationReport(overall=VerificationResult.PASS)
        
        # ═══════════════════════════════════════════════════════════════
        # LAYER 1: Syntax Validation
        # Action on fail: REJECT (return to LLM)
        # ═══════════════════════════════════════════════════════════════
        syntax_pass, syntax_errors = self.svg_validator.validate(svg_string)
        
        if not syntax_pass:
            report.layers["syntax"] = LayerResult(
                status=VerificationResult.FAIL,
                errors=syntax_errors,
                action=FailureAction.REJECT,
                refinement_prompt=self._generate_syntax_prompt(syntax_errors),
            )
            report.overall = VerificationResult.FAIL
            report.refinement_prompts.append(report.layers["syntax"].refinement_prompt)
            # Early return - can't continue with invalid SVG
            return report
        
        report.layers["syntax"] = LayerResult(
            status=VerificationResult.PASS,
            errors=[],
        )
        
        # ═══════════════════════════════════════════════════════════════
        # LAYER 2: Spatial Constraints
        # Action on fail: TRIGGER SOLVER (auto-correct)
        # ═══════════════════════════════════════════════════════════════
        spatial_pass, spatial_errors = self.spatial_validator.validate(svg_string)
        
        if not spatial_pass:
            report.layers["spatial"] = LayerResult(
                status=VerificationResult.FAIL,
                errors=spatial_errors,
                action=FailureAction.TRIGGER_SOLVER,
                refinement_prompt=self._generate_spatial_prompt(spatial_errors),
            )
            report.needs_solver = True
            report.overall = VerificationResult.FAIL
            
            if self.enable_auto_correction:
                # Try auto-correction via solver
                corrected = await self._try_auto_correct_spatial(svg_string, spatial_errors)
                if corrected:
                    report.layers["spatial"].status = VerificationResult.AUTO_CORRECTED
                    report.layers["spatial"].auto_corrected = True
                    report.needs_solver = False
        else:
            report.layers["spatial"] = LayerResult(
                status=VerificationResult.PASS,
                errors=[],
            )
        
        # ═══════════════════════════════════════════════════════════════
        # LAYER 3: Text Readability
        # Action on fail: REFINEMENT (ask LLM to fix)
        # ═══════════════════════════════════════════════════════════════
        text_pass, text_errors = self._verify_text_readability(svg_string)
        
        if not text_pass:
            prompt = self._generate_text_prompt(text_errors)
            report.layers["text_readability"] = LayerResult(
                status=VerificationResult.FAIL,
                errors=text_errors,
                action=FailureAction.REFINEMENT,
                refinement_prompt=prompt,
            )
            report.refinement_prompts.append(prompt)
            report.overall = VerificationResult.FAIL
        else:
            report.layers["text_readability"] = LayerResult(
                status=VerificationResult.PASS,
                errors=[],
            )
        
        # ═══════════════════════════════════════════════════════════════
        # LAYER 4: Color Palette
        # Action on fail: REFINEMENT (replace unauthorized colors)
        # ═══════════════════════════════════════════════════════════════
        color_pass, color_errors = self.color_validator.validate(svg_string)
        
        if not color_pass:
            prompt = self._generate_color_prompt(color_errors)
            report.layers["color_palette"] = LayerResult(
                status=VerificationResult.FAIL,
                errors=color_errors,
                action=FailureAction.REFINEMENT,
                refinement_prompt=prompt,
            )
            report.refinement_prompts.append(prompt)
            report.overall = VerificationResult.FAIL
        else:
            report.layers["color_palette"] = LayerResult(
                status=VerificationResult.PASS,
                errors=[],
            )
        
        # ═══════════════════════════════════════════════════════════════
        # LAYER 5: Rendering Test (with pixel inspection)
        # Action on fail: REFINEMENT (debug rendering)
        # ═══════════════════════════════════════════════════════════════
        render_pass, render_errors = await self._verify_rendering(
            svg_string, rendered_image
        )
        
        if not render_pass:
            prompt = self._generate_render_prompt(render_errors)
            report.layers["rendering"] = LayerResult(
                status=VerificationResult.FAIL,
                errors=render_errors,
                action=FailureAction.REFINEMENT,
                refinement_prompt=prompt,
            )
            report.refinement_prompts.append(prompt)
            report.overall = VerificationResult.FAIL
        else:
            report.layers["rendering"] = LayerResult(
                status=VerificationResult.PASS,
                errors=[],
            )
        
        return report
    
    # ═══════════════════════════════════════════════════════════════════
    # Refinement Prompt Generators
    # ═══════════════════════════════════════════════════════════════════
    
    def _generate_syntax_prompt(self, errors: list[str]) -> str:
        """Generate syntax refinement prompt"""
        return f"""[SYNTAX ERROR] The SVG is malformed and cannot be parsed:
{chr(10).join(f"  • {e}" for e in errors)}

Fix: Ensure the SVG is valid XML with proper tag structure."""

    def _generate_spatial_prompt(self, errors: list[str]) -> str:
        """Generate spatial refinement prompt"""
        return f"""[SPATIAL ERROR] Layout constraints violated:
{chr(10).join(f"  • {e}" for e in errors)}

Fix: Adjust element positions to stay within canvas ({self.canvas_width}x{self.canvas_height}) and prevent overlaps."""

    def _generate_text_prompt(self, errors: list[str]) -> str:
        """Generate text readability refinement prompt"""
        return f"""[READABILITY ERROR] Text accessibility issues:
{chr(10).join(f"  • {e}" for e in errors)}

Fix: Increase font size (min {self.min_font_size}px) or adjust colors for WCAG 4.5:1 contrast."""

    def _generate_color_prompt(self, errors: list[str]) -> str:
        """Generate color palette refinement prompt"""
        palette_str = ", ".join(self.approved_palette or ["no palette defined"])
        return f"""[COLOR ERROR] Unauthorized colors detected:
{chr(10).join(f"  • {e}" for e in errors)}

Fix: Use only approved palette colors: {palette_str}"""

    def _generate_render_prompt(self, errors: list[str]) -> str:
        """Generate rendering refinement prompt"""
        return f"""[RENDER ERROR] Visual output issues:
{chr(10).join(f"  • {e}" for e in errors)}

Fix: Ensure elements are visible (not transparent/white-on-white) and properly sized."""

    # ═══════════════════════════════════════════════════════════════════
    # Verification Layer Implementations
    # ═══════════════════════════════════════════════════════════════════
    
    def _verify_text_readability(self, svg_string: str) -> tuple[bool, list[str]]:
        """Check font size and contrast"""
        errors = []
        
        # Check font sizes
        font_size_pattern = r'font-size[=:]\s*["\']?(\d+)'
        sizes = re.findall(font_size_pattern, svg_string)
        
        for size_str in sizes:
            size = int(size_str)
            if size < self.min_font_size:
                errors.append(f"Font size {size}px is below minimum ({self.min_font_size}px)")
        
        # Check contrast
        bg_color = self._extract_background_color(svg_string)
        contrast_pass, contrast_errors = self.wcag_validator.validate_svg_contrast(
            svg_string, bg_color
        )
        errors.extend(contrast_errors)
        
        return len(errors) == 0, errors
    
    def _extract_background_color(self, svg_string: str) -> str:
        """Extract dominant background color from SVG"""
        rect_pattern = r'<rect[^>]*fill=["\']([^"\']+)["\']'
        match = re.search(rect_pattern, svg_string)
        return match.group(1) if match else "#FFFFFF"
    
    async def _verify_rendering(
        self,
        svg_string: str,
        rendered_image: Optional[bytes] = None,
    ) -> tuple[bool, list[str]]:
        """Verify rendering with pixel inspection"""
        errors = []
        
        # Check SVG dimensions
        try:
            dimensions = self.svg_validator.extract_dimensions(svg_string)
            width, height = dimensions
            
            if width != self.canvas_width:
                errors.append(f"Width mismatch: {width}px vs expected {self.canvas_width}px")
            if height != self.canvas_height:
                errors.append(f"Height mismatch: {height}px vs expected {self.canvas_height}px")
        except Exception as e:
            errors.append(f"Dimension extraction failed: {str(e)}")
        
        # Check for empty SVG
        has_content = any(elem in svg_string for elem in ['<rect', '<text', '<path', '<image'])
        if not has_content:
            errors.append("SVG has no visual elements")
        
        # Pixel inspection (if image provided)
        if rendered_image:
            pixel_pass, pixel_errors = validate_pixels(image_bytes=rendered_image)
            for err in pixel_errors:
                errors.append(err.message)
        
        return len(errors) == 0, errors
    
    async def _try_auto_correct_spatial(
        self,
        svg_string: str,
        errors: list[str],
    ) -> bool:
        """
        Try to auto-correct spatial errors using Layout Solver.
        
        Returns True if correction was successful.
        """
        try:
            from app.solver.relaxation import solve_layout
            
            # Extract constraint graph from SVG (simplified)
            # In production, this would parse the SVG to build a proper constraint graph
            # For now, return False to indicate solver should be triggered externally
            
            # TODO: Implement full SVG → ConstraintGraph → Solver → SVG pipeline
            return False
            
        except ImportError:
            return False
        except Exception:
            return False


# Convenience function
async def verify_svg(
    svg_string: str,
    canvas_width: int = 1200,
    canvas_height: int = 630,
    approved_palette: Optional[list[str]] = None,
) -> VerificationReport:
    """Quick verification function"""
    pipeline = VerificationPipeline(
        canvas_width=canvas_width,
        canvas_height=canvas_height,
        approved_palette=approved_palette,
    )
    return await pipeline.verify(svg_string)

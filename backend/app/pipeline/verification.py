"""
Multi-Layer Verification Pipeline
Orchestrates all 5 verification layers
"""

from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import re

from app.validators.svg_validator import SVGValidator
from app.validators.wcag_validator import WCAGValidator
from app.validators.spatial_validator import SpatialValidator
from app.validators.color_validator import ColorValidator


class VerificationResult(Enum):
    """Result status for verification layers"""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    SKIPPED = "skipped"


@dataclass
class VerificationReport:
    """Complete verification report"""
    overall: VerificationResult
    layers: dict[str, tuple[VerificationResult, list[str]]] = field(default_factory=dict)
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        """Convert report to dictionary"""
        return {
            "overall": self.overall.value,
            "layers": {
                layer: {"status": result.value, "errors": errors}
                for layer, (result, errors) in self.layers.items()
            },
            "timestamp": self.timestamp,
        }


class VerificationPipeline:
    """Execute all verification layers in sequence"""
    
    def __init__(
        self,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        approved_palette: Optional[list[str]] = None,
        min_font_size: int = 14,
    ):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.approved_palette = approved_palette
        self.min_font_size = min_font_size
        
        # Initialize validators
        self.svg_validator = SVGValidator()
        self.wcag_validator = WCAGValidator()
        self.spatial_validator = SpatialValidator(canvas_width, canvas_height)
        self.color_validator = ColorValidator(approved_palette)
    
    async def verify(self, svg_string: str) -> VerificationReport:
        """
        Run complete verification pipeline.
        
        5 Layers:
        1. Syntax - Valid SVG XML
        2. Spatial - Bounds and overlaps
        3. Text Readability - Font size and contrast
        4. Color Palette - Approved colors only
        5. Rendering - Final visual check
        """
        layers: dict[str, tuple[VerificationResult, list[str]]] = {}
        
        # Layer 1: Syntax Validation
        syntax_pass, syntax_errors = self.svg_validator.validate(svg_string)
        layers["syntax"] = (
            VerificationResult.PASS if syntax_pass else VerificationResult.FAIL,
            syntax_errors
        )
        
        # If syntax fails, stop here
        if not syntax_pass:
            return VerificationReport(
                overall=VerificationResult.FAIL,
                layers=layers,
            )
        
        # Layer 2: Spatial Constraints
        spatial_pass, spatial_errors = self.spatial_validator.validate(svg_string)
        layers["spatial"] = (
            VerificationResult.PASS if spatial_pass else VerificationResult.FAIL,
            spatial_errors
        )
        
        # Layer 3: Text Readability
        text_pass, text_errors = self._verify_text_readability(svg_string)
        layers["text_readability"] = (
            VerificationResult.PASS if text_pass else VerificationResult.FAIL,
            text_errors
        )
        
        # Layer 4: Color Palette
        color_pass, color_errors = self.color_validator.validate(svg_string)
        layers["color_palette"] = (
            VerificationResult.PASS if color_pass else VerificationResult.FAIL,
            color_errors
        )
        
        # Layer 5: Rendering Test (simplified for now)
        render_pass, render_errors = await self._verify_rendering(svg_string)
        layers["rendering"] = (
            VerificationResult.PASS if render_pass else VerificationResult.FAIL,
            render_errors
        )
        
        # Calculate overall result
        all_pass = all(
            result == VerificationResult.PASS
            for result, _ in layers.values()
        )
        
        return VerificationReport(
            overall=VerificationResult.PASS if all_pass else VerificationResult.FAIL,
            layers=layers,
        )
    
    def _verify_text_readability(self, svg_string: str) -> tuple[bool, list[str]]:
        """Check font size and contrast"""
        errors = []
        
        # Check font sizes
        font_size_pattern = r'font-size[=:]\s*["\']?(\d+)'
        sizes = re.findall(font_size_pattern, svg_string)
        
        for size_str in sizes:
            size = int(size_str)
            if size < self.min_font_size:
                errors.append(f"Text font-size too small: {size}px (minimum {self.min_font_size}px)")
        
        # Check contrast using WCAG validator
        # Detect background color from SVG (simplified)
        bg_color = self._extract_background_color(svg_string)
        contrast_pass, contrast_errors = self.wcag_validator.validate_svg_contrast(
            svg_string, bg_color
        )
        errors.extend(contrast_errors)
        
        return len(errors) == 0, errors
    
    def _extract_background_color(self, svg_string: str) -> str:
        """Extract dominant background color from SVG"""
        # Look for first rect that might be a background
        rect_pattern = r'<rect[^>]*fill=["\']([^"\']+)["\'][^>]*width=["\']100%["\']'
        match = re.search(rect_pattern, svg_string)
        if match:
            return match.group(1)
        
        # Look for first rect fill
        rect_pattern = r'<rect[^>]*fill=["\']([^"\']+)["\']'
        match = re.search(rect_pattern, svg_string)
        if match:
            return match.group(1)
        
        # Default to white
        return "#FFFFFF"
    
    async def _verify_rendering(self, svg_string: str) -> tuple[bool, list[str]]:
        """
        Render SVG and check output.
        
        For now, this is a simplified check. In production,
        we would use cairosvg to actually render and verify.
        """
        errors = []
        
        try:
            # Check SVG dimensions match expected
            dimensions = self.svg_validator.extract_dimensions(svg_string)
            width, height = dimensions
            
            if width != self.canvas_width:
                errors.append(
                    f"SVG width mismatch: expected {self.canvas_width}px, got {width}px"
                )
            
            if height != self.canvas_height:
                errors.append(
                    f"SVG height mismatch: expected {self.canvas_height}px, got {height}px"
                )
            
            # Check for empty SVG (no children)
            if '<rect' not in svg_string and '<text' not in svg_string and '<path' not in svg_string:
                errors.append("SVG appears to be empty (no visual elements)")
            
        except Exception as e:
            errors.append(f"Rendering verification error: {str(e)}")
        
        return len(errors) == 0, errors

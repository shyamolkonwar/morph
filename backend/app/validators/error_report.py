"""
Structured Error Report
Machine-readable validation errors for AI refinement
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Any
import json


class ErrorType(str, Enum):
    """Types of validation errors"""
    # Layout errors
    OUT_OF_BOUNDS = "out_of_bounds"
    ILLEGAL_OVERLAP = "illegal_overlap"
    UNBALANCED_LAYOUT = "unbalanced_layout"
    
    # Readability errors
    LOW_CONTRAST = "low_contrast"
    TEXT_TOO_SMALL = "text_too_small"
    MISSING_TEXT = "missing_text"
    
    # Render errors
    BLANK_CANVAS = "blank_canvas"
    RENDER_ARTIFACT = "render_artifact"
    FONT_ERROR = "font_error"
    
    # Structure errors
    INVALID_SVG = "invalid_svg"
    INVALID_CONSTRAINT = "invalid_constraint"
    COLOR_VIOLATION = "color_violation"


class Severity(str, Enum):
    """Error severity levels"""
    CRITICAL = "critical"  # Must fix before rendering
    ERROR = "error"        # Should fix for quality
    WARNING = "warning"    # Recommend fixing


@dataclass
class ValidationError:
    """
    A single validation error with machine-readable details.
    
    Designed to be fed back to the AI agent for refinement.
    """
    error_type: ErrorType
    severity: Severity
    message: str
    
    # Location information
    element_id: Optional[str] = None
    element_type: Optional[str] = None
    location: Optional[dict] = None  # {x, y, width, height}
    
    # Values for AI refinement
    current_value: Optional[Any] = None
    required_value: Optional[Any] = None
    suggestion: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "type": self.error_type.value,
            "severity": self.severity.value,
            "message": self.message,
            "elementId": self.element_id,
            "elementType": self.element_type,
            "location": self.location,
            "currentValue": self.current_value,
            "requiredValue": self.required_value,
            "suggestion": self.suggestion,
        }
    
    def to_prompt(self) -> str:
        """Convert to prompt format for AI refinement"""
        parts = [f"ERROR [{self.error_type.value}]: {self.message}"]
        
        if self.element_id:
            parts.append(f"  Element: {self.element_id}")
        if self.location:
            parts.append(f"  Location: ({self.location.get('x', 0)}, {self.location.get('y', 0)})")
        if self.current_value is not None:
            parts.append(f"  Current: {self.current_value}")
        if self.required_value is not None:
            parts.append(f"  Required: {self.required_value}")
        if self.suggestion:
            parts.append(f"  Suggestion: {self.suggestion}")
        
        return "\n".join(parts)


@dataclass
class ValidationReport:
    """
    Complete validation report with all errors.
    """
    passed: bool
    errors: list[ValidationError] = field(default_factory=list)
    warnings: list[ValidationError] = field(default_factory=list)
    
    # Layer results
    layer_results: dict[str, bool] = field(default_factory=dict)
    
    # Timing
    validation_time_ms: float = 0.0
    
    def add_error(self, error: ValidationError) -> None:
        """Add an error to the report"""
        if error.severity == Severity.WARNING:
            self.warnings.append(error)
        else:
            self.errors.append(error)
            self.passed = False
    
    def get_critical_errors(self) -> list[ValidationError]:
        """Get only critical errors"""
        return [e for e in self.errors if e.severity == Severity.CRITICAL]
    
    def to_dict(self) -> dict:
        return {
            "passed": self.passed,
            "errorCount": len(self.errors),
            "warningCount": len(self.warnings),
            "errors": [e.to_dict() for e in self.errors],
            "warnings": [e.to_dict() for e in self.warnings],
            "layerResults": self.layer_results,
            "validationTimeMs": self.validation_time_ms,
        }
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2)
    
    def to_refinement_prompt(self) -> str:
        """
        Generate a prompt for AI refinement.
        
        Returns a structured error summary suitable for the Layout Engineer.
        """
        if self.passed:
            return "VALIDATION: All checks passed. No errors found."
        
        lines = [
            f"VALIDATION FAILED: {len(self.errors)} errors, {len(self.warnings)} warnings",
            "",
            "ERRORS TO FIX:"
        ]
        
        for i, error in enumerate(self.errors, 1):
            lines.append(f"{i}. {error.to_prompt()}")
            lines.append("")
        
        if self.warnings:
            lines.append("WARNINGS (optional fixes):")
            for warning in self.warnings:
                lines.append(f"- {warning.message}")
        
        return "\n".join(lines)


# Factory functions for common errors
def create_contrast_error(
    element_id: str,
    current_ratio: float,
    required_ratio: float = 4.5,
    foreground: str = "",
    background: str = "",
) -> ValidationError:
    """Create a contrast error"""
    return ValidationError(
        error_type=ErrorType.LOW_CONTRAST,
        severity=Severity.ERROR,
        message=f"Text '{element_id}' has insufficient contrast ({current_ratio:.1f}:1)",
        element_id=element_id,
        current_value=current_ratio,
        required_value=required_ratio,
        suggestion=f"Increase contrast by darkening text or lightening background. "
                   f"Current: {foreground} on {background}",
    )


def create_overlap_error(
    element_a: str,
    element_b: str,
    overlap_area: Optional[dict] = None,
) -> ValidationError:
    """Create an overlap error"""
    return ValidationError(
        error_type=ErrorType.ILLEGAL_OVERLAP,
        severity=Severity.ERROR,
        message=f"Elements '{element_a}' and '{element_b}' overlap illegally",
        element_id=element_a,
        location=overlap_area,
        suggestion=f"Move '{element_b}' or adjust spacing to prevent overlap",
    )


def create_bounds_error(
    element_id: str,
    location: dict,
    canvas_width: int,
    canvas_height: int,
) -> ValidationError:
    """Create an out of bounds error"""
    return ValidationError(
        error_type=ErrorType.OUT_OF_BOUNDS,
        severity=Severity.CRITICAL,
        message=f"Element '{element_id}' extends outside canvas bounds",
        element_id=element_id,
        location=location,
        required_value={"width": canvas_width, "height": canvas_height},
        suggestion=f"Move element inside canvas ({canvas_width}x{canvas_height})",
    )


def create_blank_canvas_error() -> ValidationError:
    """Create a blank canvas error"""
    return ValidationError(
        error_type=ErrorType.BLANK_CANVAS,
        severity=Severity.CRITICAL,
        message="Rendered image appears blank or nearly empty",
        suggestion="Check that elements have visible colors and are not transparent",
    )


def create_balance_warning(
    center_x: float,
    center_y: float,
    ideal_x: float,
    ideal_y: float,
) -> ValidationError:
    """Create an unbalanced layout warning"""
    offset_x = abs(center_x - ideal_x)
    offset_y = abs(center_y - ideal_y)
    
    return ValidationError(
        error_type=ErrorType.UNBALANCED_LAYOUT,
        severity=Severity.WARNING,
        message=f"Layout appears unbalanced (center of mass offset by {offset_x:.0f}px, {offset_y:.0f}px)",
        current_value={"centerX": center_x, "centerY": center_y},
        required_value={"centerX": ideal_x, "centerY": ideal_y},
        suggestion="Redistribute elements for better visual balance",
    )

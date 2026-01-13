"""
Validators Package
Enhanced verification layer with 7 validators
"""

from app.validators.svg_validator import SVGValidator
from app.validators.wcag_validator import WCAGValidator
from app.validators.constraint_graph import ConstraintGraphValidator
from app.validators.spatial_validator import SpatialValidator
from app.validators.color_validator import ColorValidator
from app.validators.pixel_inspector import PixelInspector, validate_pixels
from app.validators.visual_balance import VisualBalanceAnalyzer, validate_balance
from app.validators.error_report import (
    ValidationError, ValidationReport, ErrorType, Severity,
    create_contrast_error, create_overlap_error, create_bounds_error,
    create_blank_canvas_error, create_balance_warning
)

__all__ = [
    # Core validators
    "SVGValidator",
    "WCAGValidator",
    "ConstraintGraphValidator",
    "SpatialValidator",
    "ColorValidator",
    # Pixel analysis
    "PixelInspector",
    "validate_pixels",
    # Visual balance
    "VisualBalanceAnalyzer",
    "validate_balance",
    # Error reporting
    "ValidationError",
    "ValidationReport",
    "ErrorType",
    "Severity",
]


"""
Visual Balance Analyzer
Analyze layout balance and visual weight distribution
"""

from dataclasses import dataclass
from typing import Optional, Tuple
import io

try:
    from PIL import Image
    import numpy as np
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

from .error_report import ValidationError, ErrorType, Severity, create_balance_warning


@dataclass
class BalanceAnalysis:
    """Results of visual balance analysis"""
    center_x: float
    center_y: float
    ideal_center_x: float
    ideal_center_y: float
    offset_ratio: float  # 0 = perfectly centered, 1 = at edge
    is_balanced: bool
    quadrant_weights: dict  # NW, NE, SW, SE weights
    edge_density: float


class VisualBalanceAnalyzer:
    """
    Analyze visual balance and weight distribution.
    
    Uses edge detection and luminance analysis to find
    the "visual center of mass" of a design.
    """
    
    def __init__(
        self,
        balance_threshold: float = 0.25,  # Max offset ratio for balanced
    ):
        self.balance_threshold = balance_threshold
    
    def analyze_image(self, image_bytes: bytes) -> BalanceAnalysis:
        """
        Analyze visual balance of an image.
        
        Args:
            image_bytes: PNG/JPEG/WebP image bytes
            
        Returns:
            BalanceAnalysis with center of mass and balance metrics
        """
        if not PILLOW_AVAILABLE:
            return self._default_analysis()
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            
            # Convert to grayscale
            gray = image.convert('L')
            pixels = np.array(gray, dtype=float)
            
            # Invert so darker = higher weight (text/content typically darker)
            pixels = 255 - pixels
            
            # Calculate center of mass
            total_weight = np.sum(pixels)
            
            if total_weight == 0:
                # Completely white image
                return self._default_analysis(width, height)
            
            # Weighted coordinates
            y_coords, x_coords = np.mgrid[0:height, 0:width]
            center_x = np.sum(x_coords * pixels) / total_weight
            center_y = np.sum(y_coords * pixels) / total_weight
            
            # Ideal center
            ideal_x = width / 2
            ideal_y = height / 2
            
            # Calculate offset ratio
            max_offset = np.sqrt(ideal_x**2 + ideal_y**2)
            actual_offset = np.sqrt((center_x - ideal_x)**2 + (center_y - ideal_y)**2)
            offset_ratio = actual_offset / max_offset if max_offset > 0 else 0
            
            # Quadrant analysis
            quadrant_weights = self._analyze_quadrants(pixels, width, height)
            
            # Edge density
            edge_density = self._calculate_edge_density(gray)
            
            return BalanceAnalysis(
                center_x=float(center_x),
                center_y=float(center_y),
                ideal_center_x=ideal_x,
                ideal_center_y=ideal_y,
                offset_ratio=float(offset_ratio),
                is_balanced=offset_ratio <= self.balance_threshold,
                quadrant_weights=quadrant_weights,
                edge_density=edge_density,
            )
            
        except Exception as e:
            return self._default_analysis()
    
    def _default_analysis(
        self,
        width: int = 1200,
        height: int = 630
    ) -> BalanceAnalysis:
        """Return default/fallback analysis"""
        return BalanceAnalysis(
            center_x=width / 2,
            center_y=height / 2,
            ideal_center_x=width / 2,
            ideal_center_y=height / 2,
            offset_ratio=0.0,
            is_balanced=True,
            quadrant_weights={"NW": 0.25, "NE": 0.25, "SW": 0.25, "SE": 0.25},
            edge_density=0.0,
        )
    
    def _analyze_quadrants(
        self,
        pixels: "np.ndarray",
        width: int,
        height: int
    ) -> dict:
        """Calculate weight distribution across quadrants"""
        mid_x = width // 2
        mid_y = height // 2
        
        nw = np.sum(pixels[:mid_y, :mid_x])
        ne = np.sum(pixels[:mid_y, mid_x:])
        sw = np.sum(pixels[mid_y:, :mid_x])
        se = np.sum(pixels[mid_y:, mid_x:])
        
        total = nw + ne + sw + se
        if total == 0:
            return {"NW": 0.25, "NE": 0.25, "SW": 0.25, "SE": 0.25}
        
        return {
            "NW": float(nw / total),
            "NE": float(ne / total),
            "SW": float(sw / total),
            "SE": float(se / total),
        }
    
    def _calculate_edge_density(self, gray_image: Image.Image) -> float:
        """Calculate edge density using simple gradient"""
        if not PILLOW_AVAILABLE:
            return 0.0
        
        try:
            # Simple edge detection using Sobel-like approach
            pixels = np.array(gray_image, dtype=float)
            
            # Calculate gradients
            dx = np.diff(pixels, axis=1)
            dy = np.diff(pixels, axis=0)
            
            # Edge magnitude
            edges_x = np.abs(dx).mean()
            edges_y = np.abs(dy).mean()
            
            return float(edges_x + edges_y)
            
        except Exception:
            return 0.0
    
    def validate(
        self,
        image_bytes: bytes,
    ) -> Tuple[bool, list[ValidationError]]:
        """
        Validate image for visual balance.
        
        Args:
            image_bytes: Rendered image bytes
            
        Returns:
            (passed, list of errors/warnings)
        """
        analysis = self.analyze_image(image_bytes)
        errors = []
        
        if not analysis.is_balanced:
            errors.append(create_balance_warning(
                center_x=analysis.center_x,
                center_y=analysis.center_y,
                ideal_x=analysis.ideal_center_x,
                ideal_y=analysis.ideal_center_y,
            ))
        
        # Check quadrant imbalance
        weights = analysis.quadrant_weights
        max_weight = max(weights.values())
        min_weight = min(weights.values())
        
        if max_weight > 0.5 and min_weight < 0.1:
            # Severely unbalanced - one quadrant has most content
            dominant = max(weights, key=weights.get)
            errors.append(ValidationError(
                error_type=ErrorType.UNBALANCED_LAYOUT,
                severity=Severity.WARNING,
                message=f"Content heavily concentrated in {dominant} quadrant ({max_weight*100:.0f}%)",
                current_value=weights,
                suggestion="Distribute content more evenly across the canvas",
            ))
        
        # Balance check is a warning, not a failure
        return True, errors


def validate_balance(image_bytes: bytes) -> Tuple[bool, list[ValidationError]]:
    """Convenience function for balance validation"""
    analyzer = VisualBalanceAnalyzer()
    return analyzer.validate(image_bytes)

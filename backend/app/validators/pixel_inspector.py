"""
Pixel Inspector
Analyze rendered bitmaps for blank canvases and render artifacts
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

from .error_report import (
    ValidationError, ErrorType, Severity,
    create_blank_canvas_error
)


@dataclass
class PixelAnalysis:
    """Results of pixel analysis"""
    is_blank: bool
    dominant_color: Optional[Tuple[int, int, int]] = None
    dominant_percentage: float = 0.0
    unique_colors: int = 0
    variance: float = 0.0
    has_artifacts: bool = False
    analysis_details: dict = None


class PixelInspector:
    """
    Analyze rendered images for visual issues.
    
    Detects:
    - Blank canvases (>98% single color)
    - Render artifacts (noise, corruption)
    - Color distribution issues
    """
    
    def __init__(
        self,
        blank_threshold: float = 0.98,
        artifact_variance_min: float = 0.1,
        artifact_variance_max: float = 10000.0,
    ):
        self.blank_threshold = blank_threshold
        self.artifact_variance_min = artifact_variance_min
        self.artifact_variance_max = artifact_variance_max
    
    def analyze_image(self, image_bytes: bytes) -> PixelAnalysis:
        """
        Analyze an image for issues.
        
        Args:
            image_bytes: PNG/JPEG/WebP image bytes
            
        Returns:
            PixelAnalysis with detection results
        """
        if not PILLOW_AVAILABLE:
            return PixelAnalysis(
                is_blank=False,
                analysis_details={"error": "Pillow not installed"}
            )
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to thumbnail for faster analysis
            thumb_size = (100, 100)
            thumb = image.copy()
            thumb.thumbnail(thumb_size)
            
            # Convert to numpy array
            pixels = np.array(thumb)
            
            # Flatten to pixel array
            flat_pixels = pixels.reshape(-1, 3)
            
            # Calculate color histogram
            unique_colors = len(np.unique(flat_pixels, axis=0))
            
            # Find dominant color
            dominant, dominant_count = self._find_dominant_color(flat_pixels)
            total_pixels = len(flat_pixels)
            dominant_percentage = dominant_count / total_pixels
            
            # Calculate variance
            variance = np.var(flat_pixels)
            
            # Check for blank
            is_blank = dominant_percentage >= self.blank_threshold
            
            # Check for artifacts (extremely low or high variance)
            has_artifacts = (
                variance < self.artifact_variance_min or
                variance > self.artifact_variance_max
            )
            
            return PixelAnalysis(
                is_blank=is_blank,
                dominant_color=tuple(dominant),
                dominant_percentage=dominant_percentage,
                unique_colors=unique_colors,
                variance=float(variance),
                has_artifacts=has_artifacts and not is_blank,
                analysis_details={
                    "imageSize": image.size,
                    "mode": image.mode,
                    "thumbSize": thumb.size,
                }
            )
            
        except Exception as e:
            return PixelAnalysis(
                is_blank=False,
                analysis_details={"error": str(e)}
            )
    
    def _find_dominant_color(
        self,
        pixels: "np.ndarray"
    ) -> Tuple["np.ndarray", int]:
        """Find the most common color in pixel array"""
        # Quantize colors to reduce unique count
        quantized = (pixels // 16) * 16
        
        # Find unique colors and counts
        unique, counts = np.unique(quantized, axis=0, return_counts=True)
        
        # Get dominant color
        max_idx = np.argmax(counts)
        return unique[max_idx], counts[max_idx]
    
    def analyze_svg(self, svg_string: str) -> PixelAnalysis:
        """
        Render SVG and analyze the result.
        
        Args:
            svg_string: SVG code
            
        Returns:
            PixelAnalysis
        """
        try:
            import cairosvg
            
            # Render SVG to PNG bytes
            png_bytes = cairosvg.svg2png(
                bytestring=svg_string.encode('utf-8'),
                output_width=100,
                output_height=100,
            )
            
            return self.analyze_image(png_bytes)
            
        except (ImportError, OSError):
            # CairoSVG not available
            return PixelAnalysis(
                is_blank=False,
                analysis_details={"error": "CairoSVG not available"}
            )
        except Exception as e:
            return PixelAnalysis(
                is_blank=False,
                analysis_details={"error": str(e)}
            )
    
    def validate(
        self,
        image_bytes: Optional[bytes] = None,
        svg_string: Optional[str] = None,
    ) -> Tuple[bool, list[ValidationError]]:
        """
        Validate image for render issues.
        
        Args:
            image_bytes: Pre-rendered image bytes
            svg_string: SVG code to render and analyze
            
        Returns:
            (passed, list of errors)
        """
        errors = []
        
        # Get analysis
        if image_bytes:
            analysis = self.analyze_image(image_bytes)
        elif svg_string:
            analysis = self.analyze_svg(svg_string)
        else:
            return True, []
        
        # Check for blank canvas
        if analysis.is_blank:
            errors.append(ValidationError(
                error_type=ErrorType.BLANK_CANVAS,
                severity=Severity.CRITICAL,
                message=f"Rendered image appears blank ({analysis.dominant_percentage*100:.1f}% single color)",
                current_value={
                    "dominantColor": analysis.dominant_color,
                    "coverage": analysis.dominant_percentage,
                },
                suggestion="Ensure elements have visible colors and are properly positioned",
            ))
        
        # Check for artifacts
        if analysis.has_artifacts:
            if analysis.variance < self.artifact_variance_min:
                errors.append(ValidationError(
                    error_type=ErrorType.RENDER_ARTIFACT,
                    severity=Severity.ERROR,
                    message="Image has extremely low variance (flat rendering)",
                    current_value={"variance": analysis.variance},
                    suggestion="Check for missing elements or rendering issues",
                ))
            else:
                errors.append(ValidationError(
                    error_type=ErrorType.RENDER_ARTIFACT,
                    severity=Severity.ERROR,
                    message="Image has extremely high variance (possible corruption)",
                    current_value={"variance": analysis.variance},
                    suggestion="Check for font issues or corrupted assets",
                ))
        
        return len(errors) == 0, errors


def validate_pixels(
    image_bytes: Optional[bytes] = None,
    svg_string: Optional[str] = None,
) -> Tuple[bool, list[ValidationError]]:
    """Convenience function for pixel validation"""
    inspector = PixelInspector()
    return inspector.validate(image_bytes=image_bytes, svg_string=svg_string)

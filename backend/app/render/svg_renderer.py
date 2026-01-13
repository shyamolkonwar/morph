"""
SVG Renderer
Converts SVG to PNG/WebP using cairosvg
"""

import base64
from typing import Optional
from io import BytesIO

try:
    import cairosvg
    CAIROSVG_AVAILABLE = True
except ImportError:
    CAIROSVG_AVAILABLE = False


class SVGRenderer:
    """Render SVG to multiple formats"""
    
    def __init__(self, width: int = 1200, height: int = 630):
        self.width = width
        self.height = height
    
    async def render(
        self,
        svg_string: str,
        output_formats: Optional[list[str]] = None
    ) -> dict[str, bytes]:
        """
        Render SVG to multiple formats.
        
        Args:
            svg_string: Raw SVG string
            output_formats: List of formats (png, webp, pdf)
            
        Returns:
            Dict mapping format to bytes
        """
        if output_formats is None:
            output_formats = ["png"]
        
        outputs = {}
        
        if not CAIROSVG_AVAILABLE:
            # Return SVG as fallback
            outputs["svg"] = svg_string.encode('utf-8')
            return outputs
        
        try:
            for fmt in output_formats:
                if fmt == "png":
                    outputs["png"] = cairosvg.svg2png(
                        bytestring=svg_string.encode('utf-8'),
                        output_width=self.width,
                        output_height=self.height,
                    )
                elif fmt == "pdf":
                    outputs["pdf"] = cairosvg.svg2pdf(
                        bytestring=svg_string.encode('utf-8'),
                        output_width=self.width,
                        output_height=self.height,
                    )
            
            return outputs
            
        except Exception as e:
            raise RenderingError(f"Failed to render SVG: {str(e)}")
    
    async def render_to_base64(
        self,
        svg_string: str,
        fmt: str = "png"
    ) -> str:
        """
        Render SVG and return as base64 string.
        
        Args:
            svg_string: Raw SVG string
            fmt: Output format (png, pdf)
            
        Returns:
            Base64 encoded string
        """
        outputs = await self.render(svg_string, [fmt])
        
        if fmt in outputs:
            return base64.b64encode(outputs[fmt]).decode('utf-8')
        
        # Fallback to SVG
        return base64.b64encode(svg_string.encode('utf-8')).decode('utf-8')
    
    def svg_to_data_url(self, svg_string: str) -> str:
        """Convert SVG to data URL for embedding"""
        encoded = base64.b64encode(svg_string.encode('utf-8')).decode('utf-8')
        return f"data:image/svg+xml;base64,{encoded}"


class RenderingError(Exception):
    """Raised when rendering fails"""
    pass


async def export_design(svg_string: str, output_dir: str) -> dict[str, str]:
    """
    Export design to multiple formats.
    
    Args:
        svg_string: Raw SVG string
        output_dir: Directory to save files
        
    Returns:
        Dict mapping format to file path
    """
    import os
    
    renderer = SVGRenderer()
    outputs = await renderer.render(svg_string, ["png"])
    
    paths = {}
    
    # Always save SVG
    svg_path = os.path.join(output_dir, "design.svg")
    with open(svg_path, "w") as f:
        f.write(svg_string)
    paths["svg"] = svg_path
    
    # Save other formats
    for fmt, data in outputs.items():
        if fmt != "svg":
            file_path = os.path.join(output_dir, f"design.{fmt}")
            with open(file_path, "wb") as f:
                f.write(data)
            paths[fmt] = file_path
    
    return paths

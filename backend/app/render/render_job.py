"""
Render Job Interface
Standardized input/output contracts for the rendering pipeline
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class LayerType(str, Enum):
    """Types of render layers"""
    TEXT = "text"
    IMAGE = "image"
    RECT = "rect"
    PATH = "path"
    GRADIENT = "gradient"
    CONTAINER = "container"


@dataclass
class LayerStyle:
    """Styling properties for a layer"""
    fill: Optional[str] = None  # Color (hex, rgb, gradient ID)
    stroke: Optional[str] = None
    stroke_width: float = 0
    opacity: float = 1.0
    corner_radius: float = 0
    shadow: Optional[dict] = None  # {color, blur, offsetX, offsetY}
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    font_weight: Optional[str] = None
    text_align: str = "left"
    line_height: float = 1.2
    
    # CSS-only properties (trigger Playwright fallback)
    backdrop_filter: Optional[str] = None
    mix_blend_mode: Optional[str] = None
    css_grid: Optional[dict] = None


@dataclass
class RenderLayer:
    """A single layer in the render job"""
    id: str
    type: LayerType
    x: int = 0
    y: int = 0
    width: int = 0
    height: int = 0
    content: Optional[str] = None  # Text string or image source
    styles: LayerStyle = field(default_factory=LayerStyle)
    z_index: int = 0
    
    def requires_browser_render(self) -> bool:
        """Check if this layer needs browser-based rendering"""
        return any([
            self.styles.backdrop_filter,
            self.styles.mix_blend_mode,
            self.styles.css_grid,
        ])


@dataclass
class CanvasConfig:
    """Canvas configuration"""
    width: int = 1200
    height: int = 630
    pixel_density: float = 1.0  # 2.0 for Retina
    background_color: str = "#FFFFFF"


@dataclass
class AssetReference:
    """Reference to an external asset"""
    id: str
    url: Optional[str] = None
    base64: Optional[str] = None
    local_path: Optional[str] = None
    type: str = "image"  # image, font


@dataclass
class RenderJob:
    """
    Complete render job specification.
    
    This is the input contract for the rendering pipeline.
    """
    canvas: CanvasConfig
    layers: list[RenderLayer] = field(default_factory=list)
    assets: list[AssetReference] = field(default_factory=list)
    
    # Metadata
    job_id: Optional[str] = None
    priority: int = 1  # 1 = normal, 2 = high
    
    # Output configuration
    output_formats: list[str] = field(default_factory=lambda: ["png"])
    
    def requires_browser_render(self) -> bool:
        """Check if any layer requires browser-based rendering"""
        return any(layer.requires_browser_render() for layer in self.layers)
    
    def get_sorted_layers(self) -> list[RenderLayer]:
        """Get layers sorted by z-index (background first)"""
        return sorted(self.layers, key=lambda l: l.z_index)
    
    @classmethod
    def from_solved_layout(
        cls,
        layout: dict,
        canvas_width: int = 1200,
        canvas_height: int = 630,
    ) -> "RenderJob":
        """
        Create RenderJob from solved layout.
        
        Args:
            layout: Solved layout from constraint solver
            canvas_width: Canvas width
            canvas_height: Canvas height
            
        Returns:
            RenderJob ready for rendering
        """
        canvas = CanvasConfig(width=canvas_width, height=canvas_height)
        layers = []
        
        for i, element in enumerate(layout.get("elements", [])):
            layer = RenderLayer(
                id=element.get("id", f"layer_{i}"),
                type=LayerType(element.get("type", "rect")),
                x=element.get("x", 0),
                y=element.get("y", 0),
                width=element.get("width", 100),
                height=element.get("height", 50),
                content=element.get("content"),
                z_index=i,
                styles=LayerStyle(
                    fill=element.get("fill"),
                    font_size=element.get("fontSize"),
                    font_family=element.get("fontFamily"),
                ),
            )
            layers.append(layer)
        
        return cls(canvas=canvas, layers=layers)


@dataclass
class RenderMetadata:
    """Metadata about the rendering process"""
    render_time_ms: float
    format: str
    width: int
    height: int
    file_size_bytes: int
    pipeline_used: str  # "cairo" or "playwright"


@dataclass
class AssetBundle:
    """
    Output from the rendering pipeline.
    
    Contains the rendered image(s) and metadata.
    """
    success: bool
    buffers: dict[str, bytes] = field(default_factory=dict)  # format -> bytes
    metadata: Optional[RenderMetadata] = None
    errors: list[str] = field(default_factory=list)
    
    def get_buffer(self, fmt: str = "png") -> Optional[bytes]:
        """Get buffer for specific format"""
        return self.buffers.get(fmt)
    
    def get_base64(self, fmt: str = "png") -> Optional[str]:
        """Get base64 encoded buffer"""
        import base64
        buffer = self.buffers.get(fmt)
        if buffer:
            return base64.b64encode(buffer).decode("utf-8")
        return None
    
    def save_to_file(self, path: str, fmt: str = "png") -> bool:
        """Save buffer to file"""
        buffer = self.buffers.get(fmt)
        if buffer:
            with open(path, "wb") as f:
                f.write(buffer)
            return True
        return False

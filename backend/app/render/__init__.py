"""
Render Package
Dual-pipeline rendering engine for banner generation
"""

# Core interfaces (always available)
from .render_job import (
    RenderJob, RenderLayer, CanvasConfig, LayerStyle,
    AssetBundle, RenderMetadata, LayerType
)
from .asset_manager import AssetManager, get_asset_manager

# CairoSVG renderer (may fail if Cairo not installed)
try:
    from .svg_renderer import SVGRenderer, RenderingError
    CAIROSVG_AVAILABLE = True
except (ImportError, OSError):
    SVGRenderer = None
    RenderingError = Exception
    CAIROSVG_AVAILABLE = False

# Pipeline (works regardless of Cairo)
from .pipeline import RenderingPipeline, get_rendering_pipeline, render_job



"""
Rendering Pipeline Orchestrator
Main entry point for the dual-pipeline rendering system
"""

import time
from typing import Optional
from dataclasses import dataclass

from .render_job import RenderJob, AssetBundle, RenderMetadata, RenderLayer, LayerType
from .asset_manager import get_asset_manager

# CairoSVG import (may fail if Cairo not installed)
try:
    from .svg_renderer import SVGRenderer, CAIROSVG_AVAILABLE
except (ImportError, OSError):
    SVGRenderer = None
    CAIROSVG_AVAILABLE = False


@dataclass
class PipelineStats:
    """Statistics from rendering"""
    total_time_ms: float
    asset_fetch_time_ms: float
    render_time_ms: float
    pipeline_used: str
    layers_rendered: int


class RenderingPipeline:
    """
    Dual-pipeline rendering orchestrator.
    
    Routes requests to the appropriate renderer:
    - CairoSVG (Primary): Fast, ~15ms, for standard designs
    - Playwright (Fallback): Slower, for complex CSS
    
    Features:
    - Automatic pipeline selection
    - Asset prefetching
    - Multi-format export
    """
    
    def __init__(
        self,
        prefer_cairo: bool = True,
        fallback_enabled: bool = True,
    ):
        self.prefer_cairo = prefer_cairo
        self.fallback_enabled = fallback_enabled
        self.asset_manager = get_asset_manager()
    
    def _select_pipeline(self, job: RenderJob) -> str:
        """
        Select rendering pipeline based on job requirements.
        
        Returns:
            "cairo" or "playwright"
        """
        if not self.prefer_cairo:
            return "playwright"
        
        if not CAIROSVG_AVAILABLE:
            return "playwright"
        
        # Check if any layer requires browser-based rendering
        if job.requires_browser_render():
            return "playwright" if self.fallback_enabled else "cairo"
        
        return "cairo"
    
    async def _prefetch_assets(self, job: RenderJob) -> dict[str, bytes]:
        """
        Prefetch all external assets.
        
        Returns:
            Dict mapping asset ID to bytes
        """
        assets = {}
        urls = []
        
        # Collect URLs from assets
        for asset in job.assets:
            if asset.url:
                urls.append(asset.url)
            elif asset.base64:
                assets[asset.id] = self.asset_manager.image_from_base64(asset.base64)
        
        # Collect URLs from image layers
        for layer in job.layers:
            if layer.type == LayerType.IMAGE and layer.content:
                if layer.content.startswith(("http://", "https://")):
                    urls.append(layer.content)
        
        # Fetch all URLs concurrently
        if urls:
            fetched = await self.asset_manager.fetch_images_batch(urls)
            for url, data in fetched.items():
                # Use URL hash as ID
                asset_id = self.asset_manager._cache_key(url)
                assets[asset_id] = data
        
        return assets
    
    def _job_to_svg(self, job: RenderJob, assets: dict[str, bytes]) -> str:
        """
        Convert RenderJob to SVG string for CairoSVG rendering.
        """
        width = job.canvas.width
        height = job.canvas.height
        bg = job.canvas.background_color
        
        svg_parts = [
            f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg" '
            f'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {width} {height}">',
            f'  <rect width="{width}" height="{height}" fill="{bg}"/>',
        ]
        
        # Add defs for gradients, etc
        svg_parts.append('  <defs>')
        svg_parts.append('  </defs>')
        
        for layer in job.get_sorted_layers():
            svg_parts.append(self._layer_to_svg(layer, assets))
        
        svg_parts.append('</svg>')
        return '\n'.join(svg_parts)
    
    def _layer_to_svg(self, layer: RenderLayer, assets: dict[str, bytes]) -> str:
        """Convert a single layer to SVG element"""
        x, y, w, h = layer.x, layer.y, layer.width, layer.height
        s = layer.styles
        
        if layer.type == LayerType.TEXT:
            # Text element
            fill = s.fill or "#000000"
            font_size = s.font_size or 24
            font_family = s.font_family or "Inter, sans-serif"
            font_weight = s.font_weight or "normal"
            
            # Adjust y for baseline
            text_y = y + font_size
            
            attrs = [
                f'id="{layer.id}"',
                f'x="{x}"',
                f'y="{text_y}"',
                f'fill="{fill}"',
                f'font-size="{font_size}"',
                f'font-family="{font_family}"',
                f'font-weight="{font_weight}"',
            ]
            
            if s.opacity < 1.0:
                attrs.append(f'opacity="{s.opacity}"')
            
            content = layer.content or ""
            return f'  <text {" ".join(attrs)}>{content}</text>'
        
        elif layer.type == LayerType.IMAGE:
            # Image element
            src = layer.content or ""
            
            # Check if we have the image in assets
            if src.startswith(("http://", "https://")):
                asset_id = self.asset_manager._cache_key(src)
                if asset_id in assets:
                    # Convert to data URL
                    src = self.asset_manager.image_to_base64(assets[asset_id])
            
            attrs = [
                f'id="{layer.id}"',
                f'x="{x}"',
                f'y="{y}"',
                f'width="{w}"',
                f'height="{h}"',
                f'xlink:href="{src}"',
                'preserveAspectRatio="xMidYMid slice"',
            ]
            
            if s.opacity < 1.0:
                attrs.append(f'opacity="{s.opacity}"')
            if s.corner_radius:
                # For rounded images, use clipPath
                pass  # TODO: Implement clip path for rounded images
            
            return f'  <image {" ".join(attrs)}/>'
        
        elif layer.type == LayerType.PATH:
            # SVG path element
            attrs = [
                f'id="{layer.id}"',
                f'd="{layer.content or ""}"',
            ]
            
            if s.fill:
                attrs.append(f'fill="{s.fill}"')
            else:
                attrs.append('fill="none"')
            
            if s.stroke:
                attrs.append(f'stroke="{s.stroke}"')
                attrs.append(f'stroke-width="{s.stroke_width}"')
            
            if s.opacity < 1.0:
                attrs.append(f'opacity="{s.opacity}"')
            
            return f'  <path {" ".join(attrs)}/>'
        
        else:
            # Rectangle / shape
            attrs = [
                f'id="{layer.id}"',
                f'x="{x}"',
                f'y="{y}"',
                f'width="{w}"',
                f'height="{h}"',
            ]
            
            if s.fill:
                attrs.append(f'fill="{s.fill}"')
            else:
                attrs.append('fill="#E5E5E5"')
            
            if s.stroke:
                attrs.append(f'stroke="{s.stroke}"')
                attrs.append(f'stroke-width="{s.stroke_width}"')
            
            if s.corner_radius:
                attrs.append(f'rx="{s.corner_radius}"')
            
            if s.opacity < 1.0:
                attrs.append(f'opacity="{s.opacity}"')
            
            return f'  <rect {" ".join(attrs)}/>'
    
    async def _render_cairo(self, job: RenderJob, assets: dict[str, bytes]) -> AssetBundle:
        """Render using CairoSVG"""
        start = time.time()
        
        try:
            # Convert job to SVG
            svg = self._job_to_svg(job, assets)
            
            # Render using CairoSVG
            renderer = SVGRenderer(
                width=job.canvas.width,
                height=job.canvas.height,
            )
            
            outputs = await renderer.render(svg, job.output_formats)
            render_time = (time.time() - start) * 1000
            
            # Get first buffer for metadata
            first_fmt = job.output_formats[0] if job.output_formats else "png"
            first_buffer = outputs.get(first_fmt, b"")
            
            return AssetBundle(
                success=True,
                buffers=outputs,
                metadata=RenderMetadata(
                    render_time_ms=render_time,
                    format=first_fmt,
                    width=job.canvas.width,
                    height=job.canvas.height,
                    file_size_bytes=len(first_buffer),
                    pipeline_used="cairo",
                ),
            )
            
        except Exception as e:
            return AssetBundle(
                success=False,
                errors=[f"Cairo rendering failed: {str(e)}"],
            )
    
    async def _render_playwright(self, job: RenderJob) -> AssetBundle:
        """Render using Playwright"""
        from .browser_renderer import get_browser_renderer
        
        renderer = await get_browser_renderer()
        return await renderer.render(job)
    
    async def render(self, job: RenderJob) -> AssetBundle:
        """
        Render a job using the appropriate pipeline.
        
        Args:
            job: RenderJob specification
            
        Returns:
            AssetBundle with rendered images
        """
        total_start = time.time()
        
        # Prefetch assets
        asset_start = time.time()
        assets = await self._prefetch_assets(job)
        asset_time = (time.time() - asset_start) * 1000
        
        # Select pipeline
        pipeline = self._select_pipeline(job)
        
        # Render
        if pipeline == "cairo":
            result = await self._render_cairo(job, assets)
        else:
            result = await self._render_playwright(job)
        
        # Update metadata with total time
        if result.metadata:
            result.metadata.render_time_ms = (time.time() - total_start) * 1000
        
        return result
    
    async def render_svg(
        self,
        svg: str,
        output_formats: list[str] = None,
    ) -> AssetBundle:
        """
        Render raw SVG string.
        
        Args:
            svg: SVG string
            output_formats: Output formats
            
        Returns:
            AssetBundle
        """
        output_formats = output_formats or ["png"]
        start = time.time()
        
        try:
            renderer = SVGRenderer()
            outputs = await renderer.render(svg, output_formats)
            render_time = (time.time() - start) * 1000
            
            first_fmt = output_formats[0]
            first_buffer = outputs.get(first_fmt, b"")
            
            return AssetBundle(
                success=True,
                buffers=outputs,
                metadata=RenderMetadata(
                    render_time_ms=render_time,
                    format=first_fmt,
                    width=0,  # Unknown from raw SVG
                    height=0,
                    file_size_bytes=len(first_buffer),
                    pipeline_used="cairo",
                ),
            )
            
        except Exception as e:
            return AssetBundle(
                success=False,
                errors=[str(e)],
            )


# Singleton instance
_pipeline: Optional[RenderingPipeline] = None


def get_rendering_pipeline() -> RenderingPipeline:
    """Get singleton rendering pipeline"""
    global _pipeline
    if _pipeline is None:
        _pipeline = RenderingPipeline()
    return _pipeline


async def render_job(job: RenderJob) -> AssetBundle:
    """Convenience function to render a job"""
    pipeline = get_rendering_pipeline()
    return await pipeline.render(job)

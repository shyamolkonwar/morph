"""
Browser Renderer using Playwright
Fallback renderer for complex CSS effects
"""

import asyncio
from typing import Optional
from dataclasses import dataclass

from .render_job import RenderJob, AssetBundle, RenderMetadata


@dataclass
class BrowserConfig:
    """Configuration for browser renderer"""
    headless: bool = True
    timeout_ms: int = 30000
    viewport_scale: float = 1.0


class BrowserRenderer:
    """
    Playwright-based renderer for complex CSS effects.
    
    Used as fallback when designs require:
    - backdrop-filter (glassmorphism)
    - mix-blend-mode (advanced blending)
    - CSS grid layouts
    - Complex gradients
    """
    
    def __init__(self, config: Optional[BrowserConfig] = None):
        self.config = config or BrowserConfig()
        self._browser = None
        self._playwright = None
    
    async def _ensure_browser(self):
        """Ensure browser is initialized"""
        if self._browser is None:
            try:
                from playwright.async_api import async_playwright
                
                self._playwright = await async_playwright().start()
                self._browser = await self._playwright.chromium.launch(
                    headless=self.config.headless,
                )
            except ImportError:
                raise ImportError(
                    "Playwright not installed. Run: pip install playwright && playwright install chromium"
                )
    
    async def close(self):
        """Close browser and cleanup"""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
    
    def _generate_html(self, job: RenderJob) -> str:
        """
        Generate HTML from render job.
        
        Creates a DOM structure with inline styles matching the design.
        """
        width = job.canvas.width
        height = job.canvas.height
        bg = job.canvas.background_color
        
        html_parts = [
            '<!DOCTYPE html>',
            '<html><head>',
            '<meta charset="utf-8">',
            f'<style>',
            f'* {{ margin: 0; padding: 0; box-sizing: border-box; }}',
            f'body {{ width: {width}px; height: {height}px; background: {bg}; overflow: hidden; position: relative; }}',
            '</style>',
            '</head><body>',
        ]
        
        for layer in job.get_sorted_layers():
            style_parts = [
                f'position: absolute',
                f'left: {layer.x}px',
                f'top: {layer.y}px',
                f'width: {layer.width}px',
                f'height: {layer.height}px',
            ]
            
            s = layer.styles
            
            if s.fill:
                style_parts.append(f'background: {s.fill}')
            if s.opacity < 1.0:
                style_parts.append(f'opacity: {s.opacity}')
            if s.corner_radius:
                style_parts.append(f'border-radius: {s.corner_radius}px')
            if s.stroke:
                style_parts.append(f'border: {s.stroke_width}px solid {s.stroke}')
            if s.backdrop_filter:
                style_parts.append(f'backdrop-filter: {s.backdrop_filter}')
                style_parts.append(f'-webkit-backdrop-filter: {s.backdrop_filter}')
            if s.mix_blend_mode:
                style_parts.append(f'mix-blend-mode: {s.mix_blend_mode}')
            if s.shadow:
                shadow = s.shadow
                style_parts.append(
                    f"box-shadow: {shadow.get('offsetX', 0)}px "
                    f"{shadow.get('offsetY', 4)}px "
                    f"{shadow.get('blur', 10)}px "
                    f"{shadow.get('color', 'rgba(0,0,0,0.2)')}"
                )
            
            style = '; '.join(style_parts)
            
            if layer.type.value == "text":
                # Text layer
                font_size = s.font_size or 24
                font_family = s.font_family or 'Inter, system-ui, sans-serif'
                text_style = f'{style}; font-size: {font_size}px; font-family: {font_family}'
                if s.font_weight:
                    text_style += f'; font-weight: {s.font_weight}'
                text_style += f'; line-height: {s.line_height}'
                text_style += f'; text-align: {s.text_align}'
                
                content = layer.content or ''
                html_parts.append(f'<div id="{layer.id}" style="{text_style}">{content}</div>')
            
            elif layer.type.value == "image":
                # Image layer
                src = layer.content or ''
                html_parts.append(
                    f'<img id="{layer.id}" src="{src}" style="{style}; object-fit: cover;" />'
                )
            
            else:
                # Shape layer (rect, etc)
                html_parts.append(f'<div id="{layer.id}" style="{style}"></div>')
        
        html_parts.append('</body></html>')
        return '\n'.join(html_parts)
    
    async def render(self, job: RenderJob) -> AssetBundle:
        """
        Render a job using headless browser.
        
        Args:
            job: RenderJob specification
            
        Returns:
            AssetBundle with rendered image
        """
        import time
        start = time.time()
        
        try:
            await self._ensure_browser()
            
            # Create new page
            page = await self._browser.new_page(
                viewport={
                    'width': job.canvas.width,
                    'height': job.canvas.height,
                },
                device_scale_factor=job.canvas.pixel_density,
            )
            
            # Generate and load HTML
            html = self._generate_html(job)
            await page.set_content(html, wait_until='networkidle')
            
            # Capture screenshot
            buffers = {}
            
            for fmt in job.output_formats:
                if fmt in ('png', 'jpeg', 'webp'):
                    screenshot_type = 'png' if fmt == 'png' else fmt
                    buffer = await page.screenshot(
                        type=screenshot_type,
                        full_page=False,
                    )
                    buffers[fmt] = buffer
            
            await page.close()
            
            render_time = (time.time() - start) * 1000
            
            # Get first buffer for metadata
            first_fmt = job.output_formats[0] if job.output_formats else 'png'
            first_buffer = buffers.get(first_fmt, b'')
            
            return AssetBundle(
                success=True,
                buffers=buffers,
                metadata=RenderMetadata(
                    render_time_ms=render_time,
                    format=first_fmt,
                    width=job.canvas.width,
                    height=job.canvas.height,
                    file_size_bytes=len(first_buffer),
                    pipeline_used="playwright",
                ),
            )
            
        except Exception as e:
            return AssetBundle(
                success=False,
                errors=[str(e)],
            )
    
    async def render_html(
        self,
        html: str,
        width: int = 1200,
        height: int = 630,
        output_format: str = "png",
    ) -> Optional[bytes]:
        """
        Render raw HTML to image.
        
        Args:
            html: HTML string
            width: Viewport width
            height: Viewport height
            output_format: Output format (png, jpeg, webp)
            
        Returns:
            Image bytes or None
        """
        try:
            await self._ensure_browser()
            
            page = await self._browser.new_page(
                viewport={'width': width, 'height': height},
            )
            
            await page.set_content(html, wait_until='networkidle')
            buffer = await page.screenshot(type=output_format)
            await page.close()
            
            return buffer
            
        except Exception as e:
            print(f"Browser render failed: {e}")
            return None


# Singleton instance
_browser_renderer: Optional[BrowserRenderer] = None


async def get_browser_renderer() -> BrowserRenderer:
    """Get singleton browser renderer"""
    global _browser_renderer
    if _browser_renderer is None:
        _browser_renderer = BrowserRenderer()
    return _browser_renderer

"""
Unit Tests for Rendering Pipeline
"""

import pytest
from app.render.render_job import (
    RenderJob, RenderLayer, CanvasConfig, LayerStyle,
    AssetBundle, RenderMetadata, LayerType
)
from app.render.asset_manager import AssetManager, get_asset_manager
from app.render.pipeline import RenderingPipeline, get_rendering_pipeline


class TestRenderJob:
    """Test RenderJob interface"""
    
    def test_create_job(self):
        job = RenderJob(
            canvas=CanvasConfig(width=800, height=600),
            layers=[],
        )
        assert job.canvas.width == 800
        assert job.canvas.height == 600
    
    def test_layer_creation(self):
        layer = RenderLayer(
            id="headline",
            type=LayerType.TEXT,
            x=100, y=100,
            width=400, height=50,
            content="Hello World",
            styles=LayerStyle(font_size=32, fill="#FFFFFF"),
        )
        assert layer.id == "headline"
        assert layer.type == LayerType.TEXT
        assert layer.styles.font_size == 32
    
    def test_requires_browser_render_false(self):
        layer = RenderLayer(
            id="box",
            type=LayerType.RECT,
            styles=LayerStyle(fill="#FF0000"),
        )
        assert layer.requires_browser_render() is False
    
    def test_requires_browser_render_true(self):
        layer = RenderLayer(
            id="glass",
            type=LayerType.RECT,
            styles=LayerStyle(
                fill="rgba(255,255,255,0.2)",
                backdrop_filter="blur(10px)",
            ),
        )
        assert layer.requires_browser_render() is True
    
    def test_job_requires_browser(self):
        job = RenderJob(
            canvas=CanvasConfig(),
            layers=[
                RenderLayer(id="a", type=LayerType.RECT),
                RenderLayer(
                    id="b", type=LayerType.RECT,
                    styles=LayerStyle(mix_blend_mode="multiply"),
                ),
            ],
        )
        assert job.requires_browser_render() is True
    
    def test_sorted_layers(self):
        job = RenderJob(
            canvas=CanvasConfig(),
            layers=[
                RenderLayer(id="top", type=LayerType.TEXT, z_index=2),
                RenderLayer(id="bottom", type=LayerType.RECT, z_index=0),
                RenderLayer(id="middle", type=LayerType.IMAGE, z_index=1),
            ],
        )
        sorted_layers = job.get_sorted_layers()
        assert sorted_layers[0].id == "bottom"
        assert sorted_layers[1].id == "middle"
        assert sorted_layers[2].id == "top"
    
    def test_from_solved_layout(self):
        layout = {
            "elements": [
                {"id": "headline", "type": "text", "x": 100, "y": 50, "width": 400, "height": 60},
                {"id": "box", "type": "rect", "x": 0, "y": 0, "width": 800, "height": 400},
            ]
        }
        job = RenderJob.from_solved_layout(layout, canvas_width=800, canvas_height=400)
        
        assert job.canvas.width == 800
        assert len(job.layers) == 2


class TestAssetBundle:
    """Test AssetBundle output"""
    
    def test_create_bundle(self):
        bundle = AssetBundle(
            success=True,
            buffers={"png": b"fake_png_data"},
            metadata=RenderMetadata(
                render_time_ms=15.5,
                format="png",
                width=1200,
                height=630,
                file_size_bytes=1024,
                pipeline_used="cairo",
            ),
        )
        assert bundle.success is True
        assert bundle.get_buffer("png") == b"fake_png_data"
    
    def test_get_base64(self):
        bundle = AssetBundle(
            success=True,
            buffers={"png": b"test"},
        )
        b64 = bundle.get_base64("png")
        assert b64 == "dGVzdA=="


class TestAssetManager:
    """Test AssetManager"""
    
    def test_singleton(self):
        manager1 = get_asset_manager()
        manager2 = get_asset_manager()
        assert manager1 is manager2
    
    def test_cache_key(self):
        manager = AssetManager()
        key1 = manager._cache_key("https://example.com/image.png")
        key2 = manager._cache_key("https://example.com/image.png")
        assert key1 == key2
    
    def test_image_to_base64(self):
        manager = AssetManager()
        data_url = manager.image_to_base64(b"test", "image/png")
        assert data_url.startswith("data:image/png;base64,")
    
    def test_image_from_base64(self):
        manager = AssetManager()
        data_url = "data:image/png;base64,dGVzdA=="
        result = manager.image_from_base64(data_url)
        assert result == b"test"


class TestRenderingPipeline:
    """Test RenderingPipeline"""
    
    def test_singleton(self):
        pipeline1 = get_rendering_pipeline()
        pipeline2 = get_rendering_pipeline()
        assert pipeline1 is pipeline2
    
    def test_select_cairo_pipeline(self):
        from app.render import CAIROSVG_AVAILABLE
        
        pipeline = RenderingPipeline()
        job = RenderJob(
            canvas=CanvasConfig(),
            layers=[
                RenderLayer(id="box", type=LayerType.RECT),
            ],
        )
        selected = pipeline._select_pipeline(job)
        
        # If Cairo is available, should select cairo; otherwise playwright
        if CAIROSVG_AVAILABLE:
            assert selected == "cairo"
        else:
            assert selected == "playwright"  # Correct fallback
    
    def test_select_playwright_pipeline(self):
        pipeline = RenderingPipeline()
        job = RenderJob(
            canvas=CanvasConfig(),
            layers=[
                RenderLayer(
                    id="glass", type=LayerType.RECT,
                    styles=LayerStyle(backdrop_filter="blur(10px)"),
                ),
            ],
        )
        selected = pipeline._select_pipeline(job)
        assert selected == "playwright"
    
    def test_job_to_svg(self):
        pipeline = RenderingPipeline()
        job = RenderJob(
            canvas=CanvasConfig(width=800, height=400, background_color="#000000"),
            layers=[
                RenderLayer(
                    id="headline", type=LayerType.TEXT,
                    x=100, y=50, width=400, height=60,
                    content="Hello World",
                    styles=LayerStyle(fill="#FFFFFF", font_size=32),
                ),
            ],
        )
        svg = pipeline._job_to_svg(job, {})
        
        assert '<svg width="800" height="400"' in svg
        assert 'id="headline"' in svg
        assert 'Hello World' in svg


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

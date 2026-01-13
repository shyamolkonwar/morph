"""
SVG Verification API Endpoint
POST /api/v1/verify-svg
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from app.pipeline.verification import VerificationPipeline, VerificationResult

router = APIRouter()


class VerifySVGRequest(BaseModel):
    """Request body for SVG verification"""
    svg: str = Field(..., min_length=10, description="SVG string to verify")
    canvas_width: int = Field(default=1200, ge=100, le=4096)
    canvas_height: int = Field(default=630, ge=100, le=4096)
    brand_colors: Optional[list[str]] = Field(
        default=None,
        description="Expected brand colors (for palette validation)"
    )


class LayerResult(BaseModel):
    """Result for a single verification layer"""
    status: str
    errors: list[str]


class VerifySVGResponse(BaseModel):
    """Response from SVG verification"""
    overall: str  # "pass" or "fail"
    layers: dict[str, LayerResult]
    timestamp: str


@router.post("/verify-svg", response_model=VerifySVGResponse)
async def verify_svg(request: VerifySVGRequest):
    """
    Verify an SVG design against all quality layers.
    
    Layers:
    1. Syntax - Valid XML/SVG structure
    2. Spatial - No overlaps, within bounds
    3. Text Readability - Font size ≥ 14px, WCAG contrast
    4. Color Palette - Only approved colors used
    5. Rendering - Renders without errors
    """
    pipeline = VerificationPipeline(
        canvas_width=request.canvas_width,
        canvas_height=request.canvas_height,
        approved_palette=request.brand_colors,
    )
    
    report = await pipeline.verify(request.svg)
    
    return VerifySVGResponse(
        overall=report.overall.value,
        layers={
            layer: LayerResult(status=result.value, errors=errors)
            for layer, (result, errors) in report.layers.items()
        },
        timestamp=report.timestamp,
    )


@router.get("/verify-svg")
async def verify_svg_health():
    """Health check for verification endpoint"""
    return {
        "status": "ready",
        "layers": [
            "syntax",
            "spatial",
            "text_readability",
            "color_palette",
            "rendering",
        ],
    }

"""
Banner Generation API Endpoint
POST /api/v1/generate-banner
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.config import get_settings
from app.agents.design_agent import DesignRefinementAgent
from app.pipeline.verification import VerificationPipeline

router = APIRouter()


class GenerateBannerRequest(BaseModel):
    """Request body for banner generation"""
    prompt: str = Field(..., min_length=5, max_length=1000, description="Design prompt")
    canvas_width: int = Field(default=1200, ge=100, le=4096)
    canvas_height: int = Field(default=630, ge=100, le=4096)
    brand_colors: Optional[list[str]] = Field(
        default=["#FF6B35", "#FFFFFF", "#004E89"],
        description="Brand color palette in hex format"
    )
    max_iterations: Optional[int] = Field(default=None, ge=1, le=10)


class GenerateBannerResponse(BaseModel):
    """Response from banner generation"""
    status: str
    svg: Optional[str] = None
    png_base64: Optional[str] = None
    errors: Optional[list[str]] = None
    iterations: int
    verification_report: Optional[dict] = None
    constraint_graph: Optional[dict] = None


@router.post("/generate-banner", response_model=GenerateBannerResponse)
async def generate_banner(request: GenerateBannerRequest):
    """
    Generate a professional banner using first-principles design.
    
    Pipeline:
    1. GOD Prompt → Creative Director + Layout Engineer personas
    2. Constraint Graph generation
    3. SVG code generation
    4. 5-layer verification
    5. Iterative refinement (if needed)
    6. Rendering to PNG/WebP
    """
    settings = get_settings()
    
    # Check for API key
    if settings.default_ai_provider == "anthropic" and not settings.anthropic_api_key:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")
    if settings.default_ai_provider == "openai" and not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Initialize design agent
        agent = DesignRefinementAgent(
            canvas_width=request.canvas_width,
            canvas_height=request.canvas_height,
            brand_colors=request.brand_colors,
            max_iterations=request.max_iterations or settings.max_iterations,
        )
        
        # Generate design with iterative refinement
        result = await agent.generate(request.prompt)
        
        return GenerateBannerResponse(
            status="success",
            svg=result.get("svg"),
            png_base64=result.get("png_base64"),
            iterations=result.get("iterations", 1),
            verification_report=result.get("verification_report"),
            constraint_graph=result.get("constraint_graph"),
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )


@router.get("/generate-banner")
async def generate_banner_health():
    """Health check for generation endpoint"""
    settings = get_settings()
    return {
        "status": "ready",
        "ai_provider": settings.default_ai_provider,
        "max_iterations": settings.max_iterations,
        "default_canvas": f"{settings.default_canvas_width}x{settings.default_canvas_height}",
    }

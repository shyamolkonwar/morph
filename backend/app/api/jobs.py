"""
Job Status API Endpoint
GET /api/v1/status/{job_id}
POST /api/v1/generate-async
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from celery.result import AsyncResult

from celery_app import celery_app


router = APIRouter()


class AsyncGenerateRequest(BaseModel):
    """Request body for async banner generation"""
    prompt: str = Field(..., min_length=5, max_length=1000, description="Design prompt")
    canvas_width: int = Field(default=1200, ge=100, le=4096)
    canvas_height: int = Field(default=630, ge=100, le=4096)
    brand_colors: Optional[list[str]] = Field(
        default=["#FF6B35", "#FFFFFF", "#004E89"],
        description="Brand color palette in hex format"
    )
    max_iterations: Optional[int] = Field(default=5, ge=1, le=10)


class AsyncGenerateResponse(BaseModel):
    """Response from async generation request"""
    job_id: str
    status: str
    status_url: str


class JobStatusResponse(BaseModel):
    """Response for job status check"""
    job_id: str
    status: str  # PENDING, STARTED, SUCCESS, FAILURE
    progress: Optional[int] = None
    step: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None


@router.post("/generate-async", response_model=AsyncGenerateResponse, status_code=202)
async def generate_banner_async(request: AsyncGenerateRequest):
    """
    Fire and Forget: Enqueue banner generation job.
    
    Returns 202 Accepted with job_id for status polling.
    
    Pipeline runs asynchronously:
    1. LLM reasoning (~10-15s)
    2. Constraint solving (~1-2s)
    3. Rendering (~2-5s)
    """
    from app.tasks.generation import orchestrate_design_generation
    from app.config import get_settings
    
    settings = get_settings()
    
    # Check for API key
    if settings.default_ai_provider == "openrouter" and not settings.openrouter_api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    # Enqueue the generation task
    task = orchestrate_design_generation.delay(
        user_prompt=request.prompt,
        brand_colors=request.brand_colors,
        canvas_width=request.canvas_width,
        canvas_height=request.canvas_height,
        max_iterations=request.max_iterations,
    )
    
    return AsyncGenerateResponse(
        job_id=task.id,
        status="PENDING",
        status_url=f"/api/v1/status/{task.id}",
    )


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Poll job status.
    
    States:
    - PENDING: Job is in Upstash queue, waiting for worker
    - STARTED: Worker is processing (includes step and progress)
    - SUCCESS: Generation complete (includes result with SVG)
    - FAILURE: Generation failed (includes error message)
    """
    result = AsyncResult(job_id, app=celery_app)
    
    # Map Celery states to our API states
    status = result.status
    
    response = JobStatusResponse(
        job_id=job_id,
        status=status,
    )
    
    if status == "PENDING":
        response.step = "queued"
        response.progress = 0
        
    elif status == "STARTED":
        # Get task metadata for progress
        meta = result.info or {}
        response.step = meta.get("step", "processing")
        response.progress = meta.get("progress", 0)
        
    elif status == "SUCCESS":
        response.result = result.result
        response.progress = 100
        response.step = "complete"
        
    elif status == "FAILURE":
        response.error = str(result.result) if result.result else "Unknown error"
        response.step = "failed"
        
    elif status == "REVOKED":
        response.status = "CANCELLED"
        response.step = "cancelled"
        
    return response


@router.delete("/status/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a pending or running job.
    """
    result = AsyncResult(job_id, app=celery_app)
    
    if result.status in ["PENDING", "STARTED"]:
        result.revoke(terminate=True)
        return {"status": "cancelled", "job_id": job_id}
    else:
        return {"status": result.status, "job_id": job_id, "message": "Cannot cancel completed job"}

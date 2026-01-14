"""
Job Status API Endpoint
GET /api/v1/status/{job_id}
POST /api/v1/generate-async
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from celery.result import AsyncResult

from celery_app import celery_app
from app.dependencies.auth import get_current_user, CurrentUser
from app.services.supabase_service import get_supabase_service


router = APIRouter()


class AsyncGenerateRequest(BaseModel):
    """Request body for async banner generation"""
    project_id: str = Field(..., description="Project ID to associate generation with")
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
async def generate_banner_async(
    request: AsyncGenerateRequest,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Fire and Forget: Enqueue banner generation job.
    
    Requires authentication. Creates generation record and async job.
    
    Returns 202 Accepted with job_id for status polling.
    """
    from app.tasks.generation import orchestrate_design_generation
    from app.config import get_settings
    
    settings = get_settings()
    supabase = get_supabase_service()
    
    # Verify project ownership
    project = await supabase.get_project(request.project_id, user.user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Check for API key
    if settings.default_ai_provider == "openrouter" and not settings.openrouter_api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    # Create generation record
    generation = await supabase.create_generation(
        project_id=request.project_id,
        user_prompt=request.prompt,
        canvas_width=request.canvas_width,
        canvas_height=request.canvas_height,
        brand_colors=request.brand_colors
    )
    
    # Enqueue the generation task
    task = orchestrate_design_generation.delay(
        generation_id=generation["id"],
        user_prompt=request.prompt,
        brand_colors=request.brand_colors,
        canvas_width=request.canvas_width,
        canvas_height=request.canvas_height,
        max_iterations=request.max_iterations,
    )
    
    # Create async job record
    await supabase.create_async_job(
        celery_task_id=task.id,
        user_id=user.user_id,
        task_name="orchestrate_design_generation",
        input_params=request.dict(),
        generation_id=generation["id"]
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

"""
Projects API Endpoints
Manage user projects and generations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional

from app.dependencies.auth import get_current_user, CurrentUser
from app.services.supabase_service import get_supabase_service


router = APIRouter()


# ═══════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════

class CreateProjectRequest(BaseModel):
    """Request to create a new project"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class ProjectResponse(BaseModel):
    """Project details"""
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    created_at: str
    updated_at: str


class GenerationResponse(BaseModel):
    """Generation details"""
    id: str
    project_id: str
    user_prompt: str
    canvas_width: int
    canvas_height: int
    brand_colors: list[str]
    status: str
    svg_output: Optional[str] = None
    verification_status: Optional[str] = None
    created_at: str


# ═══════════════════════════════════════════════════════════
# PROJECTS ENDPOINTS
# ═══════════════════════════════════════════════════════════

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: CreateProjectRequest,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Create a new project for the authenticated user.
    
    Requires authentication via Supabase JWT.
    """
    try:
        supabase = get_supabase_service()
        project = await supabase.create_project(
            user_id=user.user_id,
            title=request.title,
            description=request.description
        )
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )
        
        return project
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Project creation failed: {str(e)}"
        )


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    user: CurrentUser = Depends(get_current_user)
):
    """
    List all projects for the authenticated user.
    
    Returns projects ordered by creation date (newest first).
    """
    try:
        supabase = get_supabase_service()
        projects = await supabase.get_user_projects(user.user_id)
        return projects
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Get a specific project by ID.
    
    Only returns the project if it belongs to the authenticated user.
    """
    try:
        supabase = get_supabase_service()
        project = await supabase.get_project(project_id, user.user_id)
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or access denied"
            )
        
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.get("/projects/{project_id}/generations", response_model=list[GenerationResponse])
async def list_project_generations(
    project_id: str,
    user: CurrentUser = Depends(get_current_user)
):
    """
    List all generations for a specific project.
    
    Returns generations ordered by creation date (newest first).
    """
    try:
        supabase = get_supabase_service()
        
        # Verify project ownership
        project = await supabase.get_project(project_id, user.user_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or access denied"
            )
        
        # Fetch generations
        generations = await supabase.get_project_generations(project_id)
        return generations
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch generations: {str(e)}"
        )

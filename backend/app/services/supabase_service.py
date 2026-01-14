"""
Supabase Service
Wrapper for Supabase client operations
"""

import os
from typing import Optional
from functools import lru_cache

from app.config import get_settings


class SupabaseService:
    """Supabase client wrapper for database operations"""
    
    def __init__(self):
        self.settings = get_settings()
        self._client = None
    
    @property
    def client(self):
        """Lazy load Supabase client"""
        if self._client is None:
            from supabase import create_client, Client
            
            url = self.settings.supabase_url or os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            key = self.settings.supabase_service_role_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not url or not key:
                raise ValueError(
                    "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
                )
            
            self._client = create_client(url, key)
        return self._client
    
    # ═══════════════════════════════════════════════════════════
    # PROJECTS
    # ═══════════════════════════════════════════════════════════
    
    async def create_project(
        self,
        user_id: str,
        title: str,
        description: Optional[str] = None
    ) -> dict:
        """Create a new project"""
        result = self.client.table("projects").insert({
            "user_id": user_id,
            "title": title,
            "description": description,
            "status": "draft"
        }).execute()
        
        return result.data[0] if result.data else None
    
    async def get_user_projects(self, user_id: str) -> list[dict]:
        """Get all projects for a user"""
        result = self.client.table("projects").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        return result.data or []
    
    async def get_project(self, project_id: str, user_id: str) -> Optional[dict]:
        """Get a specific project (with ownership check)"""
        result = self.client.table("projects").select("*").eq(
            "id", project_id
        ).eq("user_id", user_id).execute()
        
        return result.data[0] if result.data else None
    
    # ═══════════════════════════════════════════════════════════
    # GENERATIONS
    # ═══════════════════════════════════════════════════════════
    
    async def create_generation(
        self,
        project_id: str,
        user_prompt: str,
        canvas_width: int = 1200,
        canvas_height: int = 630,
        brand_colors: Optional[list[str]] = None
    ) -> dict:
        """Create a new generation record"""
        result = self.client.table("generations").insert({
            "project_id": project_id,
            "user_prompt": user_prompt,
            "canvas_width": canvas_width,
            "canvas_height": canvas_height,
            "brand_colors": brand_colors or ["#FF6B35", "#FFFFFF", "#004E89"],
            "status": "pending"
        }).execute()
        
        return result.data[0] if result.data else None
    
    async def update_generation(
        self,
        generation_id: str,
        updates: dict
    ) -> dict:
        """Update a generation record"""
        result = self.client.table("generations").update(
            updates
        ).eq("id", generation_id).execute()
        
        return result.data[0] if result.data else None
    
    async def get_generation(self, generation_id: str) -> Optional[dict]:
        """Get a generation by ID"""
        result = self.client.table("generations").select("*").eq(
            "id", generation_id
        ).execute()
        
        return result.data[0] if result.data else None
    
    async def get_project_generations(self, project_id: str) -> list[dict]:
        """Get all generations for a project"""
        result = self.client.table("generations").select("*").eq(
            "project_id", project_id
        ).order("created_at", desc=True).execute()
        
        return result.data or []
    
    # ═══════════════════════════════════════════════════════════
    # ASYNC JOBS
    # ═══════════════════════════════════════════════════════════
    
    async def create_async_job(
        self,
        celery_task_id: str,
        user_id: str,
        task_name: str,
        input_params: dict,
        generation_id: Optional[str] = None
    ) -> dict:
        """Create an async job record"""
        result = self.client.table("async_jobs").insert({
            "celery_task_id": celery_task_id,
            "user_id": user_id,
            "generation_id": generation_id,
            "task_name": task_name,
            "input_params": input_params,
            "status": "PENDING"
        }).execute()
        
        return result.data[0] if result.data else None
    
    async def get_job_by_celery_id(self, celery_task_id: str) -> Optional[dict]:
        """Get job by Celery task ID"""
        result = self.client.table("async_jobs").select("*").eq(
            "celery_task_id", celery_task_id
        ).execute()
        
        return result.data[0] if result.data else None
    
    # ═══════════════════════════════════════════════════════════
    # RENDER ASSETS
    # ═══════════════════════════════════════════════════════════
    
    async def create_render_asset(
        self,
        generation_id: str,
        asset_type: str,
        storage_path: str,
        public_url: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> dict:
        """Create a render asset record"""
        result = self.client.table("render_assets").insert({
            "generation_id": generation_id,
            "asset_type": asset_type,
            "storage_path": storage_path,
            "public_url": public_url,
            "file_size_bytes": file_size_bytes,
            "width": width,
            "height": height
        }).execute()
        
        return result.data[0] if result.data else None
    
    async def get_generation_assets(self, generation_id: str) -> list[dict]:
        """Get all assets for a generation"""
        result = self.client.table("render_assets").select("*").eq(
            "generation_id", generation_id
        ).execute()
        
        return result.data or []


@lru_cache()
def get_supabase_service() -> SupabaseService:
    """Get singleton Supabase service"""
    return SupabaseService()
